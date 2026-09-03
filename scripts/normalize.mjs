#!/usr/bin/env node
// Promote a raw file from intake/ into a reviewed asset under assets/.
//
// NOT IMPLEMENTED YET. This is NEXT.md item 8, and it is deliberately blocked
// on items 4 through 7: there is no point writing a tagger before the anatomy
// vocabulary, the color role model, and the schema are settled.
//
// When it is written it must be a deterministic script with no model in the
// loop. That is a hard requirement carried over from the icon side.
//
// Nothing else may write into assets/. The review gate is the whole point.
import { red, dim } from './lib.mjs';

console.log(`${red('normalize')} not implemented yet.`);
console.log(dim('  Blocked on NEXT.md items 4 to 7 (anatomy, color roles, schema, naming).'));
console.log(dim('  Do not hand-copy files from intake/ into assets/ as a workaround.'));
process.exit(1);
