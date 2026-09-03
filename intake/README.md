# intake/

Raw drop zone. **Gitignored.** Nothing here is committed and nothing here is
reviewed.

Drop material into the right bucket and run `npm run intake:report` to see what
landed.

## Buckets

**`wds/`**: the current shipped WDS illustrations. Whatever form they come in.
SVG preferred. If they arrive as a Figma export, export as SVG with layer names
preserved, because layer names are the only structural signal the normalizer
gets for free.

**`wip/`**: Mason's in-progress work. Same treatment, but expect it to be less
consistent, and that is fine. The survey should call out where WIP conventions
differ from shipped, since those differences are usually where the shipped
system is being outgrown.

**`guidelines/`**: existing design guides, specs, and anything written down
about how these illustrations are supposed to work. Documents, not artwork.
Read these before the artwork. The gap between what the guidelines claim and
what the files actually do is one of the more useful things the survey will
find.

## What happens next

Material leaves this directory only through `scripts/normalize.mjs` plus a
human review, landing in `assets/`. Do not hand-copy files across. The gate is
the point. See `docs/architecture.md`.

## What does not go here

Internal Microsoft reference systems, call transcripts, and unpublished
specs go in `private/`, not here. Both are gitignored, but they get separated
so the boundary stays obvious rather than depending on anyone remembering it.
