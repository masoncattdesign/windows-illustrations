// Shared helpers. Node standard library only, no dependencies.
import { readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ASSETS_DIR = path.join(ROOT, 'assets');
export const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
export const SCHEMA_VERSION = 1;

// Slug rules. See schema/naming.md. Kept here so manifest and validate agree.
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSlug(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 64 && SLUG_RE.test(value);
}

export async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function dirsIn(target) {
  let entries;
  try {
    entries = await readdir(target, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

async function filesIn(target) {
  let entries;
  try {
    entries = await readdir(target, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

/**
 * Walk assets/<category>/<slug>/ and collect one record per illustration.
 * Problems are reported rather than thrown, so validate can show all of them
 * at once instead of failing on the first.
 */
export async function collectAssets() {
  const records = [];
  const problems = [];

  for (const category of await dirsIn(ASSETS_DIR)) {
    if (!isSlug(category)) {
      problems.push({ path: `assets/${category}`, message: 'category directory name is not a valid slug' });
    }

    for (const slug of await dirsIn(path.join(ASSETS_DIR, category))) {
      const dir = path.join(ASSETS_DIR, category, slug);
      const rel = `assets/${category}/${slug}`;

      if (!isSlug(slug)) {
        problems.push({ path: rel, message: 'illustration directory name is not a valid slug' });
      }

      const files = await filesIn(dir);
      const svgs = files.filter((f) => f.endsWith('.svg'));
      const metaPath = path.join(dir, 'meta.json');

      if (!files.includes('meta.json')) {
        problems.push({ path: rel, message: 'missing meta.json' });
        continue;
      }
      if (svgs.length === 0) {
        problems.push({ path: rel, message: 'no .svg file found' });
      }

      let meta;
      try {
        meta = JSON.parse(await readFile(metaPath, 'utf8'));
      } catch (err) {
        problems.push({ path: `${rel}/meta.json`, message: `not valid JSON: ${err.message}` });
        continue;
      }

      records.push({
        id: `${category}/${slug}`,
        category,
        slug,
        dir: rel,
        files: svgs.map((f) => `${rel}/${f}`),
        meta,
      });
    }
  }

  records.sort((a, b) => a.id.localeCompare(b.id));
  return { records, problems };
}

/** Build the manifest object. Deliberately has no timestamp so the file only
 *  changes when the library changes. */
export function buildManifest(records) {
  const illustrations = records.map((r) => ({
    id: r.id,
    category: r.category,
    slug: r.slug,
    name: r.meta.name ?? null,
    status: r.meta.status ?? 'draft',
    tags: Array.isArray(r.meta.tags) ? [...r.meta.tags].sort() : [],
    files: r.files,
  }));

  const categories = [...new Set(illustrations.map((i) => i.category))].sort();
  const body = { schemaVersion: SCHEMA_VERSION, count: illustrations.length, categories, illustrations };
  const digest = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16);
  return { ...body, digest };
}

export function serialize(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export const green = (s) => `[32m${s}[0m`;
export const red = (s) => `[31m${s}[0m`;
export const yellow = (s) => `[33m${s}[0m`;
export const dim = (s) => `[2m${s}[0m`;
