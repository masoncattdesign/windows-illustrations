# Windows Illustrations

The illustration library for Windows Design Systems. Sibling to
[expressive-assets](https://github.com/masoncattdesign/expressive-assets),
which covers the icon side of the same program.

This repo holds the artwork, the metadata that describes each illustration
shape by shape, and the tooling that keeps the two in sync.

## Why the metadata matters

Every shape in every illustration carries two independent IDs:

- a **structural ID**, saying what part of the picture it is
- a **color ID**, saying which tone group and member it belongs to

That pair is what lets one library serve very different consumers. The
customizer rethemes an illustration by reading color IDs. The Builder composes
new illustrations by reading structural IDs. Neither works without tagging that
is applied by script rather than by hand.

The model is inherited from the icon library, where it was settled after
measuring 3,234 assets. Notably, 48 colored icons could not be split into two
color groups on color alone, which is what proved the structural axis had to be
there too.

## Layout

| Path | What it holds |
|---|---|
| `assets/` | Normalized, reviewed illustrations. One directory per illustration. |
| `manifest.json` | Generated index of `assets/`. Do not edit by hand. |
| `schema/` | Anatomy, naming, JSON schema, Bridge contract. |
| `scripts/` | `manifest`, `validate`, `normalize`. Node ESM, no dependencies. |
| `docs/` | Architecture and the integration contract for each consumer. |
| `references/` | Analysis of other illustration systems. |
| `intake/` | Raw drop zone. Not committed. |
| `private/` | Internal material. Not committed. |

## Use

No build step and no dependencies. Node 18 or newer.

```
npm run manifest    # rebuild manifest.json from assets/
npm run validate    # check assets, metadata, and manifest freshness
```

Both must pass before any commit.

## Status

Scaffolding. The artwork has not landed yet and the schema is not settled. See
`NEXT.md` for the ordered work list and `CLAUDE.md` for the operating manual.

## Credits

Built by Mason Catt as part of ongoing work on expressive assets for Windows.
Illustration source artwork is property of Microsoft.

## License

MIT
