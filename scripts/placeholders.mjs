import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const out = execSync(`grep -rn "PLACEHOLDER" content app components README.md --include=* || true`, { encoding: 'utf8' });
const rows = out.trim().split('\n').filter(Boolean).flatMap((l) => {
  const m = l.match(/^([^:]+):(\d+):(.*)$/); if (!m) return [];
  return [...m[3].matchAll(/\[PLACEHOLDER: ([^\]]+)\]/g)].map((x) => `| ${x[1]} | \`${m[1]}:${m[2]}\` |`);
});
writeFileSync('PLACEHOLDERS.md', `# Remaining placeholders (${rows.length})\n\n| Placeholder | Location |\n|---|---|\n${rows.join('\n')}\n`);
console.log(`PLACEHOLDERS.md: ${rows.length} entries`);
