#!/usr/bin/env node
// parts-manifest.mjs — regenerates parts/manifest.json from the files on disk.
//
// The manifest used to be hand kept, which meant it could disagree with the
// parts directory and nothing would notice. Now it is derived: the SVGs are the
// source of truth and this only reports what is actually there.
//
// Usage: node scripts/parts-manifest.mjs

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TIERS = ['base', 'secondary', 'tertiary'];
const SIZE_ORDER = { lg: 0, md: 1, sm: 2 };

const attr = (src, name) => (src.match(new RegExp(`${name}="([^"]*)"`)) || [])[1];

const manifest = {
  canvas: 80,
  safeArea: 64,
  margin: 8,
  gridStep: 8,
  sizes: { lg: 64, md: 48, sm: 32 },
  parts: {}
};

let total = 0;
for (const tier of TIERS) {
  const dir = join(ROOT, 'parts', tier);
  manifest.parts[tier] = [];
  if (!existsSync(dir)) continue;

  const rows = [];
  for (const f of (await readdir(dir)).filter((f) => f.endsWith('.svg'))) {
    const src = await readFile(join(dir, f), 'utf8');
    const head = src.slice(0, src.indexOf('>') + 1);
    const slug = attr(head, 'data-slug') || f.replace(/\.svg$/, '');
    const row = { slug, label: attr(head, 'aria-label') || slug };
    const shape = attr(head, 'data-shape');
    const size = attr(head, 'data-size');
    if (shape) row.shape = shape;
    if (size) row.size = size;
    // an empty body means the shape failed to export from Figma
    if (!/<(path|rect|circle|ellipse|polygon)\b/.test(src)) row.empty = true;
    rows.push(row);
  }

  rows.sort((a, b) =>
    (a.shape || a.slug).localeCompare(b.shape || b.slug) ||
    (SIZE_ORDER[a.size] ?? 9) - (SIZE_ORDER[b.size] ?? 9)
  );
  manifest.parts[tier] = rows;
  total += rows.length;
}

await writeFile(join(ROOT, 'parts', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

const shapeCount = new Set(manifest.parts.base.map((r) => r.shape || r.slug)).size;
console.log(`parts-manifest  wrote parts/manifest.json`);
console.log(`  ${total} parts (${TIERS.map((t) => `${t} ${manifest.parts[t].length}`).join(', ')})`);
console.log(`  base covers ${shapeCount} shapes`);
const empty = TIERS.flatMap((t) => manifest.parts[t].filter((r) => r.empty).map((r) => `${t}/${r.slug}`));
if (empty.length) console.log(`  EMPTY, will not render: ${empty.join(', ')}`);
