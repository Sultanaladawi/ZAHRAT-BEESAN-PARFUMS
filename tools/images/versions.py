"""Set every product image URL to ?v=<content hash> (see render.versioned).

Run after replacing images by hand; render.py already does this itself.
"""
from catalog import HOUSES, PUBLIC, load, save
from render import versioned

for house in HOUSES:
    items, changed = load(house), 0
    for item in items:
        src = str(item.get("image") or "")
        if src.startswith("images/") and (PUBLIC / src.split("?")[0]).exists():
            new = versioned(src)
            if new != src:
                item["image"], changed = new, changed + 1
    if changed:
        save(house, items)
    print(f"{house:10} updated {changed}")
