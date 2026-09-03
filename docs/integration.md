# Integration contract

Five consumers. Nothing lands in `assets/` until it can serve all of them.
This file is a skeleton to be filled in at NEXT.md item 11, once the schema is
real. What is here now is the intent, so that earlier decisions are made with
these reads in mind.

| Consumer | Reads | Depends on | Breaking change if |
|---|---|---|---|
| Library | `manifest.json` | identity, category, status | an id changes, a category disappears |
| Gallery | manifest plus previews | canvas, crops, preview render | preview dimensions change |
| Customizer | color IDs per shape, held parts | color role model | group numbering or held semantics change |
| Builder | structural IDs per shape | anatomy vocabulary | a structural role is renamed or removed |
| Bridge | manifest, digest, schemaVersion | everything above | `schemaVersion` bump |

## Library

The published Expressive Assets catalog. Illustrations appear alongside icons,
so entries have to be shaped compatibly even though the artwork is not.

## Gallery

Browse and preview. Needs a render of each illustration at a known size, plus
enough metadata to filter and sort. Preview generation is not built yet and it
is not clear whether previews are committed or generated at publish time.

## Customizer

Rethemes an illustration from a seed color, the same way it does an icon. This
is the consumer that makes the color role model load-bearing:

- reads the color ID on every shape
- respects held white and black
- treats a gradient as one member owning its stops

The icon side's Soft mode is the closest working reference for what good looks
like here. Illustrations are larger and carry real lighting, so a naive port of
the icon bucketing will probably not hold. Expect this to need its own tuning.

## Builder

Not built. Composes new illustrations from library parts, which is only
possible because every shape carries a structural ID. Scoping is NEXT.md item
15.

The important consequence for now: **structural tags have to be good enough to
compose against, not just good enough to describe.** A tag that is accurate but
not reusable fails this consumer while passing every other one, and that will
not show up until the Builder exists. Keep it in mind when writing the anatomy
vocabulary.

## Bridge System

See `schema/bridge-contract.md`.
