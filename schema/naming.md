# Naming

**Status: partial.** Slug rules below are enforced by `npm run validate` today.
The category taxonomy and variant rules are NEXT.md item 7 and wait on the
intake survey, because the taxonomy should describe the library that exists
rather than one invented in advance.

## Slugs

Enforced now, for both category directories and illustration directories.

- lowercase ASCII letters and digits, hyphen separated
- no leading, trailing, or doubled hyphens
- 64 characters maximum
- no version numbers, no dates, no author initials, no `final`, no `v2`
- pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`

Good: `empty-inbox`, `setup-complete`, `printer-offline`
Bad: `Empty_Inbox`, `empty-inbox-v2`, `emptyInbox`, `empty--inbox`

## Directory shape

One illustration is one directory. The directory is the unit, not the file,
because an illustration will usually have more than one crop or canvas.

```
assets/<category>/<slug>/
  <slug>.svg        the primary artwork
  meta.json         required
```

`meta.json` fields checked today:

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Human-readable. Free text. |
| `slug` | no | If present, must match the directory name. |
| `category` | no | If present, must match the parent directory. |
| `status` | no | `draft`, `review`, `published`, or `deprecated`. Defaults to `draft`. |
| `tags` | no | Array of slugs. |

The full field set arrives with `illustration.schema.json` in NEXT.md item 6.

## Still to decide

- **Category taxonomy.** Flat or nested. What the top-level buckets are. Derive
  from the survey, not from a guess.
- **Variant suffixes.** How crops, aspect ratios, and canvas sizes are named
  within an illustration directory.
- **Renaming.** How a slug changes without breaking the gallery, the
  customizer, or anything holding a stored reference. Likely an alias list in
  the manifest, but that is not decided.
