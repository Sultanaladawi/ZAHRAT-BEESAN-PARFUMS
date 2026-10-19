"""Flag showcase images whose bottle cut-out looks broken.

Compares each templated image with its house background to recover the
bottle silhouette, then scores common failures:
  hollow   - large see-through holes inside the bottle outline
  wide     - silhouette far wider than a bottle (shelves, bags, strips)
  pieces   - several separate fragments
  streaks  - thin horizontal bars left over from the old background
Writes tools/images/qa.json sorted worst first.
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

from catalog import HOUSES, IMAGES, ROOT, image_path, layout_for, load

REGION = (150, 60, 874, 760)   # area above the podium where bottles stand


def silhouette(img, bg):
    a = np.asarray(img.crop(REGION), dtype=np.int16)
    b = np.asarray(bg.crop(REGION), dtype=np.int16)
    mask = np.abs(a - b).max(axis=2) > 28
    mask = ndimage.binary_opening(mask, iterations=1)
    return mask


def score(mask):
    if mask.sum() < 800:
        return {"empty": 1.0}, 10.0
    labels, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, labels, range(1, n + 1))
    big = sizes[sizes > mask.sum() * 0.03]
    filled = ndimage.binary_fill_holes(mask)
    hollow = 1 - mask.sum() / max(filled.sum(), 1)
    ys, xs = np.nonzero(mask)
    w, h = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    widths = mask.sum(axis=1)
    streak_rows = np.sum(widths > w * 0.9) / h if h else 0
    m = {
        "hollow": round(float(hollow), 3),
        "aspect": round(float(w / h), 2),
        "pieces": int(len(big)),
        "streaks": round(float(streak_rows), 3),
        "height": int(h),
    }
    s = (max(0, hollow - 0.08) * 12 + max(0, w / h - 1.25) * 4
         + max(0, len(big) - 1) * 1.5 + max(0, streak_rows - 0.35) * 6
         + (2 if h < 180 else 0))
    return m, round(float(s), 2)


def main():
    rows = []
    for house, (_, _, bg_name) in HOUSES.items():
        bg = Image.open(IMAGES / bg_name).convert("RGB").resize((1024, 1024))
        for item in load(house):
            if layout_for(item) != "showcase":
                continue
            try:
                img = Image.open(image_path(item)).convert("RGB").resize((1024, 1024))
            except OSError:
                continue
            m, s = score(silhouette(img, bg))
            rows.append({"house": house, "id": item["id"], "title": item.get("title"), "score": s, **m})
    rows.sort(key=lambda r: -r["score"])
    (ROOT / "tools" / "images" / "qa.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    flagged = [r for r in rows if r["score"] >= 1.5]
    print(f"checked {len(rows)}, flagged {len(flagged)}")
    by = {}
    for r in flagged:
        by[r["house"]] = by.get(r["house"], 0) + 1
    print(by)
    return 0


if __name__ == "__main__":
    sys.exit(main())
