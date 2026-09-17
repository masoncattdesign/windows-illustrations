// build-tool.mjs — inline parts + tokens into the Windows builder page.
//
//   node scripts/build-tool.mjs                      -> build/builder-windowswip.html
//   node scripts/build-tool.mjs --out ../somewhere/docs/builder-windowswip.html
//
// The page is generated, never hand edited. Re-run it after changing parts/ or
// schema/tokens.json and the tool picks the change up. Self contained on purpose
// so it works from file://, from GitHub Pages, and pasted anywhere else.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const TIERS = ['base', 'secondary', 'tertiary'];

const tokens = JSON.parse(readFileSync(join(ROOT, 'schema/tokens.json'), 'utf8'));

const parts = {};
let count = 0;
for (const tier of TIERS) {
  parts[tier] = {};
  const dir = join(ROOT, 'parts', tier);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.svg')).sort()) {
    const slug = f.replace(/\.svg$/, '');
    const src = readFileSync(join(dir, f), 'utf8');
    const m = src.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (!m) continue;
    const body = m[1].replace(/\s+/g, ' ').trim();
    if (!body) continue;
    parts[tier][slug] = { body };
    count++;
  }
}

const data =
  'const TOKENS = ' + JSON.stringify(tokens) + ';\n' +
  'const PARTS = ' + JSON.stringify(parts) + ';';

const tpl = readFileSync(join(ROOT, 'tools/builder.template.html'), 'utf8');
if (!tpl.includes('/*__DATA__*/')) { console.error('template is missing the /*__DATA__*/ marker'); process.exit(1); }
const html = tpl.replace('/*__DATA__*/', data);

const oi = process.argv.indexOf('--out');
const out = oi >= 0 ? resolve(ROOT, process.argv[oi + 1]) : join(ROOT, 'build/builder-windowswip.html');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);

console.log(`built ${out}`);
console.log(`  ${count} parts inlined (${TIERS.map(t => t + ' ' + Object.keys(parts[t]).length).join(', ')})`);
console.log(`  ${Object.keys(tokens.tone).length} tone families, ${Object.keys(tokens.elevation).length} elevation recipes`);
console.log(`  ${(html.length / 1024).toFixed(1)}kb, self contained`);
