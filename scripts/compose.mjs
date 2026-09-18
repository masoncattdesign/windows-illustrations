// compose.mjs — build an illustration from a recipe plus the parts library.
// Node standard library only, ESM, zero dependencies.
//
//   node scripts/compose.mjs recipes/safety-shield.json
//   node scripts/compose.mjs recipes/*.json --out build/
//
// A recipe is data. This file is the only thing that knows how to turn it into
// artwork, so the grammar lives in one place and every asset obeys it.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const T = JSON.parse(readFileSync(join(ROOT, 'schema/tokens.json'), 'utf8'));

const die = m => { console.error('compose: ' + m); process.exit(1); };

function tone(ref) {
  if (!ref) return 'currentColor';
  if (ref.startsWith('#')) return ref;
  const [fam, step] = ref.split('.');
  const v = T.tone[fam] && T.tone[fam][step];
  if (!v) die(`unknown tone "${ref}". families: ${Object.keys(T.tone).join(', ')}`);
  return v;
}

// pull the drawable markup out of a part file, drop its svg wrapper
function partBody(tier, slug) {
  const p = join(ROOT, 'parts', tier, slug + '.svg');
  if (!existsSync(p)) die(`missing part: parts/${tier}/${slug}.svg`);
  const s = readFileSync(p, 'utf8');
  const m = s.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!m) die(`parts/${tier}/${slug}.svg is not a well formed svg`);
  return m[1].trim();
}

// A base shape is named by what it is, not by how big it is: {part:"circle",
// size:"md"} rather than {part:"circle-48"}. Size is a property of the layer,
// which is what lets the tool offer a size control instead of three near
// duplicate entries in the shape palette. Parts without a size (every secondary
// shape) resolve to their slug unchanged.
function partSlug(spec) {
  return spec.size ? `${spec.part}-${spec.size}` : spec.part;
}

// placement: parts are authored on an 80 canvas, assets on 512.
// a placement scales about the canvas centre so a shape stays centred as it grows.
function place(body, { scale = 1, x = 0, y = 0 }, fill) {
  const c = T.partCanvas / 2;
  const k = T.canvas / T.partCanvas;
  const tx = (x + c) * k, ty = (y + c) * k;
  const g = `translate(${round(tx)} ${round(ty)}) scale(${round(k * scale)}) translate(${-c} ${-c})`;
  // parts paint with currentColor, which resolves against `color`, not `fill`.
  return `<g transform="${g}" color="${fill}">${body}</g>`;
}
const round = n => Math.round(n * 1000) / 1000;

function elevationDefs(names) {
  const out = [];
  for (const n of names) {
    const e = T.elevation[n];
    if (!e) die(`unknown elevation "${n}"`);
    if (e.type === 'drop') {
      out.push(`<filter id="fx-${n}" x="-40%" y="-40%" width="180%" height="180%">` +
        `<feDropShadow dx="${e.dx}" dy="${e.dy}" stdDeviation="${e.blur / 2}" ` +
        `flood-color="${e.color}" flood-opacity="${e.opacity}"/></filter>`);
    } else {
      out.push(`<filter id="fx-${n}" x="-40%" y="-40%" width="180%" height="180%">` +
        `<feOffset dx="${e.dx}" dy="${e.dy}" in="SourceAlpha" result="o"/>` +
        `<feGaussianBlur stdDeviation="${e.blur / 2}" in="o" result="b"/>` +
        `<feComposite operator="out" in="SourceAlpha" in2="b" result="inv"/>` +
        `<feFlood flood-color="${e.color}" flood-opacity="${e.opacity}" result="c"/>` +
        `<feComposite operator="in" in="c" in2="inv" result="s"/>` +
        `<feComposite operator="atop" in="s" in2="SourceGraphic"/></filter>`);
    }
  }
  return out;
}

function layoutFor(spec, index, total) {
  if (spec.layout) {
    const l = T.layout[spec.layout];
    if (!l) die(`unknown layout "${spec.layout}"`);
    return { ...l, ...pick(spec, ['scale', 'x', 'y']) };
  }
  if (spec.anchor) {
    const a = T.layout.anchors[spec.anchor];
    if (!a) die(`unknown anchor "${spec.anchor}"`);
    return { scale: T.layout.modifier.scale, x: a[0], y: a[1], ...pick(spec, ['scale', 'x', 'y']) };
  }
  const base = total > 1 && index === 0 ? T.layout.lead : T.layout.solo;
  return { ...base, ...pick(spec, ['scale', 'x', 'y']) };
}
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o[k] !== undefined).map(k => [k, o[k]]));

// --- build-time guard: the surfaces rule from the guidelines, enforced ---
// A fill only carries a silhouette on BOTH Windows surfaces inside a narrow band.
const SURFACES = { light: '#F3F3F3', dark: '#202020' };
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = h => 0.2126 * lin(parseInt(h.substr(1, 2), 16)) + 0.7152 * lin(parseInt(h.substr(3, 2), 16)) + 0.0722 * lin(parseInt(h.substr(5, 2), 16));
const contrast = (a, b) => { const x = lum(a), y = lum(b); const [hi, lo] = x > y ? [x, y] : [y, x]; return (hi + 0.05) / (lo + 0.05); };

export function checkSurfaces(recipe) {
  // the outermost drawn shape is what defines the silhouette
  const outer = recipe.base || (recipe.secondary || [])[0];
  if (!outer) return [];
  const hex = tone(outer.tone);
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return [];
  const l = contrast(hex, SURFACES.light), d = contrast(hex, SURFACES.dark);
  const notes = [];
  if (l < 3 && d < 3) notes.push(`outermost ${partSlug(outer)} (${outer.tone}) fails both surfaces: ${l.toFixed(2)} light, ${d.toFixed(2)} dark`);
  else if (l < 3) notes.push(`outermost ${partSlug(outer)} (${outer.tone}) fails on light: ${l.toFixed(2)}. outline it, contain it, or demote it`);
  else if (d < 3) notes.push(`outermost ${partSlug(outer)} (${outer.tone}) fails on dark: ${d.toFixed(2)}. outline it, contain it, or demote it`);
  return notes;
}

export function compose(recipe) {
  const layers = [];
  const fxUsed = new Set();

  const add = (tier, spec, lay) => {
    const fill = tone(spec.tone);
    let g = place(partBody(tier, partSlug(spec)), lay, fill);
    if (spec.elevation) {
      for (const n of [].concat(spec.elevation)) fxUsed.add(n);
      const f = [].concat(spec.elevation).map(n => `url(#fx-${n})`).join(' ');
      g = `<g filter="${f}">${g}</g>`;
    }
    layers.push(`  <!-- ${tier}: ${partSlug(spec)} -->\n  ${g}`);
  };

  if (recipe.base) add('base', recipe.base, layoutFor(recipe.base, 0, 1));
  const sec = recipe.secondary || [];
  sec.forEach((s, i) => add('secondary', s, layoutFor(s, i, sec.length)));
  (recipe.tertiary || []).forEach(s => add('tertiary', s, layoutFor(s, 0, 2)));

  const defs = elevationDefs([...fxUsed]);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T.canvas} ${T.canvas}"`,
    `     width="${T.canvas}" height="${T.canvas}" fill="none"`,
    `     role="img" aria-label="${esc(recipe.label || recipe.slug)}"`,
    `     data-slug="${recipe.slug}" data-concept="${recipe.concept || ''}">`,
    defs.length ? '  <defs>' + defs.join('') + '</defs>' : '',
    ...layers,
    '</svg>', ''
  ].filter(Boolean).join('\n');
}
const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

const args = process.argv.slice(2);
if (args.length) {
  const oi = args.indexOf('--out');
  const out = oi >= 0 ? args[oi + 1] : 'build';
  const files = (oi >= 0 ? args.slice(0, oi) : args);
  mkdirSync(join(ROOT, out), { recursive: true });
  let warnings = 0;
  for (const f of files) {
    const r = JSON.parse(readFileSync(join(ROOT, f), 'utf8'));
    const svg = compose(r);
    const dest = join(ROOT, out, (r.slug || basename(f, '.json')) + '.svg');
    writeFileSync(dest, svg);
    console.log(`composed ${r.slug}  ->  ${out}/${r.slug}.svg  (${svg.length}b)`);
    for (const n of checkSurfaces(r)) { console.log(`  ! ${n}`); warnings++; }
  }
  if (warnings) console.log(`\n${warnings} surface warning(s). see guidelines page 05.`);
}
