---
system: Microsoft Fluent illustration style
owner: Microsoft Design
access: public
reviewed: 2026-09-17
---

# Microsoft Fluent illustration style

The vibrant, dimensional illustration style Microsoft introduced to replace its
earlier flat vector look, described publicly on the Microsoft Design site. It is
the style most people picture when they picture a Microsoft illustration: soft
gradients, rounded organic forms, a suggestion of depth, drawn from a shared
brand palette rather than a product palette.

It is now being phased out. This entry is written as a record of what the style
committed to and what those commitments cost, not as a model to copy.

## Structure

No named parts and no stated decomposition. The published account describes
construction in painterly terms: overlapping forms, dynamic placement, gradient
passes, textured brush work. The one systematic idea is that shapes and objects
derived from the icon library get repeated, reused, and repurposed across
illustrations, so the vocabulary is shared with iconography even though nothing
names the shared units.

The stated subject rule is universality: depict work and creativity through
simplified symbols rather than through specific people in specific scenarios,
on the reasoning that a symbol reads across more vocations and cultures than a
depicted person does.

## Color

A single shared brand palette replacing per product desaturated palettes, and
gradients rather than flat fills. The published account gives no hex values, no
ramp structure, no token names, and no role model. Color is described as an
expressive choice made per illustration, with the only system level constraint
being that the result work in both light and dark mode.

Nothing in the public account suggests an illustration can be rethemed. The
gradient is authored, not derived.

## Scale and crops

Not addressed. No canvas size, no grid, no scale ramp, no small size behavior.

## Composition

Every illustration is drawn. Reuse happens at the level of a designer
repurposing a shape from the icon library or from a previous piece. There is no
parts model and no compositional grammar, which is consistent with a style whose
stated virtues are fluidity, asymmetry, and organic form.

## Tooling

None described.

## What it gets right

**It picked five commitments and named them.** Humanity, color and gradients,
dimension, sophistication, playfulness. Whatever one thinks of the outcome, a
style with five written commitments can be argued with, and a designer can tell
whether a new piece belongs. Most illustration efforts never get that far, and
the SV2 catalog on the Windows side never did.

**It tied illustration to an existing system primitive.** Dimension is defined
by reference to the elevation system rather than invented for illustration,
so depth in an illustration and depth in the UI are the same idea. That is the
correct instinct: define a new surface in terms of the system it lives in.

**Symbol over scenario is a scaling decision disguised as an inclusion
decision.** Specific scenes date, localize badly, and multiply. A symbolic
vocabulary is reusable by construction. The same reasoning is why M365's current
guidance keeps metaphors deliberately broad.

## What it gets wrong

**Every one of its virtues is hostile to systematization.** Organic asymmetry,
authored gradients, and per piece expression are exactly the properties that
cannot be tagged, deduped, rethemed, or generated. A style built on fluidity
cannot also be a library with a contract, and this one chose fluidity.

**Gradients with no role model make every asset terminal.** Once an illustration
is a set of hand placed stops, the only way to produce a variant is to redraw
it. That is the cost that is now being paid across every surface that adopted
the style.

**Dimension is expensive at small sizes.** Depth, soft shading, and gradient
transitions all stop reading somewhere above the sizes product surfaces
actually need, and the style says nothing about what to do when that happens.

## Relevance to us

1. **This is the cautionary case for the color model.** It is a well argued,
   well executed style that cannot be rethemed, and the reason is that it never
   separated color from meaning. Whatever we decide about tone groups and
   members, the failure mode to avoid is already documented.
2. **Five named commitments is the right size for a style statement.** When
   `schema/anatomy.md` gets its prose section, five defensible commitments beats
   a long list of rules.
3. **Define expressive properties in terms of an existing system primitive.**
   Tying dimension to elevation is the pattern to copy, whatever the equivalent
   primitive turns out to be for us.
4. **Symbol over scenario supports the Builder.** A symbolic vocabulary is
   composable in a way a depicted scene is not, which is the same argument for
   keeping metaphors broad and for tagging structural parts.
5. **Do not inherit the gradient habit without a member model.** The style's
   gradients are the direct ancestor of the gradients in the current Windows
   set, and they carry the same problem. Dedupe by fill, name the member, or
   the library is uncustomizable on arrival.
