#!/usr/bin/env node
// Gate that runs before every commit, alongside npm run manifest.
//
// Scaffold stage. The checks here are the structural ones that hold with zero
// assets present. The schema, tagging, and color-group checks arrive with
// NEXT.md item 9, once schema/illustration.schema.json is settled.
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  collectAssets, buildManifest, serialize, isSlug,
  ROOT, MANIFEST_PATH, exists, green, red, yellow, dim,
} from './lib.mjs';

const errors = [];
const warnings = [];

const fail = (where, message) => errors.push({ where, message });
const warn = (where, message) => warnings.push({ where, message });

// 1. Collection problems are errors.
const { records, problems } = await collectAssets();
for (const p of problems) fail(p.path, p.message);

// 2. Per-illustration checks.
for (const r of records) {
  const { meta, dir } = r;

  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    fail(`${dir}/meta.json`, 'must be a JSON object');
    continue;
  }
  if (typeof meta.name !== 'string' || meta.name.trim() === '') {
    fail(`${dir}/meta.json`, 'name is required and must be a non-empty string');
  }
  if (meta.slug !== undefined && meta.slug !== r.slug) {
    fail(`${dir}/meta.json`, `slug "${meta.slug}" does not match directory name "${r.slug}"`);
  }
  if (meta.category !== undefined && meta.category !== r.category) {
    fail(`${dir}/meta.json`, `category "${meta.category}" does not match directory "${r.category}"`);
  }
  const allowedStatus = ['draft', 'review', 'published', 'deprecated'];
  if (meta.status !== undefined && !allowedStatus.includes(meta.status)) {
    fail(`${dir}/meta.json`, `status must be one of ${allowedStatus.join(', ')}`);
  }
  if (meta.tags !== undefined) {
    if (!Array.isArray(meta.tags)) {
      fail(`${dir}/meta.json`, 'tags must be an array');
    } else {
      for (const t of meta.tags) {
        if (!isSlug(t)) fail(`${dir}/meta.json`, `tag "${t}" is not a valid slug`);
      }
    }
  }

  // SVG sanity. A missing viewBox breaks every consumer that scales.
  for (const rel of r.files) {
    let svg;
    try {
      svg = await readFile(path.join(ROOT, rel), 'utf8');
    } catch (err) {
      fail(rel, `could not read: ${err.message}`);
      continue;
    }
    if (!/<svg[\s>]/i.test(svg)) fail(rel, 'does not contain an <svg> root element');
    if (!/viewBox\s*=/i.test(svg)) fail(rel, 'missing viewBox. Consumers cannot scale it.');
    if (/<script[\s>]/i.test(svg)) fail(rel, 'contains a <script> element. Strip it.');
    if (/\son\w+\s*=/i.test(svg)) fail(rel, 'contains an inline event handler attribute. Strip it.');
    if (/<image[\s>]/i.test(svg)) warn(rel, 'contains a raster <image>. It will not recolor.');
  }
}

// 3. Manifest freshness. The committed file must match a fresh build.
const expected = serialize(buildManifest(records));
if (!(await exists(MANIFEST_PATH))) {
  fail('manifest.json', 'missing. Run npm run manifest.');
} else {
  const actual = await readFile(MANIFEST_PATH, 'utf8');
  if (actual !== expected) {
    fail('manifest.json', 'out of date with assets/. Run npm run manifest.');
  }
}

// 4. Boundary check. The rule in CLAUDE.md is that nothing dropped into
// intake/ or private/ can ever be committed. Asking git directly is the only
// check worth trusting here: .gitignore negation is subtle enough that a
// pattern can read correctly and still leak, or read correctly and silently
// exclude the READMEs that document the rule.
const PROBES = [
  'intake/leak.svg',
  'intake/wds/leak.svg',
  'intake/wip/leak.svg',
  'intake/guidelines/leak.pdf',
  'private/leak.md',
  'private/references/leak.svg',
  'private/notes/leak.md',
];
// These must NOT be ignored, or a clone loses the directories and the rules.
const MUST_SHIP = [
  'intake/README.md',
  'private/README.md',
  'intake/wds/.gitkeep',
  'private/notes/.gitkeep',
];

if (await exists(path.join(ROOT, '.git'))) {
  const ignored = (p) =>
    new Promise((resolve) => {
      const git = spawn('git', ['check-ignore', '-q', '--no-index', '--', p], { cwd: ROOT });
      git.on('error', () => resolve(null));
      git.on('close', (code) => resolve(code === 0));
    });

  for (const p of PROBES) {
    const r = await ignored(p);
    if (r === null) { warn('.gitignore', 'git not available, boundary check skipped'); break; }
    if (r === false) fail('.gitignore', `${p} would be committable. See the boundary rule in CLAUDE.md.`);
  }
  for (const p of MUST_SHIP) {
    const r = await ignored(p);
    if (r === true) fail('.gitignore', `${p} is ignored, so a clone would not get it. Loosen the pattern.`);
  }
} else {
  warn('.gitignore', 'not a git repository, boundary check skipped');
}

// Report.
for (const w of warnings) console.log(`${yellow('warn')}  ${w.where}: ${w.message}`);
for (const e of errors) console.log(`${red('error')} ${e.where}: ${e.message}`);

const n = records.length;
console.log(
  errors.length === 0
    ? `${green('validate')} ok. ${n} illustration${n === 1 ? '' : 's'} checked, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`
    : `${red('validate')} failed. ${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`
);
if (errors.length === 0 && n === 0) {
  console.log(dim('  No assets yet. Structural checks only. See NEXT.md item 9.'));
}

process.exit(errors.length === 0 ? 0 : 1);
