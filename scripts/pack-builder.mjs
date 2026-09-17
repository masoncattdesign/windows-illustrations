// pack-builder.mjs — emit a Builder-compatible parts pack from parts/.
//
//   node scripts/pack-builder.mjs --out build/builder-parts
//
// Builder (expressive-assets docs/builder.js, loadGlyph) has three hard rules:
//   1. it collects querySelectorAll('path') only, so rect/circle/ellipse are dropped
//   2. every path must be fill="currentColor" or "none", or it throws
//   3. all paths are merged into one `d`, so grouping and transforms are lost
// This script converts our primitives to satisfy all three without touching parts/.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const TIERS = ['base', 'secondary', 'tertiary'];
const r = n => Math.round(n * 1000) / 1000;

const rectPath = (x, y, w, h, rx) => {
  x = +x; y = +y; w = +w; h = +h; rx = Math.min(+rx || 0, w / 2, h / 2);
  if (!rx) return `M${x} ${y}H${r(x + w)}V${r(y + h)}H${x}Z`;
  return `M${r(x + rx)} ${y}H${r(x + w - rx)}A${rx} ${rx} 0 0 1 ${r(x + w)} ${r(y + rx)}` +
         `V${r(y + h - rx)}A${rx} ${rx} 0 0 1 ${r(x + w - rx)} ${r(y + h)}` +
         `H${r(x + rx)}A${rx} ${rx} 0 0 1 ${x} ${r(y + h - rx)}` +
         `V${r(y + rx)}A${rx} ${rx} 0 0 1 ${r(x + rx)} ${y}Z`;
};
const circlePath = (cx, cy, rad) => {
  cx = +cx; cy = +cy; rad = +rad;
  return `M${r(cx - rad)} ${cy}A${rad} ${rad} 0 1 0 ${r(cx + rad)} ${cy}A${rad} ${rad} 0 1 0 ${r(cx - rad)} ${cy}Z`;
};
const attr = (tag, name) => { const m = tag.match(new RegExp(name + '="([^"]*)"')); return m ? m[1] : null; };

function toPaths(svg) {
  const ds = [];
  for (const m of svg.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*>/g)) ds.push(m[1]);
  for (const m of svg.matchAll(/<rect\b[^>]*>/g)) {
    const t = m[0];
    ds.push(rectPath(attr(t, 'x') || 0, attr(t, 'y') || 0, attr(t, 'width'), attr(t, 'height'), attr(t, 'rx')));
  }
  for (const m of svg.matchAll(/<circle\b[^>]*>/g)) {
    const t = m[0];
    ds.push(circlePath(attr(t, 'cx'), attr(t, 'cy'), attr(t, 'r')));
  }
  return ds;
}

const oi = process.argv.indexOf('--out');
const out = oi >= 0 ? process.argv[oi + 1] : 'build/builder-parts';
mkdirSync(join(ROOT, out), { recursive: true });

const parts = [];
let converted = 0, skipped = [];
for (const tier of TIERS) {
  let files = [];
  try { files = readdirSync(join(ROOT, 'parts', tier)).filter(f => f.endsWith('.svg')); } catch { continue; }
  for (const f of files) {
    const slug = f.replace(/\.svg$/, '');
    const src = readFileSync(join(ROOT, 'parts', tier, f), 'utf8');
    const ds = toPaths(src);
    if (!ds.length) { skipped.push(`${tier}/${slug} (no drawable geometry)`); continue; }
    const d = ds.join(' ');
    // one path, currentColor, 80 grid — exactly what loadGlyph accepts
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">` +
                `<path fill="currentColor" d="${d}"/></svg>\n`;
    const name = `wds-${tier}-${slug}.svg`;
    writeFileSync(join(ROOT, out, name), svg);
    parts.push({
      id: `wds.${tier}.${slug}`,
      name: `${slug.replace(/-/g, ' ')} (${tier})`,
      path: `parts/${name}`
    });
    converted++;
  }
}
writeFileSync(join(ROOT, out, 'builder-parts.json'), JSON.stringify({ parts }, null, 2) + '\n');
console.log(`packed ${converted} parts -> ${out}/`);
console.log(`manifest: ${out}/builder-parts.json (${parts.length} entries)`);
if (skipped.length) console.log('skipped:\n  ' + skipped.join('\n  '));
