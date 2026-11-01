import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const CHROME = process.env.CHROME_PATH || `${process.env.HOME}/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((q, r) => {
  let p = join('out', decodeURIComponent(q.url.split('?')[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p));
}).listen(4173);
const URL = 'http://localhost:4173/';
const results = []; const rec = (id, ok, note = '') => { results.push({ id, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${note}`); };

const browser = await chromium.launch({ executablePath: CHROME });
const ids = ['hero', 'about', 'skills', 'projects', 'timeline', 'contact'];

// FR-01: three scroll positions per station
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL);
  const supported = await page.evaluate(() => CSS.supports('animation-timeline', 'view()'));
  let ok = supported; const notes = [];
  for (const id of ids) {
    const [top, h] = await page.evaluate((id) => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); return [r.top + scrollY, r.height]; }, id);
    const vh = 900;
    const spots = id === 'hero' ? [0, vh * 0.4, vh * 0.8] : [top - vh * 0.85, top - vh * 0.45 + h / 2 - vh / 2 + vh * 0.45, top + h - vh * 0.1 + vh * 0.0];
    const vals = [];
    for (const y of spots) {
      await page.evaluate((y) => scrollTo(0, y), Math.max(0, y)); await page.waitForTimeout(120);
      vals.push(await page.evaluate((id) => { const l = document.querySelector(`#${id} .layer`); const cs = getComputedStyle(l); const m = new DOMMatrix(cs.transform); return `${(+cs.opacity).toFixed(2)}/${m.a.toFixed(2)}`; }, id));
    }
    const distinct = new Set(vals).size === 3; if (!distinct) ok = false; notes.push(`${id}:${vals.join(' | ')}`);
  }
  rec('FR-01', ok, notes.join(' ; ')); await page.close();
}
// FR-02 hero visible @375 and 1440
for (const w of [375, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: w === 375 ? 700 : 900 } });
  await page.goto(URL);
  const ok = await page.evaluate(() => ['#hero h1', '#hero .eyebrow', '#hero .lead'].every((s) => { const r = document.querySelector(s).getBoundingClientRect(); const o = +getComputedStyle(document.querySelector('#hero .layer')).opacity; return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth && o > 0.9; }));
  rec(`FR-02@${w}`, ok); await page.close();
}
// content checks (reduced motion => all static)
const rm = await browser.newPage({ viewport: { width: 375, height: 700 }, reducedMotion: 'reduce' });
await rm.goto(URL);
rec('FR-03', await rm.evaluate(() => document.querySelector('#about p').textContent.length > 0 && document.documentElement.scrollWidth <= innerWidth));
rec('FR-04', (await rm.locator('#skills li').count()) >= 1);
const cards = await rm.locator('[data-project]').count();
const full = await rm.evaluate(() => [...document.querySelectorAll('[data-project]')].every((c) => ['title', 'description', 'tech', 'link'].every((f) => c.querySelector(`[data-f=${f}]`)?.textContent.trim())));
rec('FR-05', cards >= 3 && cards <= 5 && full, `cards=${cards}`);
rec('FR-06', (await rm.locator('[data-milestone]').count()) >= 3);
rec('FR-07/08', await rm.evaluate(() => document.querySelectorAll('#contact li').length >= 4), '(links are placeholders; real-link check n/a until filled)');
// FR-10 reduced motion: no animation, all opacity 1, no transform
rec('FR-10', await rm.evaluate(() => [...document.querySelectorAll('.layer')].every((l) => { const c = getComputedStyle(l); return c.animationName === 'none' && c.opacity === '1' && c.transform === 'none'; })));
// FR-11 fallback: simulate a browser without support (the @supports block fails) and check vertical, fully visible layout
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 700 } });
  await ctx.route('**/*.css', async (route) => {
    const res = await route.fetch(); let body = await res.text();
    const n = (body.match(/@supports\s*\(animation-timeline:\s*view\(\)\)/g) || []).length;
    body = body.replace(/@supports\s*\(animation-timeline:\s*view\(\)\)/g, '@supports (x-unsupported-timeline:view())');
    globalThis.__supN = n; await route.fulfill({ response: res, body });
  });
  const page = await ctx.newPage(); await page.goto(URL);
  const ok = await page.evaluate(() => [...document.querySelectorAll('.layer')].every((l) => { const c = getComputedStyle(l); const r = l.getBoundingClientRect(); return c.animationName === 'none' && c.opacity === '1' && c.transform === 'none' && r.width <= innerWidth; }));
  const ys = await page.evaluate(() => [...document.querySelectorAll('.station')].map((s) => s.getBoundingClientRect().top));
  rec('FR-11', ok && globalThis.__supN > 0 && ys.every((y, i) => i === 0 || y > ys[i - 1]), `supports-blocks=${globalThis.__supN}`); await ctx.close();
}
// FR-09 skip
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL); const t = Date.now();
  await page.click('a.skip'); await page.waitForFunction(() => document.getElementById('summary').getBoundingClientRect().top < innerHeight);
  const dt = Date.now() - t;
  const txt = await page.locator('#summary').innerText();
  rec('FR-09', dt <= 1000 && (await page.locator('#summary li').count()) === 3 && txt.length > 0, `${dt}ms`); await page.close();
}
// FR-12 no cookies + events
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); await page.goto(URL);
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(500);
  await page.evaluate(() => { const a = document.createElement('a'); a.href = '#x'; a.dataset.track = 'test'; document.body.append(a); a.click(); });
  const ev = await page.evaluate(() => window.__events);
  const cookies = await ctx.cookies();
  rec('FR-12', ev.includes('reached-last-station') && ev.includes('click-test') && cookies.length === 0, JSON.stringify(ev)); await ctx.close();
}
// FR-15, FR-16
{
  const page = await browser.newPage(); await page.goto(URL);
  rec('FR-15', await page.evaluate(() => !!document.title && !!document.querySelector('meta[name=description]') && !!document.querySelector('meta[property="og:image"]')));
  const n = execSync('grep -rc PLACEHOLDER content | awk -F: \'{s+=$2} END{print s}\'').toString().trim();
  rec('FR-16', +n > 0, `${n} lines`);
}
// FR-18 contrast
{
  const css = readFileSync('app/globals.css', 'utf8');
  const v = (n) => css.match(new RegExp(`--${n}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
  const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const pairs = [['fg', 'bg'], ['muted', 'bg'], ['accent', 'bg'], ['fg', 'panel'], ['muted', 'panel'], ['accent', 'panel']].map(([a, b]) => cr(v(a), v(b)));
  rec('FR-18', pairs.every((x) => x >= 4.5), pairs.map((x) => x.toFixed(1)).join(','));
}
await browser.close(); server.close();
const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `FAILED: ${failed.map((f) => f.id).join(', ')}` : 'ALL MUST PASS');
process.exit(failed.length ? 1 : 0);
