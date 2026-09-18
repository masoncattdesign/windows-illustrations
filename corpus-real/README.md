# corpus-real/

The real assets. Training data comes from here; `corpus/` is synthetic and is a
different style (see below).

## What to drop in

PNG exports of the pilot set, Figma file `nCfGzJyWPkiyy2HxPDSWRr`, node
`4802-20896`, the 1900x1400 frame `4791:3487`. Twelve 400x400 frames.

**Export from Figma directly, not through the tooling.** Select the twelve
frames, Export, PNG, 2x or larger. It takes about thirty seconds and the pixels
are exact.

Do not round trip them as SVG and rasterise locally. Ten of the twelve build
their colour with a `mix-blend-mode: hue` gradient over a solid, inside a group
carrying `feMorphology` inner shadows. librsvg, which is what `sharp` uses,
renders that whole construction as solid black. Verified, not assumed. Chromium
renders it correctly, so a headless browser is the fallback if a scripted
pipeline is ever needed.

## Naming

Eleven of the twelve frames are called `Illustration`, so the names carry no
information. Name the files for the subject, since the filename becomes the
caption stem:

  keyboard-numpad, fingerprint, location-pin, wifi, keyboard,
  voice-secure, chat-pair, chat-typing, folder-edge-sync, laptop,
  device-sync, laptop-content

## Why corpus/ is not training data for this style

`corpus/` generates flat two tone compositions: a geometric base carrying a
silhouette, one shape inside another. The pilot set is not that. It is free
standing objects with gradients, perspective and layered depth, mostly with no
base shape at all. Mixing the two teaches a model two contradictory styles.

`corpus/` is still the right training data for the *composed* style the parts
library describes. It is the wrong training data for the pilot set.
