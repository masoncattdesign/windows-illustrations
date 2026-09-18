# recipes/

An asset is data. This directory holds the data; `scripts/compose.mjs` turns it
into artwork. Nothing here draws anything.

```
node scripts/compose.mjs recipes/safety-shield.json --out build
node scripts/compose.mjs recipes/*.json --out build
```

## The shape of a recipe

```json
{
  "slug": "safety-files",
  "concept": "safety",
  "label": "Protected files",
  "base":      { "part": "rect", "size": "lg", "tone": "blue.loud", "elevation": ["rim"] },
  "secondary": [
    { "part": "folder", "tone": "grey.paper", "scale": 0.66, "elevation": ["cast"] },
    { "part": "shield", "tone": "blue.heavy", "anchor": "br", "elevation": ["cast"] }
  ]
}
```

Every field points at something the system already defines:

- `part` is a shape in `parts/<tier>/`
- `size` is `lg`, `md` or `sm` on a base shape, and resolves to the file
  `<part>-<size>.svg`. Leave it out for shapes that have only one size
- `tone` is `family.step` from `schema/tokens.json`, never a hex
- `elevation` names one of the six recipes, never a shadow value
- `anchor` and `layout` name a placement, never a coordinate

A recipe that reaches for a part, tone or elevation that does not exist fails
loudly and names what is missing. That is the point: the library tells you what
you can make, and the gap tells you what to draw next.

## Placement

Parts are authored on the 80 canvas; assets come out at 512. The composer scales
about the canvas centre so a shape stays centred as it grows.

- `solo` is a single secondary, full scale, centred
- `lead` is the metaphor carrier when something else modifies it
- `modifier` plus an `anchor` (`br` `bl` `tr` `tl`) is the thing doing the
  modifying
- `scale`, `x` and `y` override any of it when a composition needs hand placing

## The generator enforces page 05

`compose.mjs` checks the outermost shape against both Windows surfaces and warns
at build time:

```
composed safety-shield  ->  build/safety-shield.svg
  ! outermost circle-lg (blue.subtle) fails on light: 1.29.
    outline it, contain it, or demote it
```

All three safety recipes failed this on the first pass, because a `subtle` base
is a dark-surface-only value and it was being asked to carry the silhouette.
Moving the bases to `loud` and putting the paper tone inside fixed all three.
That is the guideline catching a real mistake in a real asset rather than
sitting on a page.

## Known gap

There is no rule yet stopping a `lead` secondary from overhanging its base.
`safety-files` needed `scale` set by hand to keep the folder inside the
rectangle. A fit-to-base constraint is the next thing the composer needs.
