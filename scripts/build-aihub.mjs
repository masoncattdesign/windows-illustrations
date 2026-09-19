#!/usr/bin/env node
// build-aihub.mjs — inline the tokens into the generated-asset studio page.
//
// Only tokens go in. No assets: the page is a hub for what you produce, and
// baking the pilot set into a file that ships to a public Pages site would put
// unreleased Windows illustrations on a public URL for no gain.
//
//   node scripts/build-aihub.mjs --out ../expressive-assets/docs/builder-windowsai.html

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };

const tokens = JSON.parse(await readFile(join(ROOT, 'schema/tokens.json'), 'utf8'));
const tpl = await readFile(join(ROOT, 'tools/aihub.template.html'), 'utf8');
if (!tpl.includes('/*__DATA__*/')) { console.error('template is missing the /*__DATA__*/ marker'); process.exit(1); }

const html = tpl.replace('/*__DATA__*/', 'const TOKENS = ' + JSON.stringify(tokens) + ';');
const out = resolve(ROOT, arg('out', 'build/builder-windowsai.html'));
await mkdir(dirname(out), { recursive: true });
await writeFile(out, html);

console.log(`built ${out}`);
console.log(`  ${Object.keys(tokens.tone).length} tone families, ${Object.keys(tokens.elevation).length} elevation recipes`);
console.log(`  no assets inlined, on purpose`);
console.log(`  ${(html.length / 1024).toFixed(1)}kb, self contained`);
