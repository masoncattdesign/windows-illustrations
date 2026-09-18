#!/usr/bin/env node
// corpus.mjs — generate a training corpus from the parts library.
//
// M365 curated ~50 hand drawn spots because that was all they had. We have a
// composer, so we can enumerate the system instead: every valid combination of
// base shape, size, tone and secondary part, rendered in the exact target
// style, on grid, already passing the surfaces check.
//
// Two things fall out of that for free:
//
//   1. Captions. The recipe already says what is in the picture, so the caption
//      is written from data rather than typed by a human. Caption drift is the
//      usual way a style LoRA goes wrong; here it cannot happen.
//   2. Provenance. Nothing in the corpus came from anywhere except parts/ and
//      schema/tokens.json, both of which are ours.
//
// This is augmentation, not a replacement for the real assets. A model trained
// only on this learns the composer's distribution, which is narrower than what
// a designer draws. Mix in the pilot set and the back catalog.
//
//   node scripts/corpus.mjs --out corpus --limit 600
//   node scripts/corpus.mjs --out corpus --size 1024 --bg transparent

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { compose, checkSurfaces } from './compose.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(await (await import('node:fs/promises')).readFile(join(ROOT, 'schema/tokens.json'), 'utf8'));
const M = JSON.parse(await (await import('node:fs/promises')).readFile(join(ROOT, 'parts/manifest.json'), 'utf8'));

const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : dflt; };
const OUT   = join(ROOT, arg('out', 'corpus'));
const PX    = +arg('size', 512);
const BG    = arg('bg', 'white');
const LIMIT = +arg('limit', 600);
const SEED  = +arg('seed', 7);
const TRIGGER = arg('trigger', 'wdsill');

/* deterministic shuffle, so a rerun gives the same corpus */
let _s = SEED;
const rnd = () => (_s = (_s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = (a) => a[Math.floor(rnd() * a.length)];
function shuffle(a){ const b = a.slice(); for(let i=b.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; }

/* ---------- the vocabulary ---------- */
const bases = M.parts.base.filter(r => !r.empty);
const secondaries = M.parts.secondary.filter(r => !r.empty);
const families = Object.keys(T.tone).filter(f => f !== 'grey');
// `loud` is the dual safe step, so it is the honest default for an outermost shape
const baseSteps = ['loud', 'heavy'];
const fillTones = ['grey.paper', 'grey.subtle'];

// plain english for the caption, so the model is not learning our slugs
const SHAPE_WORD = {
  circle:'circle', square:'rounded square', rect:'rounded rectangle', triangle:'triangle',
  diamond:'diamond', pentagon:'pentagon', hexagon:'hexagon', octagon:'octagon', 'chat-box':'speech bubble'
};
const TONE_WORD = { blue:'blue', purple:'purple', teal:'teal' };
const STEP_WORD = { subtle:'pale', soft:'light', loud:'mid', heavy:'deep' };
const label = (r) => (r.label || r.slug).replace(/^(Base|Secondary)\s+/i, '').toLowerCase();

/* ---------- the fit rule ----------
 * A secondary shape has to sit INSIDE its base. Nothing enforced that before,
 * which was invisible while every base was 64 wide and became the dominant
 * defect the moment sizes arrived: a shape at solo scale on a md or sm base
 * hangs off the edge, and where it hangs onto the page the silhouette dissolves.
 *
 * Checked by rasterising rather than by bounding box, because a bounding box
 * says a shield fits a triangle when its corners clearly do not. Elevation is
 * stripped for the test: a drop shadow is meant to fall outside the shape.
 */
const FIT_PX = 96;          // enough to catch a real overhang, cheap enough to run per sample
const FIT_TOLERANCE = 0.02; // a couple of percent is antialiasing, not overhang

const alphaMask = async (svg) =>
  (await sharp(Buffer.from(svg), { density: 192 })
    .resize(FIT_PX, FIT_PX)
    .ensureAlpha()
    .extractChannel(3)
    .raw().toBuffer());

async function fitEscape(recipe) {
  const bare = (o) => ({ ...o, elevation: [] });
  const baseOnly = { ...recipe, base: bare(recipe.base), secondary: [] };
  const secOnly  = { ...recipe, base: undefined, secondary: (recipe.secondary || []).map(bare) };
  const [b, s] = await Promise.all([alphaMask(compose(baseOnly)), alphaMask(compose(secOnly))]);
  let out = 0, total = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] > 128) { total++; if (b[i] <= 128) out++; }
  }
  return total ? out / total : 1;   // nothing drawn is not a pass
}

/* ---------- enumerate ---------- */
const combos = [];
for (const b of bases) {
  const shape = b.shape || b.slug;
  for (const fam of families) {
    for (const step of baseSteps) {
      for (const s of secondaries) {
        combos.push({ base: b, shape, fam, step, sec: s });
      }
    }
  }
}

const chosen = shuffle(combos).slice(0, LIMIT);

// best effort clean. some sandboxes refuse unlink, and a stale sample is a far
// smaller problem than a generator that cannot run at all.
let stale = false;
try { await rm(OUT, { recursive: true, force: true }); }
catch { stale = true; }
await mkdir(OUT, { recursive: true });

let written = 0, rejSurface = 0, rejFit = 0, rejBroken = 0;
const index = [];

for (const c of chosen) {
  const solo = rnd() > 0.32;                       // most assets are one shape on a ground
  const fill = pick(fillTones);
  const base = {
    part: c.shape, tone: `${c.fam}.${c.step}`,
    elevation: rnd() > 0.35 ? ['rim'] : []
  };
  if (c.base.size) base.size = c.base.size;

  const secondary = [{
    part: c.sec.shape || c.sec.slug, tone: fill,
    scale: solo ? 0.62 + rnd() * 0.14 : 0.86,
    elevation: ['cast']
  }];
  let modifier = null;
  if (!solo) {
    modifier = pick(secondaries.filter(s => s.slug !== c.sec.slug));
    secondary[0].layout = 'lead';
    secondary.push({
      part: modifier.shape || modifier.slug,
      tone: `${c.fam}.${c.step === 'heavy' ? 'heavy' : 'heavy'}`,
      anchor: pick(['br', 'bl']), elevation: ['cast']
    });
  }

  const recipe = { slug: `c${String(written).padStart(4, '0')}`, base, secondary };

  // the surfaces rule is the gate. a sample that fails it is not training data,
  // it is a mistake we would be teaching the model to repeat.
  if (checkSurfaces(recipe).length) { rejSurface++; continue; }

  let svg;
  try { svg = compose(recipe); } catch { rejBroken++; continue; }

  // shrink the layer until it sits inside its base, rather than discarding the
  // sample outright. an overhanging shape is not a bad idea, it is a bad scale.
  let escaped = await fitEscape(recipe);
  let guard = 0;
  while (escaped > FIT_TOLERANCE && guard++ < 6) {
    for (const L of recipe.secondary) L.scale = (L.scale ?? 1) * 0.88;
    escaped = await fitEscape(recipe);
  }
  if (escaped > FIT_TOLERANCE) { rejFit++; continue; }
  svg = compose(recipe);

  const sizeWord = c.base.size ? { lg:'large', md:'medium', sm:'small' }[c.base.size] + ' ' : '';
  const caption =
    `${TRIGGER}, flat vector spot illustration, ` +
    `${sizeWord}${TONE_WORD[c.fam]} ${SHAPE_WORD[c.shape] || c.shape} base in a ${STEP_WORD[c.step]} tone, ` +
    `with a pale ${label(c.sec)} on top` +
    (modifier ? `, and a small ${TONE_WORD[c.fam]} ${label(modifier)} in the corner` : '') +
    `, soft drop shadow, no outline, plain background`;

  const name = recipe.slug;
  const png = await sharp(Buffer.from(svg), { density: 384 })
    .resize(PX, PX, { fit: 'contain', background: BG === 'transparent' ? { r:0,g:0,b:0,alpha:0 } : BG })
    .flatten(BG === 'transparent' ? false : { background: BG })
    .png().toBuffer();

  await writeFile(join(OUT, name + '.png'), png);
  await writeFile(join(OUT, name + '.txt'), caption + '\n', 'utf8');
  index.push({ file: name + '.png', caption, recipe });
  written++;
}

await writeFile(join(OUT, 'index.json'), JSON.stringify({
  generated: new Date().toISOString().slice(0, 10),
  trigger: TRIGGER, size: PX, background: BG, seed: SEED,
  note: 'Synthetic. Generated from parts/ and schema/tokens.json by scripts/corpus.mjs. Mix with real assets before training.',
  count: index.length, samples: index
}, null, 2) + '\n', 'utf8');

console.log(`corpus  ${written} samples -> ${OUT}`);
console.log(`  ${PX}px, ${BG} background, trigger "${TRIGGER}"`);
console.log(`  rejected: ${rejSurface} on surfaces, ${rejFit} on fit, ${rejBroken} would not compose`);
console.log(`  captions written from the recipe, one .txt per .png`);
if (stale) console.log(`  NOTE: could not clear ${OUT} first, so files from an earlier run may remain`);
