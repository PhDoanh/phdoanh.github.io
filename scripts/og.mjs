import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(`<body style="margin:0;background:radial-gradient(circle at 50% 40%,#16204a,#05060f);color:#e8ecf8;font:700 72px system-ui;display:grid;place-items:center;height:100vh"><div style="text-align:center">[PLACEHOLDER: full-name]<div style="font:400 36px system-ui;color:#7cc4ff;margin-top:16px">[PLACEHOLDER: role]</div></div>`);
await p.screenshot({ path: 'public/og.png' });
await b.close();
