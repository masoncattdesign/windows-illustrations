# Bridge System contract

**Status: proposal.** The Bridge System is the eventual consumer of record for
both icons and illustrations. This file exists so that Bridge alignment is a
constraint on every earlier decision rather than a migration at the end. It
becomes a description rather than a proposal at NEXT.md item 14.

If the real Bridge spec contradicts anything here, the real spec wins and this
file gets rewritten.

## What the Bridge needs from an asset library

Working assumption, stated so it can be corrected:

1. **A stable identity per asset** that survives renames, recategorization, and
   file layout changes. Consumers store references, so an identity that changes
   when a file moves is not an identity.

2. **A shape-level tag surface** that is the same shape for icons and
   illustrations. If the two libraries expose different tag models, the Bridge
   has to special-case them and the whole point is lost. Both emit a structural
   ID and a color ID per shape.

3. **Declared theming behavior**, including which parts are held. A consumer
   has to be able to ask "what happens to this asset under this theme" and get
   an answer from metadata, without rendering it.

4. **Declared render constraints**: canvas, crops, minimum legible size, and
   whether the asset degrades or gets swapped below that size.

5. **A versioned manifest** with a stable digest, so a consumer can tell
   whether its cached copy is current without diffing the tree.

## What this repo guarantees today

- `manifest.json` is generated, never hand edited, and carries a `digest` that
  changes only when the library changes. There is no timestamp in it, so a
  no-op rebuild produces no diff.
- `schemaVersion` is in the manifest and will be incremented on any breaking
  shape change.
- IDs are `<category>/<slug>` today. That is a **path-shaped identity and it is
  therefore not stable across recategorization**. This is a known gap. Closing
  it means an identity independent of the path, and it should be closed before
  any consumer stores references. Tracked in NEXT.md item 7.

## What is not decided

- Whether the Bridge reads this repo directly or reads a published build.
- Whether icons and illustrations share one manifest or two.
- Whether theming is resolved here or in the consumer. The customizer currently
  resolves it, which argues for shipping tags and letting consumers decide.
- Motion. Illustrations may animate. Nothing in the model handles that yet.
