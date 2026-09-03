#!/usr/bin/env node
// Rebuild manifest.json from assets/. Never edit manifest.json by hand.
import { writeFile } from 'node:fs/promises';
import { collectAssets, buildManifest, serialize, MANIFEST_PATH, green, yellow, dim } from './lib.mjs';

const { records, problems } = await collectAssets();
const manifest = buildManifest(records);

await writeFile(MANIFEST_PATH, serialize(manifest), 'utf8');

console.log(`${green('manifest')} wrote manifest.json`);
console.log(`  ${manifest.count} illustration${manifest.count === 1 ? '' : 's'} in ${manifest.categories.length} categor${manifest.categories.length === 1 ? 'y' : 'ies'}`);
console.log(dim(`  digest ${manifest.digest}`));

if (manifest.count === 0) {
  console.log(dim('  assets/ is empty. That is expected until NEXT.md phase 3.'));
}

if (problems.length > 0) {
  console.log(`\n${yellow(`${problems.length} problem${problems.length === 1 ? '' : 's'} skipped during collection. Run npm run validate for detail.`)}`);
}
