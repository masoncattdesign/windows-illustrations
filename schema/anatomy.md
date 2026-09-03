# Anatomy and color roles

**Status: open.** This file is a placeholder with the inherited constraints
written down. The illustration vocabulary itself is NEXT.md items 4 and 5, and
it must be grounded in the intake survey rather than proposed from intuition.

## What is already settled, from the icon side

These come from the color roles decisions captured on the icon library (Ada
Hurd call, 2026-09-02, measured against 3,234 assets). They carry over unless
illustrations give a specific reason to break them.

**Two independent IDs per shape.** A structural ID and a color ID. Build one
system that emits both tag sets, then evaluate which consumers actually use
which. Emitting both is not a commitment to using both.

**Deterministic script, not a model in the loop.** Hard requirement. Tagging
has to be fast and repeatable.

**Group and member structure.** Color roles are `group N . member M`. Groups
ranked by weight, members ordered by brightness within a group. Label words are
open.

**Two groups minimum, four maximum.** Held on icons. Needs re-testing at
illustration scale, where a scene can carry far more distinct fills.

**Dedupe by fill, not by color.** A gradient is one member owning its stops,
not one member per stop.

**Intentional white and black are held out.** Addressable but not themed by
default. Whether a given theme touches them is a per-theme choice.

## Vocabulary

Icons settled on:

- `glyph` for the mark, because it can be a letter, an icon, or a product
  symbol
- `emblem` for the middle part, replacing `badge`, which collided with the
  status-overlay meaning elsewhere in Fluent and Windows
- the base part is **still unnamed**. Candidates: base, plate, surface, main
  shape.

Illustrations do not map one to one onto that. A scene has depth, staging, and
supporting elements that an icon does not. Proposing the illustration part
vocabulary is NEXT.md item 4, and it should go to Ada and Sihan for naming
input the same way the icon anatomy did.

Do not invent a parallel term for something the icon side already named. Where
the concept is the same, the word should be the same.

## Open questions carried over

These were left open on icons and will need answering here too. Illustrations
may answer them differently, which is fine, as long as the difference is
deliberate and written down.

**Clustering distance.** Full OKLab produces a light-versus-dark split because
lightness dominates the distance. Clustering on chromaticity alone, with
lightness reserved for member ordering, produces the intended "these are the
purples, these are the reds" result and keeps the two numbers independent. The
icon side recommends chromaticity. Illustrations should start there.

**Choosing k.** Largest-gap always picks 2, because the final merge to one
cluster is always the biggest jump. Silhouette picks 3 or 4 for most assets and
over-splits. Neither is right everywhere. This is tuning, not theory.

**Member ordering direction.** Lightest to darkest, or the reverse. Open.

**Whether color IDs are scoped inside structural parts or independent of them.**
The framing on icons is independent, with the measured caveat that
part-selective retheming needs both IDs read together anyway. Illustrations
have more parts, so this question has more weight here than it did there.

## Why the structural axis is not optional

On the icon side, 48 of 345 colored assets had fewer than two non-held fills,
so they could not meet the two-group floor on color alone. A two-color theme
had nothing to bind to on those without a structural axis. Expect illustrations
to fail differently, not less: the risk there is too many groups rather than
too few. Measure it in the survey.
