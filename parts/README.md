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

Base shapes are named by their drawn size against the safe area, not the canvas:
`Base Rectangle - 64x48` occupies x 8..72, y 16..64. `Base Circle (Large) -
64x64` is r32 centred. So the naming convention is already consistent with the
grid.

Corner radius on base rectangles is **3** at this canvas, which is 3/80 of the
canvas. Expressed against the 512 authoring canvas that is 19.2, close to the
4/8/12/full scale carried from the old working doc but not on it. Worth
reconciling.

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
