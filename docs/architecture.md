# Architecture

## The one-way flow

```
intake/            raw drops, unreviewed, never committed
   |
   |  scripts/normalize.mjs  (deterministic, no model in the loop)
   |  plus human review
   v
assets/            normalized, tagged, committed. The library.
   |
   |  scripts/manifest.mjs
   v
manifest.json      generated index, stable digest, committed
   |
   +---> library      +---> gallery      +---> customizer
   +---> Builder      +---> Bridge System
```

The gate between `intake/` and `assets/` is the design, not an inconvenience.
It is what keeps unreviewed artwork and internal material out of a repo that is
expected to go public, and it is what guarantees every asset in the library was
tagged by the same script rather than by whoever happened to add it.

Nothing writes into `assets/` except `normalize.mjs`. Hand copying defeats the
whole arrangement.

## Why the tags are the product

The artwork is the visible output, but the metadata is what makes this a system
rather than a folder. Two independent IDs per shape, structural and color, are
what allow one library to serve consumers with opposite needs: the customizer
wants to recolor without understanding the picture, and the Builder wants to
understand the picture without caring about color.

This is inherited from the icon library, where it was measured rather than
assumed. Notably: treating a fill as the unit collapsed 5,725 paint stops to
1,635 distinct fills, a 3.5x reduction, and 48 colored assets could not be
split into two color groups on color alone, which is what proved the structural
axis was required.

## Why no dependencies

`scripts/` is Node standard library only, ESM, no bundler and no build step.
The icon side ran a whole prototype this way. The reasons hold here:

- the scripts outlive any given toolchain
- a design library that cannot be run five years from now is not a library
- fewer moving parts between the artwork and the manifest

Adding a dependency is a decision, not a convenience. Ask first.

## Why the manifest has no timestamp

A generated file that changes on every run makes "is the manifest current" an
unanswerable question and fills the history with no-op diffs. Instead the
manifest carries a content digest and nothing time-varying, so
`npm run validate` can rebuild it in memory and compare byte for byte. If the
committed file differs, someone skipped the manifest step.
