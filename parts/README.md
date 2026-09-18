# parts/

The primitive shape library. These are the pieces illustrations get assembled
from, and they are the input to the Builder.

Extracted from the Windows Illustration 2026 WIP Figma file, sections
`4110:22185` (base), `4110:22354` (secondary), `4110:22699` (tertiary).

## The three tiers

Mason's vocabulary, which is better than the base/content/badge proposal in
`schema/anatomy.md` and should replace it:

- **base**: the background shape. One per illustration.
- **secondary**: lays over the base. Movable and scalable.
- **tertiary**: small shape containers. Either the element itself, or a
  container holding a system icon. These are the emblems.

`emblem` is already settled on the icon side for the middle part, so tertiary
and emblem are the same idea arriving from two directions. Worth reconciling the
word before either hardens.

## Canvas, finally answered

Every part is authored the same way, which answers the three numbers page 02 of
the guidelines was missing:

- **canvas 80 x 80**
- **safe area 64 x 64**, centred, so an **8px margin** on all sides
- **grid step 8**, giving a 10 x 10 canvas grid and an 8 x 8 safe grid

## Base shapes are generated, not drawn

Everything in `base/` except `chat-box` comes out of `scripts/gen-base.mjs`.
Run it after changing the shape list or the size ramp:

```
node scripts/gen-base.mjs && node scripts/parts-manifest.mjs
```

Three sizes, fitted to the **bounding box** so a triangle and a hexagon of the
same size look the same size:

| size | box | of the safe area |
| ---- | --- | ---------------- |
| `lg` | 64  | 100%             |
| `md` | 48  | 75%              |
| `sm` | 32  | 50%              |

A recipe names a shape and a size separately, `{ "part": "circle", "size": "md" }`,
so the tool can offer a size control instead of listing three near identical
chips. `lg` is exactly the safe area: turn the grid on in the builder and a `lg`
shape sits on the dashed line.

**Why generate rather than scale.** The Figma file already settled on a constant
corner radius: `rect-48x48`, `rect-56x40` and `rect-64x48` were three different
sizes all using `rx=3`. A scale transform would have shrunk the radius with the
shape and broken that, so each size is real geometry with the radius held at 3.

That constant is worth watching at `sm`. A radius of 3 against a 32 box is
proportionally twice what it is against 64, so the small polygons read softer
than the large ones, and `octagon-sm` is close to indistinguishable from
`circle-sm`. If that reads wrong, the radius wants to step with the size rather
than sit still.

One shape changed on the way through. The hand drawn `triangle-64` used a corner
radius of about 2; the generated triangle uses the system constant of 3, so its
base corners are slightly softer than the version in Figma.

## The shapes

`circle` `square` `rect` (4:3) `triangle` `diamond` `pentagon` `hexagon`
`octagon`, plus `chat-box`, which is still hand drawn and has no size variants.

Every polygon sits level, on a flat bottom edge or a clean point. Shapes that
carry meaning on their own are deliberately absent: a heart base says *favourite*
before anything has been drawn on it, and a base is a container, not a statement.
Near round polygons from heptagon up are absent too, because at 64px they are a
circle with extra path data.

## What is in here

Shapes are normalised: the Figma display card and the `Grid` scaffold are
stripped, and the placeholder grey gradient is replaced with `currentColor` so
the colour model assigns tone rather than the file baking it. Each carries
`data-tier`, `data-slug` and `data-part` for the Builder to read.

`manifest.json` lists what exists.

## Not yet extracted

Tertiary is incomplete. Three of its sixteen have a structural problem that has
to be fixed in Figma first, and the export ran past the transfer limit partway
through. See `../private/notes/parts-extraction.md`.

The composed assets in `4080:8480` (two rows of eight) are next after that.
