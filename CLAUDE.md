# CLAUDE.md: operating manual for Windows Illustrations

This is the illustration library for Windows Design Systems, owned by Mason
Catt. It is the sibling of `expressive-assets`, which holds the icon side of
the same program. Read this file first. `NEXT.md` is the ordered work list. If
Mason says "start the list," work through `NEXT.md` in order.

## What this repo is

A source of truth for Windows illustrations: the artwork itself, the metadata
that describes each piece, and the tooling that keeps the two in sync. It is
not a prototype. Prototypes live in `expressive-assets` and in the gallery.

Illustrations here have to satisfy four consumers, so nothing lands until it
can serve all four. See `docs/integration.md` for the full contract.

1. **Expressive Assets library**: the published catalog. Reads `manifest.json`.
2. **Gallery**: browse and preview surface. Reads the manifest plus rendered
   previews.
3. **Customizer**: recolors and rethemes an illustration at runtime. Reads the
   color role tags on every shape.
4. **Builder**: not yet built. Composes new illustrations from library parts.
   Reads the structural tags on every shape.
5. **Bridge System**: the eventual consumer of record. Everything above should
   be shaped so that the Bridge contract in `schema/bridge-contract.md` is a
   description of what already exists, not a migration.

## The rule that decides most questions

Every shape carries **two independent IDs**: a structural ID and a color ID.
This is inherited directly from the icon side (see the color roles decisions
doc in the Expressive Assets project, from the Ada Hurd call on 2026-09-02) and
it is the reason the customizer and the Builder can both exist.

- **Structural ID** answers "what part of the picture is this?" The Builder
  reads it. Retheming a single part selectively needs it.
- **Color ID** answers "what tone group and member is this?" The customizer
  reads it. Groups are ranked by weight, members ordered by brightness within
  a group.

The icon library proved the structural axis is not optional: 48 of 345 colored
icons could not meet the two-group floor on color alone. Illustrations are more
color-rich than icons, so the pressure is different, but the requirement to
emit both tag sets is the same. Emit both. Evaluate later which the consumers
actually use.

Two other inherited rules:

- **Dedupe by fill, not by color.** A gradient is one member that owns its
  stops, not one member per stop.
- **Intentional white and black are held out.** They are addressable but not
  themed by default. Whether a theme touches them is a per-theme choice.

## Public and private boundary

**This repo is expected to become public. Treat it that way from commit one.**

Two directories are permanently gitignored and must never be committed, staged,
or quoted at length into a committed file:

- `intake/`: raw drops. WDS illustration source, Mason's WIP, and internal
  guideline documents. Unreviewed by definition.
- `private/`: internal Microsoft material. Other internal illustration
  systems, call transcripts, unpublished specs, anything with an internal URL
  or a colleague's unpublished work in it.

Material moves from `intake/` into `assets/` only by passing through
`scripts/normalize.mjs` and a human review. That gate is the point. Do not
hand-copy files into `assets/`.

Reference and inspiration notes in `references/` are committed, so they must be
written as **original analysis**. Describe what a system does and why it works.
Do not paste internal documentation, do not embed internal artwork, and do not
link to internal-only URLs. If an observation cannot survive that constraint,
it belongs in `private/notes/`.

When in doubt about whether something is safe to commit, ask Mason. Do not
guess.

## Layout

```
assets/       normalized, reviewed illustrations. Committed. The library.
manifest.json generated index of assets/. Committed. Never edit by hand.
schema/       the contract: anatomy, naming, bridge, JSON schema.
scripts/      manifest, validate, normalize. Node ESM, zero dependencies.
docs/         architecture and integration notes.
references/   public-safe analysis of other systems. Committed.
intake/       raw drop zone. GITIGNORED.
private/      internal material. GITIGNORED.
```

## House rules

- American spelling.
- No em-dashes in prose. Use commas, colons, or parentheses.
- Run `npm run manifest && npm run validate` before any commit. Both must pass.
- Zero runtime dependencies in `scripts/`. Node's standard library only, ESM,
  `.mjs`. The icon side got by without a bundler and so should this.
- Mason pushes to GitHub himself. This environment has no credentials. Stage
  and commit locally, then stop and tell him.
- `manifest.json` is generated. If it looks wrong, fix the generator, not the
  file.
- Do not add a framework, a build step, or a package dependency without asking.

## Working conventions

- Asset slugs are kebab-case, lowercase, ASCII only, no version numbers, no
  dates. See `schema/naming.md`.
- One illustration is one directory under `assets/<category>/<slug>/`, holding
  the SVG plus a `meta.json`. The directory is the unit, not the file.
- Every commit that touches `assets/` also touches `manifest.json`. If it does
  not, the manifest step was skipped.
- Prefer editing an SVG with a script over editing it by hand. The library is
  going to be large and hand edits do not scale or stay consistent.
- Never re-type an SVG's contents from tool output. Read the file, transform
  it, write it back.

## Cross-repo

`expressive-assets` is the icon sibling. Shared vocabulary, shared color role
model, shared eventual Bridge contract. When a naming or anatomy question comes
up here that the icon side already answered, follow the icon side rather than
inventing a parallel term. `glyph` and `emblem` are settled words there. The
illustration anatomy vocabulary is still open (see `schema/anatomy.md`) and
needs Ada and Sihan's input before it hardens.

## Relationship to the M365 illustration system

The M365 illustration system (Fluent x CAP) is being built at the same time as
this one. It is a peer, not a parent, and not a specification.

The stance, from Mason:

- **This is evolution, not revolution.** The Windows illustration style keeps
  moving on its own track. We are not restarting it to match someone else.
- **M365 informs our direction, it does not set it.** Take their thinking where
  it genuinely helps. Do not adopt a decision just because they made it.
- **The goal is that the two systems work together.** Shared vocabulary, shared
  color reasoning, and compatible contracts are worth real effort. A shared
  visual style is not the goal, and their look (flat, outlined, offset block
  shadow) is not ours.

Practical test for any M365 borrowing: does it change what a Windows
illustration looks like, or only what we call its parts and how they are
tagged? Vocabulary, tagging, and structure travel freely. Visual style does not.

Analysis of their system, and of the deprecated Fluent style, lives in
`private/references/`. It is written as comparison, not as a plan to adopt.
