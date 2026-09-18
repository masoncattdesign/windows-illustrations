#!/usr/bin/env node
// build-showcase.mjs — inline the pilot set and the tokens into one self
// contained showcase page.
//
// Reads the ORIGINAL exports in corpus-real/, not corpus-real/prepared/. The
// prepared set is flattened onto white for training; this page needs the alpha,
// because every tile is split across the two Windows surfaces and a white
// rectangle would defeat the entire demonstration.
//
//   node scripts/build-showcase.mjs --out build/showcase.html

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const PX = +arg('px', 360);

const T = JSON.parse(await readFile(join(ROOT, 'schema/tokens.json'), 'utf8'));
const M = JSON.parse(await readFile(join(ROOT, 'parts/manifest.json'), 'utf8'));
const prep = JSON.parse(await readFile(join(ROOT, 'corpus-real/prepared/index.json'), 'utf8'));

const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = h => 0.2126 * lin(parseInt(h.substr(1, 2), 16)) + 0.7152 * lin(parseInt(h.substr(3, 2), 16)) + 0.0722 * lin(parseInt(h.substr(5, 2), 16));
const cr = (a, b) => { const x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };

const TONE = {};
for (const fam of Object.keys(T.tone)) {
  if (fam === 'grey') continue;                       // neutrals are not outermost candidates
  TONE[fam] = {};
  for (const step of Object.keys(T.tone[fam])) {
    const hex = T.tone[fam][step];
    TONE[fam][step] = { hex, light: +cr(hex, '#F3F3F3').toFixed(2), dark: +cr(hex, '#202020').toFixed(2) };
  }
}

/* The Figma frames carry a white background rect, so the exports are opaque
 * even though they have an alpha channel. This page splits every tile across
 * both Windows surfaces, which needs the ground actually gone.
 *
 * Flood filled inward from the border rather than keyed globally: half these
 * assets contain pale greys and near-white screens, and a global white-to-alpha
 * would punch holes straight through a laptop screen. Only white CONNECTED to
 * the edge is the frame background. Threshold is deliberately tight, so a thin
 * antialias halo survives rather than risk eating artwork. */
async function unmat(file) {
  const img = sharp(file).resize(PX, PX, { fit: 'contain', background: '#ffffff' }).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => { if (x >= 0 && y >= 0 && x < w && y < h && !seen[y * w + x]) stack.push(x, y); };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  let cleared = 0;
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    const i = y * w + x;
    if (seen[i]) continue;
    seen[i] = 1;
    const o = i * ch;
    if (Math.min(data[o], data[o + 1], data[o + 2]) < 250) continue;   // artwork edge, stop here
    data[o + 3] = 0; cleared++;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return { buf: await sharp(data, { raw: { width: w, height: h, channels: ch } }).png({ compressionLevel: 9 }).toBuffer(), cleared, total: w * h };
}

const assets = [];
let flagged = [];
for (const s of prep.samples) {
  const { buf: png, cleared, total } = await unmat(join(ROOT, 'corpus-real', s.from));
  // a frame background should be a large share of the canvas. much less means
  // the artwork runs to the edge and the ground did not lift cleanly.
  if (cleared / total < 0.15) flagged.push(`${s.slug} (${(cleared / total * 100).toFixed(0)}% lifted)`);
  assets.push({ slug: s.slug, treatment: s.treatment, caption: s.caption, img: 'data:image/png;base64,' + png.toString('base64') });
}

const data =
  'const ASSETS = ' + JSON.stringify(assets) + ';\n' +
  'const TONE = ' + JSON.stringify(TONE) + ';\n' +
  'const ELEVATION = ' + JSON.stringify(T.elevation) + ';\n' +
  'const SHAPES = ' + JSON.stringify([...new Set(M.parts.base.map(r => r.shape || r.slug))]) + ';\n' +
  'const SECONDARY = ' + JSON.stringify(M.parts.secondary.map(r => r.slug)) + ';\n' +
  'const STAMP = ' + JSON.stringify(new Date().toISOString().slice(0, 10)) + ';';

const tpl = await readFile(join(ROOT, 'tools/showcase.template.html'), 'utf8');
if (!tpl.includes('/*__DATA__*/')) { console.error('template is missing the /*__DATA__*/ marker'); process.exit(1); }
const html = tpl.replace('/*__DATA__*/', data);

const out = resolve(ROOT, arg('out', 'build/showcase.html'));
await mkdir(dirname(out), { recursive: true });
await writeFile(out, html);

console.log(`built ${out}`);
console.log(`  ${assets.length} assets inlined at ${PX}px, frame background flood lifted`);
if (flagged.length) console.log(`  CHECK, little background lifted: ${flagged.join(', ')}`);
console.log(`  ${Object.keys(TONE).length} tone families, ${Object.keys(T.elevation).length} elevation recipes`);
console.log(`  ${(html.length / 1024 / 1024).toFixed(2)}mb, self contained`);
