# NEXT.md: ordered work list

Work top to bottom. Each item states what "done" means. When an item is done,
move it to the Done section at the bottom with a one-line note. If Mason says
"start the list," begin at the first unchecked item.

Items marked **blocked on Mason** need something only he can supply. Skip past
them and keep going rather than stalling.

---

## Phase 1: intake

### 1. Land the source material
**Blocked on Mason.** Drop into `intake/`:

- `intake/wds/`: the current shipped WDS illustrations
- `intake/wip/`: Mason's in-progress work
- `intake/guidelines/`: existing design guides and specs

Done when all three have content and `npm run intake:report` prints counts,
formats, and a flag list of anything that is not an SVG.

### 2. Survey what actually landed
Read the guidelines first, then the artwork. Produce
`private/notes/intake-survey.md` covering:

- how many illustrations, in what categories, at what canvas sizes
- which aspect ratios and crops exist, and whether they are systematic
- color: how many distinct fills, how much is gradient, how much is flat
- structure: layer naming conventions, grouping conventions, any existing
  semantics already in the files
- how much of the WDS set is a coherent system versus accumulated one-offs
- the gap between what the guidelines claim and what the files do

This is the survey the icon side did (3,234 assets, 5,725 stops collapsing to
1,635 fills) and it is what made every later decision arguable rather than
guessed. Do not skip it. Done when the survey has numbers in it, not adjectives.

### 3. Decide the public/private line for the artwork
**Blocked on Mason.** The icon repo ships Microsoft icon artwork publicly under
a prototyping-and-review note. Confirm whether the illustrations get the same
treatment, or whether `assets/` ships metadata only with artwork held back.
This changes the shape of everything downstream, so settle it before Phase 2.
Done when the answer is written into `CLAUDE.md` and `README.md`.

---

## Phase 2: the model

### 4. Propose illustration anatomy vocabulary
Icons settled on `glyph` for the mark and `emblem` for the middle part, with
the base part still unnamed. Illustrations need their own part vocabulary and
it does not map one to one.

Write `schema/anatomy.md` with a proposed set of structural roles, each with a
definition, a positive example, and a negative example. Ground every proposal
in the Phase 2 survey, not in intuition. Then route it to Ada and Sihan for
vocabulary input the way the icon anatomy went, and to Alex for a risk read.
Done when there is a proposal with real examples, not when the names are final.

### 5. Define the color role model for illustrations
Port the group/member model from the icon side and stress it against
illustration-scale color. Specifically resolve:

- does the two-to-four group range hold when a scene has ten distinct fills
- clustering on chromaticity with lightness reserved for member ordering (the
  icon side's recommendation) versus something else
- how held white and black behave in a scene that has real lighting
- whether color IDs are scoped inside structural parts or independent of them.
  The icon side left this open and noted that part-selective retheming needs
  both IDs read together anyway.

Done when `schema/anatomy.md` has a color section with the open questions from
the icon side either answered for illustrations or explicitly deferred with a
reason.

### 6. Write the metadata schema
`schema/illustration.schema.json` plus a plain-language companion. Covers
identity, category, canvas and crop variants, structural tags, color tags, held
parts, provenance, and status. Done when `npm run validate` enforces it and a
hand-written example asset passes.

### 7. Lock naming
Fill in `schema/naming.md`: slug rules, category taxonomy, variant suffixes,
and the rule for renaming without breaking consumers. Done when the validator
rejects a bad slug.

---

## Phase 3: the pipeline

### 8. Build `scripts/normalize.mjs`
Takes a raw file from `intake/`, emits a reviewed candidate under `assets/`.
Cleans the SVG, applies the tag model, writes `meta.json`. Deterministic script,
no model in the loop, per Ada's hard requirement on the icon side. Done when it
round-trips the ten hardest illustrations from the survey without hand editing.

### 9. Harden `scripts/validate.mjs`
Grow it from the scaffold stub into a real gate: schema conformance, tag
completeness, the two-group floor, held-part sanity, slug rules, orphaned files,
manifest drift. Done when it catches every failure class the survey found.

### 10. Run the full set through
Promote everything from `intake/wds/` into `assets/`. Done when the manifest
has the whole library in it and validate passes clean.

---

## Phase 4: consumers

### 11. Integration contract
Fill in `docs/integration.md` with the exact read surface for each consumer:
library, gallery, customizer, Builder, Bridge. What each one reads, what this
repo guarantees, what changes are breaking. Done when someone could build
against it without asking a question.

### 12. Wire into the Expressive Assets library and gallery
Illustrations appear alongside icons. Done when they render in the gallery with
correct previews and the library entry links resolve.

### 13. Wire into the customizer
An illustration rethemes from a seed color using its color IDs, the same way an
icon does. Done when a seed color drives a whole illustration coherently and
held parts behave.

### 14. Bridge System alignment
Review `schema/bridge-contract.md` against the real Bridge spec once it exists.
Done when the contract is a description rather than a proposal.

---

## Phase 5: the Builder

### 15. Scope the Builder
What it composes, from what parts, with what constraints. This is where the
structural IDs pay off. Done when there is a spec Mason agrees with.

### 16. Build it
Sequenced separately once 15 lands.

---

## Parallel, not blocking

### R1. Reference corpus
**Partly blocked on Mason** for the internal Microsoft systems and the web
inspiration links.

Internal Microsoft illustration systems go in `private/references/`. Public
inspiration and all written analysis go in `references/`, using
`references/_template.md`. Keep `references/index.md` current.

The value is comparison, not collection. Every entry answers the same
questions, so the set can be read across. A link dump is a failure state.

---

## Done

_(nothing yet)_
