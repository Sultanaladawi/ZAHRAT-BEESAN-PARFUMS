"""Compare each product's intended layout with what its current image shows.

Writes tools/images/audit.json with one row per product:
  layout      intended layout (showcase / original)
  templated   whether the current image already sits on the house template
  action      ok | to_showcase | to_original
"""
import json
import sys

import numpy as np
from PIL import Image

from catalog import HOUSES, IMAGES, ROOT, image_path, layout_for, load

# Patches that are plain template background (wall corners beside the podium).
PATCHES = [(30, 30, 110, 110), (914, 30, 994, 110), (30, 420, 90, 520), (934, 420, 994, 520)]


def patch_diff(img, bg):
    diffs = []
    for box in PATCHES:
        a = np.asarray(img.crop(box), dtype=np.float32)
        b = np.asarray(bg.crop(box), dtype=np.float32)
        diffs.append(float(np.abs(a - b).mean()))
    return sorted(diffs)[1]  # tolerate one patch covered by a wide bottle


def main():
    rows = []
    for house, (_, _, bg_name) in HOUSES.items():
        bg = Image.open(IMAGES / bg_name).convert("RGB").resize((1024, 1024))
        for item in load(house):
            path = image_path(item)
            try:
                img = Image.open(path).convert("RGB").resize((1024, 1024))
                diff = patch_diff(img, bg)
            except (OSError, ValueError):
                diff = 999.0
            templated = diff < 5
            layout = layout_for(item)
            if layout == "showcase" and not templated:
                action = "to_showcase"
            elif layout == "original" and templated:
                action = "to_original"
            else:
                action = "ok"
            rows.append({
                "house": house, "id": item["id"], "title": item.get("title"),
                "category": item.get("categoryType"), "layout": layout,
                "templated": templated, "diff": round(diff, 1), "action": action,
            })
    out = ROOT / "tools" / "images" / "audit.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    summary = {}
    for r in rows:
        key = (r["house"], r["action"])
        summary[key] = summary.get(key, 0) + 1
    for (house, action), n in sorted(summary.items()):
        print(f"{house:10} {action:12} {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
