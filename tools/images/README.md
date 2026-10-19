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
