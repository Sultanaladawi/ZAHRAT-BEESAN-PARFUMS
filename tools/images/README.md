# Product image pipeline

Rule: single bottles (perfumes, oils, minis, hair mists) are cut out and placed
on the house podium template; bundles, gift sets, sample cartons, bakhoor and
fresheners keep the official store photo.

```bash
python -m venv .venv && .venv/bin/pip install -r tools/images/requirements.txt
cd tools/images
../../.venv/bin/python audit.py                       # what needs changing
../../.venv/bin/python render.py --action to_original # restore official photos
../../.venv/bin/python render.py --action to_showcase # put bottles on the template
../../.venv/bin/python render.py --all-showcase --preview /tmp/stage  # staged re-render with QA metrics
```

- `catalog.py` — layout rule and catalog helpers
- `audit.py` — compares intended layout with each current image
- `render.py` — downloads sources, cuts out bottles (BiRefNet), removes cast
  shadows and floor reflections, composites onto the template
- `qa.py` — rough defect scoring of existing templated images

## Per-product fixes

Some photos need a hint in the catalog entry before rendering:

- `imageLayoutOverride: "original" | "showcase"` forces the layout, e.g. a bottle photographed with its box.
- `cutoutSource` uses a different photo for the cutout.
- `cutoutSolid: true` makes clear or pale glass opaque so the template does not show through it.
- `cutoutMirrorFill: true` rebuilds a symmetric bottle whose side merged into a white backdrop.
- `cutoutMirrorClip: true` trims a shadow or ghost bottle on one side of a symmetric bottle.
- `cutoutClipBodyFrom: 0.4` does the same for the body only (from 40% of the height down), keeping an asymmetric cap.
- `cutoutKeepLargest: true` drops props lying next to the bottle (wood chips, petals).
- `cutoutTrimBottom: 0.08` cuts off a stand or plinth the bottle was photographed on (fraction of the height).
- `cutoutTrimTop: 0.035` cuts a sliver of backdrop the model kept on top of a flat cap.
- `cutoutStraightLeft: true` cuts a shadow bulging past the left side of a straight-sided bottle (charms on the right are kept).
- `cutoutModel: "birefnet-general"` uses the full (slower, ~12 GB RAM) model, which separates soft cast shadows the lite model keeps; render such items one per process.
- `cutoutCapClip: 0.12` keeps only the cap width above that fraction of the height (drops a card standing behind the cap).
- `cutoutRemoveCard: [top, bottom]` whitens a message card standing behind an egg-shaped cap (rows as fractions of the photo height); the cap outline there is extrapolated from below the card.
- `cutoutCrop: [l, t, r, b]` crops the source photo (fractions) before the cutout, e.g. to leave out the box next to a bottle.

After rendering, run `python tools/images/thumbs.py` to refresh the card thumbnails. Image URLs carry `?v=<content hash>` so browsers never show a cached older picture; `python tools/images/versions.py` re-syncs them after manual image edits.
