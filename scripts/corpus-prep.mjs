#!/usr/bin/env node
// corpus-prep.mjs — turn the Figma exports in corpus-real/ into a training set.
//
// Three things the raw exports are not ready for:
//
//   1. They carry alpha. Most training pipelines composite a transparent PNG
//      onto BLACK, which would erase the greys that half this set is built
//      from. Flattened onto white here, deliberately and visibly.
//   2. Five of them are called Illustration@3x-N, which is not a caption.
//   3. The set has two visual treatments in it. Thirteen are layered objects
//      with inner shadows and depth; three (fingerprint, pin, wifi) are flat
//      gradient marks with no depth at all. Captioning the difference lets the
//      model learn both and lets you ask for one at generation time. Leaving it
//      uncaptioned is how a LoRA averages two looks into neither.
//
//   node scripts/corpus-prep.mjs               -> prepared/ at 1024
//   node scripts/corpus-prep.mjs --size 512

import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'corpus-real');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const PX = +arg('size', 1024);
const OUT = join(SRC, 'prepared');
const TRIGGER = 'wdsill';

// treatment: "depth" = layered object with inner shadows; "mark" = flat gradient symbol
const ASSETS = {
  'Chat@3x-1.png':        { slug: 'chat-typing',     subject: 'a grey speech bubble with a blue pill of three dots and a small purple bubble', t: 'depth' },
  'ChatBubble.png':       { slug: 'chat-pair',       subject: 'two overlapping speech bubbles, one grey with text lines and one blue', t: 'depth' },
  'File@3x.png':          { slug: 'folder-stack',    subject: 'a stack of folders in blue, purple and grey', t: 'depth' },
  'Illustration@3x-10.png': { slug: 'laptop-content', subject: 'an open laptop showing a photo, a call tile and a chat tile on screen', t: 'depth' },
  'Illustration@3x-7.png':  { slug: 'folder-sync',   subject: 'a grey and blue folder with a browser logo and a green sync badge', t: 'depth' },
  'Illustration@3x-8.png':  { slug: 'laptop',        subject: 'a plain open laptop with a pale empty screen', t: 'depth' },
  'Illustration@3x-9.png':  { slug: 'device-sync',   subject: 'a laptop and a phone with two blue arrows curving between them', t: 'depth' },
  'Illustration@3x.png':    { slug: 'fingerprint',   subject: 'a fingerprint drawn as concentric rounded strokes', t: 'mark' },
  'Keyboard.png':         { slug: 'keyboard',        subject: 'a light grey keyboard seen at a slight angle', t: 'depth' },
  'KeyboardDual.png':     { slug: 'keyboard-numpad', subject: 'a light grey keyboard with a separate dark numeric keypad', t: 'depth' },
  'LocationPin.png':      { slug: 'location-pin',    subject: 'a map location pin with a hollow circle', t: 'mark' },
  'Multi-modal@3x.png':   { slug: 'multi-modal',     subject: 'a grey bubble with coloured dots, a blue bubble with a sound waveform and a teal rounded square', t: 'depth' },
  'News@3x.png':          { slug: 'news',            subject: 'a stacked article card with a headline bar, a photo thumbnail and text lines', t: 'depth' },
  'Protected Sound.png':  { slug: 'protected-sound', subject: 'a purple shield with a check over a bubble holding a teal sound waveform', t: 'depth' },
  'SpeakToText.png':      { slug: 'speak-to-text',   subject: 'a blue bubble with text lines, a grey bubble and a small purple bubble of dots', t: 'depth' },
  'Wifi.png':             { slug: 'wifi',            subject: 'a wifi symbol of three arcs above a dot', t: 'mark' }
};

const TREATMENT = {
  depth: 'layered flat vector illustration, soft inner shadows and stacked planes, subtle depth, blue purple and grey palette, plain white background',
  mark:  'flat vector symbol, smooth blue to purple gradient, no outline, no shadow, plain white background'
};

await mkdir(OUT, { recursive: true });

const present = (await readdir(SRC)).filter(f => /\.png$/i.test(f));
const missing = Object.keys(ASSETS).filter(f => !present.includes(f));
const unknown = present.filter(f => !ASSETS[f]);

let n = 0;
const index = [];
for (const [file, a] of Object.entries(ASSETS)) {
  if (!present.includes(file)) continue;
  const png = await sharp(join(SRC, file))
    .flatten({ background: '#ffffff' })          // NOT onto black. see note above.
    .resize(PX, PX, { fit: 'contain', background: '#ffffff' })
    .png().toBuffer();
  const caption = `${TRIGGER}, ${a.subject}, ${TREATMENT[a.t]}`;
  await writeFile(join(OUT, a.slug + '.png'), png);
  await writeFile(join(OUT, a.slug + '.txt'), caption + '\n', 'utf8');
  index.push({ slug: a.slug, from: file, treatment: a.t, caption });
  n++;
}

const byT = index.reduce((m, r) => (m[r.treatment] = (m[r.treatment] || 0) + 1, m), {});
await writeFile(join(OUT, 'index.json'), JSON.stringify({
  generated: new Date().toISOString().slice(0, 10),
  trigger: TRIGGER, size: PX, background: 'white, flattened from alpha',
  count: n, byTreatment: byT, samples: index
}, null, 2) + '\n', 'utf8');

console.log(`corpus-prep  ${n} assets -> corpus-real/prepared`);
console.log(`  ${PX}px, alpha flattened onto white`);
console.log(`  treatments: ${Object.entries(byT).map(([k, v]) => `${k} ${v}`).join(', ')}`);
if (missing.length) console.log(`  MISSING, expected but not found: ${missing.join(', ')}`);
if (unknown.length) console.log(`  UNNAMED, present but not in the map: ${unknown.join(', ')}`);
