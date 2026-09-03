#!/usr/bin/env node
// Report on what is sitting in intake/. Read only. Touches nothing.
// This is how NEXT.md item 1 gets checked off.
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, green, yellow, dim } from './lib.mjs';

const INTAKE = path.join(ROOT, 'intake');
const BUCKETS = ['wds', 'wip', 'guidelines'];
const VECTOR = new Set(['.svg']);
// Guidelines arrive as whatever they were written in. Deck and board exports
// are images, and that is a legitimate form for a guideline to take, so they
// count here even though an image would be flagged in the artwork buckets.
const DOC = new Set(['.md', '.pdf', '.docx', '.pptx', '.txt', '.rtf', '.png', '.jpg', '.jpeg', '.webp']);

async function walk(dir, base = dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full, base)));
    else if (e.isFile()) {
      const { size } = await stat(full);
      out.push({ rel: path.relative(base, full), ext: path.extname(e.name).toLowerCase(), size });
    }
  }
  return out;
}

const human = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);

let grandTotal = 0;
const oddities = [];

for (const bucket of BUCKETS) {
  const files = (await walk(path.join(INTAKE, bucket))).filter((f) => f.rel !== 'README.md');
  grandTotal += files.length;

  console.log(`\n${green(`intake/${bucket}/`)}  ${files.length} file${files.length === 1 ? '' : 's'}`);
  if (files.length === 0) {
    console.log(dim('  empty'));
    continue;
  }

  const byExt = new Map();
  for (const f of files) {
    const cur = byExt.get(f.ext) ?? { n: 0, bytes: 0 };
    byExt.set(f.ext, { n: cur.n + 1, bytes: cur.bytes + f.size });
  }
  for (const [ext, v] of [...byExt].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`  ${(ext || '(no ext)').padEnd(10)} ${String(v.n).padStart(5)}   ${human(v.bytes)}`);
  }

  for (const f of files) {
    if (bucket === 'guidelines') {
      if (!DOC.has(f.ext)) oddities.push(`${bucket}/${f.rel} is not a document format`);
    } else if (!VECTOR.has(f.ext)) {
      oddities.push(`${bucket}/${f.rel} is not an SVG`);
    }
    if (f.size > 5 * 1048576) oddities.push(`${bucket}/${f.rel} is unusually large (${human(f.size)})`);
  }
}

console.log(`\n${grandTotal} file${grandTotal === 1 ? '' : 's'} total in intake/`);

if (oddities.length > 0) {
  console.log(`\n${yellow(`${oddities.length} thing${oddities.length === 1 ? '' : 's'} to look at:`)}`);
  for (const o of oddities.slice(0, 40)) console.log(`  ${o}`);
  if (oddities.length > 40) console.log(dim(`  ... and ${oddities.length - 40} more`));
}

if (grandTotal === 0) {
  console.log(dim('\nNothing dropped yet. See NEXT.md item 1.'));
}
