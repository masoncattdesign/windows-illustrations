#!/usr/bin/env node
// gen-base.mjs — generates the base shape library.
//
// Base shapes are geometry, not drawings, so they are generated rather than
// hand extracted. That buys three things the hand drawn set could not have:
//
//   1. Exact sizes. Every shape fits a bounding box of 64, 48 or 32, which is
//      100% / 75% / 50% of the 64 safe area, all on the 8 grid.
//   2. Constant corner rounding. The authored convention in the Figma file is
//      a fixed radius, not a proportional one: rect-48x48, rect-56x40 and
//      rect-64x48 all use rx=3 despite being three different sizes. A scale
//      transform would shrink the radius with the shape and break that. So
//      each size is real geometry with the radius held at CORNER.
//   3. One rule for every silhouette, so nothing is special because of how it
//      happened to be drawn.
//
// Secondary and tertiary parts stay hand extracted from Figma. They carry
// meaning; these carry none.
//
// Usage: node scripts/gen-base.mjs [--out parts/base]

import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const CANVAS = 80;      // part canvas
const C = CANVAS / 2;   // centre
const CORNER = 3;       // constant corner radius, from the rect convention

// 100% / 75% / 50% of the 64 safe area. Width of the bounding box.
const SIZES = { lg: 64, md: 48, sm: 32 };

const round = (n) => Math.round(n * 1e4) / 1e4;

/* ---------- vector helpers ---------- */
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a, k) => ({ x: a.x * k, y: a.y * k });
const len = (a) => Math.hypot(a.x, a.y);
const unit = (a) => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };

/* ---------- rounded polygon ----------
 * Vertices must be given clockwise on screen. Because SVG y grows downward,
 * generating them in increasing angle order does exactly that, which is why
 * every arc below sweeps 1.
 *
 * At each vertex we trim back along both edges by t = r / tan(theta/2), then
 * join the two trim points with a circular arc. If t would overrun half an
 * adjacent edge we clamp it, and recompute the radius that trim actually
 * implies, so a clamped corner still draws a true fillet instead of a lie.
 */
function roundedPolygon(pts, r) {
  const n = pts.length;
  const corners = pts.map((V, i) => {
    const P = pts[(i - 1 + n) % n];
    const N = pts[(i + 1) % n];
    const u = unit(sub(P, V));
    const v = unit(sub(N, V));
    const dot = Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y));
    const theta = Math.acos(dot);
    let t = r / Math.tan(theta / 2);
    t = Math.min(t, len(sub(P, V)) / 2, len(sub(N, V)) / 2);
    return { A: add(V, mul(u, t)), B: add(V, mul(v, t)), r: t * Math.tan(theta / 2) };
  });

  let d = `M${round(corners[0].B.x)} ${round(corners[0].B.y)}`;
  for (let i = 1; i <= n; i++) {
    const c = corners[i % n];
    d += `L${round(c.A.x)} ${round(c.A.y)}`;
    d += `A${round(c.r)} ${round(c.r)} 0 0 1 ${round(c.B.x)} ${round(c.B.y)}`;
  }
  return d + 'Z';
}

/* Vertices of a regular polygon, then fitted so the BOUNDING BOX is centred
 * on the canvas and spans `size` horizontally. Fitting by bounding box rather
 * than by circumcircle is what makes a triangle and a hexagon of the same
 * size look like the same size. */
function regular(sides, startDeg, size) {
  const raw = [];
  for (let i = 0; i < sides; i++) {
    const a = ((startDeg + (360 / sides) * i) * Math.PI) / 180;
    raw.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  const xs = raw.map((p) => p.x), ys = raw.map((p) => p.y);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const k = size / w;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return { pts: raw.map((p) => ({ x: C + (p.x - cx) * k, y: C + (p.y - cy) * k })), w: size, h: h * k };
}

/* ---------- the set ----------
 * Every polygon sits level: a flat bottom edge, or a clean point for the
 * diamond. Shapes that carry meaning on their own (star, heart, crescent)
 * are deliberately absent, because a base is a container, not a statement.
 * Near-round polygons (heptagon and up) are absent because at 64px they are
 * a circle with extra path data.
 */
const SHAPES = {
  circle:   { label: 'circle',   kind: 'circle' },
  square:   { label: 'square',   kind: 'rect', ratio: 1 },
  rect:     { label: 'rectangle',kind: 'rect', ratio: 0.75 },   // 4:3
  triangle: { label: 'triangle', kind: 'poly', sides: 3, start: -90 },
  diamond:  { label: 'diamond',  kind: 'poly', sides: 4, start: -90 },
  pentagon: { label: 'pentagon', kind: 'poly', sides: 5, start: -90 },
  hexagon:  { label: 'hexagon',  kind: 'poly', sides: 6, start: 0 },   // flat top
  octagon:  { label: 'octagon',  kind: 'poly', sides: 8, start: 22.5 } // flat top
};

function body(slug, spec, size) {
  if (spec.kind === 'circle') {
    return `<circle cx="${C}" cy="${C}" r="${size / 2}" fill="currentColor" data-part="base"/>`;
  }
  if (spec.kind === 'rect') {
    const w = size, h = round(size * spec.ratio);
    return `<rect x="${round(C - w / 2)}" y="${round(C - h / 2)}" width="${w}" height="${h}" rx="${CORNER}" fill="currentColor" data-part="base"/>`;
  }
  const { pts } = regular(spec.sides, spec.start, size);
  return `<path fill="currentColor" data-part="base" d="${roundedPolygon(pts, CORNER)}"/>`;
}

const SIZE_WORD = { lg: 'large', md: 'medium', sm: 'small' };

function svg(slug, spec, key, size) {
  const label = `Base ${spec.label} ${SIZE_WORD[key]}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}" fill="none" role="img" aria-label="${label}" data-tier="base" data-slug="${slug}-${key}" data-shape="${slug}" data-size="${key}">
  ${body(slug, spec, size)}
</svg>
`;
}

const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? process.argv[outArg + 1] : join(ROOT, 'parts', 'base');

await mkdir(OUT, { recursive: true });

const written = [];
for (const [slug, spec] of Object.entries(SHAPES)) {
  for (const [key, size] of Object.entries(SIZES)) {
    const name = `${slug}-${key}.svg`;
    await writeFile(join(OUT, name), svg(slug, spec, key, size), 'utf8');
    written.push(name);
  }
}

const kept = (await readdir(OUT)).filter((f) => f.endsWith('.svg') && !written.includes(f));

console.log(`gen-base  wrote ${written.length} files`);
console.log(`  ${Object.keys(SHAPES).length} shapes x ${Object.keys(SIZES).length} sizes`);
console.log(`  sizes ${Object.entries(SIZES).map(([k, v]) => `${k} ${v}`).join(', ')} on the ${CANVAS} canvas, corner radius ${CORNER}`);
if (kept.length) console.log(`  left alone: ${kept.join(', ')}`);
