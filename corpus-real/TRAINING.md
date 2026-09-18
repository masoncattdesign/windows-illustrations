# Training the WDS illustration LoRA

## What is ready

`wds-pilot-512.zip` — 16 PNGs at 512 with a matching `.txt` caption each, the
flat `image.png` / `image.txt` pair layout every trainer expects. Regenerate it
any time from `corpus-real/` with:

    node scripts/corpus-prep.mjs

Trigger word is `wdsill`. It has to appear in the prompt at generation time or
the LoRA does nothing.

## Two treatments, on purpose

| treatment | n | caption tail |
| --------- | - | ------------ |
| `depth` | 13 | layered flat vector illustration, soft inner shadows and stacked planes, subtle depth |
| `mark`  | 3  | flat vector symbol, smooth blue to purple gradient, no outline, no shadow |

Prompt for one or the other. Asking for neither gets the average of both, which
is the failure this split exists to avoid.

Three examples of `mark` is thin. If the marks come out weak, that is why, and
the fix is more marks in the set rather than more training steps.

## Settings worth starting from

Sixteen images is a small set, so the risk is memorisation, not undertraining.

- Steps: roughly 1500, or about 100 per image. Stop early rather than late.
- Learning rate: 1e-4 for the LoRA, lower if outputs start reproducing the
  training images outright.
- Rank: 16 is plenty. 32+ on 16 images mostly buys overfitting.
- Resolution: 512, matching the set.
- Save intermediate checkpoints. The best one is often not the last.

## How to tell if it worked

Not by whether the pictures look nice. Prompt it for something that is NOT in
the training set but is obviously in the family — a printer, a calendar, a
padlock — and see whether the palette, the inner shadows and the stacked planes
come through. Reproducing a keyboard proves memorisation, not style transfer.

Then run the result through the same ramp the real assets went through. An
output that only holds together at 512 has the same problem the depth assets
already have at 64.

## Where to run it

Hosted trainers take a zip in this exact layout and hand back weights, which is
the fastest route to something demoable. Civitai and fal both run browser based
LoRA trainers; Replicate has off-the-shelf trainers too. Local is possible with
kohya_ss or diffusers if the assets should not leave the machine at all, but on
an M-series Mac expect hours rather than minutes.

Confirm the current trainer and base model before committing — this space moves
faster than any note written in it stays true.
