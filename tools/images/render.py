"""Render product images according to the layout rule in catalog.py.

  python render.py --ids alrehab-123 ghalati-oil-x   # specific products
  python render.py --action to_showcase              # rows from audit.json

Showcase: download the official photo, cut the bottle out (rembg),
drop any mirrored reflection, and place it on the house podium template.
Original: download the official photo and pad it to a clean square.
Sources are cached in tools/images/.cache (git-ignored).
"""
import argparse
import hashlib
import io
import json
import re
import sys
import urllib.request

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

from catalog import HOUSES, IMAGES, PUBLIC, ROOT, image_path, layout_for, load, save

CACHE = ROOT / "tools" / "images" / ".cache"
SIZE = 1024
BOTTLE_BOX = (480, 515)                       # max bottle width/height on the podium
PODIUM_Y = {"ghalati": 746, "assaf": 746}     # y where the bottle touches the podium
DEFAULT_PODIUM_Y = 752
_session = None


def session():
    global _session
    if _session is None:
        from rembg import new_session
        _session = new_session("birefnet-general-lite")
    return _session


def source_url(item):
    for key in ("cutoutSource", "originalImage", "bottleUrl"):
        url = str(item.get(key) or "")
        if url:
            return url
    return ""


def fetch(url):
    if not url.startswith("http"):
        return Image.open(PUBLIC / url.split("?")[0])
    CACHE.mkdir(parents=True, exist_ok=True)
    full = re.sub(r"/[a-f0-9-]+-\d+x[\d.]+-", "/", url)   # Salla: drop the resize prefix
    for candidate in (full, url):
        key = CACHE / hashlib.sha1(candidate.encode()).hexdigest()
        if not key.exists():
            try:
                req = urllib.request.Request(candidate, headers={"User-Agent": "Mozilla/5.0"})
                key.write_bytes(urllib.request.urlopen(req, timeout=40).read())
            except OSError:
                continue
        try:
            return Image.open(io.BytesIO(key.read_bytes()))
        except OSError:
            key.unlink(missing_ok=True)
    raise OSError(f"could not download {url}")


def flatten(img):
    """Composite transparent sources onto white so the cutout model sees edges."""
    img = img.convert("RGBA")
    base = Image.new("RGBA", img.size, (255, 255, 255, 255))
    return Image.alpha_composite(base, img).convert("RGB")


def clean_alpha(alpha):
    a = alpha.astype(np.float32)
    a[a < 20] = 0
    labels, n = ndimage.label(a > 0)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(a), labels, range(1, n + 1))
        keep = np.zeros(n + 1, bool)
        keep[1:] = sizes >= sizes.max() * 0.02
        a[~keep[labels]] = 0
    solid = ndimage.binary_fill_holes(a > 128)
    a = np.where(solid & (a < 230), np.maximum(a, 235), a)   # keep clear glass opaque
    return a


def reflection_line(rgb, alpha):
    """Row where a faded floor reflection starts below the bottle, or None.

    A reflection is a washed-out copy under the base: noticeably brighter
    and more transparent than the bottle above it.
    """
    rows = np.where(alpha.max(axis=1) > 128)[0]
    if len(rows) < 80:
        return None
    top, bottom = rows[0], rows[-1]
    height = bottom - top
    gray = rgb.mean(axis=2)
    solid = alpha > 64
    best_ratio, best_y = 0.0, None
    for y in range(top + int(height * 0.65), bottom - int(height * 0.03)):
        below, above = solid[y:bottom], solid[top:y]
        if below.sum() < 200 or above.sum() < 200:
            continue
        ratio = gray[y:bottom][below].mean() / max(gray[top:y][above].mean(), 1)
        fade = alpha[y:bottom][below].mean() / max(alpha[top:y][above].mean(), 1)
        if fade < 0.97 and ratio > best_ratio:
            best_ratio, best_y = ratio, y
    return best_y if best_ratio > 1.5 else None


def drop_slivers(alpha, radius):
    """Remove thin attached slivers (soft cast shadows) narrower than 2*radius."""
    mask = alpha > 128
    core = ndimage.binary_opening(mask, structure=np.ones((3, 3)), iterations=radius)
    if core.sum() < mask.sum() * 0.7:
        return alpha  # opening ate too much; the bottle itself is thin
    keep = ndimage.binary_dilation(core, structure=np.ones((3, 3)), iterations=radius + 1)
    return np.where(keep, alpha, 0)


def trim_cast_shadow(rgb, alpha):
    """Remove light-grey cast shadow sticking out on one side of the bottle.

    Product shots are near-symmetric around the bottle's vertical axis; a
    studio shadow is light, colourless and only on one side. Pixels like that
    beyond the mirrored outline of the other side are dropped.
    """
    mask = alpha > 128
    if mask.sum() < 500:
        return alpha
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    light = rgb.mean(axis=2)
    shadowish = mask & (sat < 18) & (light > 120) & (light < 248)
    body = mask & ~shadowish
    ys, xs = np.nonzero(body)
    if len(xs) < 200:
        return alpha
    axis = np.median(xs)
    sx = np.nonzero(shadowish)[1]
    if len(sx) < mask.sum() * 0.05 or abs(np.median(sx) - axis) < mask.shape[1] * 0.02:
        return alpha  # no sizeable one-sided grey area: nothing to trim
    out = alpha.copy()
    margin = max(3, int(mask.shape[1] * 0.01))
    for y in np.unique(ys):
        row = np.nonzero(mask[y])[0]
        brow = xs[ys == y]
        reach = max(axis - brow.min(), brow.max() - axis) + margin
        far = np.abs(row - axis) > reach
        out[y, row[far & shadowish[y, row]]] = 0
    return out


def mirror_clip(alpha):
    """For symmetric bottles with a one-sided shadow: mirror the clean side.

    The axis comes from the top of the cap (the shadow starts lower); each
    row is clipped to the extent of its less-wide side, mirrored.
    """
    mask = alpha > 64
    rows = np.where(mask.any(axis=1))[0]
    if len(rows) < 50:
        return alpha
    top = rows[: max(3, len(rows) // 40)]
    centers = []
    for y in top:
        xs = np.nonzero(mask[y])[0]
        centers.append((xs.min() + xs.max()) / 2)
    axis = float(np.median(centers))
    out = alpha.copy()
    for y in rows:
        xs = np.nonzero(mask[y])[0]
        half = min(axis - xs.min(), xs.max() - axis)
        if half <= 0:
            out[y] = 0
            continue
        lo, hi = int(np.floor(axis - half)), int(np.ceil(axis + half))
        out[y, :max(lo, 0)] = 0
        out[y, hi + 1:] = 0
    return out


# Same symmetric bottle shot with a hard one-sided studio shadow.
def needs_mirror_clip(item):
    return item.get("house") in (None, "ghalati") and str(item.get("id", "")).startswith("oil-")


def defringe(rgba):
    arr = np.asarray(rgba, dtype=np.float32).copy()
    a = arr[..., 3]
    inner = ndimage.binary_erosion(a > 250, iterations=2)
    if inner.sum() < 50:
        return rgba
    idx = ndimage.distance_transform_edt(~inner, return_distances=False, return_indices=True)
    edge = (a > 0) & (a < 250)
    src = tuple(i[edge] for i in idx)
    for c in range(3):
        ch = arr[..., c]
        ch[edge] = ch[src] * 0.6 + ch[edge] * 0.4
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGBA")


def solidify(alpha):
    """Make pale or clear glass fully opaque inside the bottle outline.

    The model gives see-through glass a low alpha, so the template's crest
    shows through and the bottle looks washed out. The outline comes from
    every pixel the model kept; inside it the photo's own glass is used.
    """
    mask = ndimage.binary_closing(alpha > 24, structure=np.ones((5, 5)), iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    edge = ndimage.gaussian_filter(mask.astype(np.float32), 1.2) * 255
    return np.where(mask, np.maximum(alpha, edge), alpha)


def mirror_fill(alpha):
    """For symmetric bottles where white glass merged into a white backdrop:
    restore the missing side by mirroring the outline around the cap's axis."""
    mask = alpha > 64
    rows = np.where(mask.any(axis=1))[0]
    if len(rows) < 50:
        return alpha
    centers = [(np.nonzero(mask[y])[0].min() + np.nonzero(mask[y])[0].max()) / 2
               for y in rows[: max(3, len(rows) // 40)]]
    axis = float(np.median(centers))
    xs = np.arange(alpha.shape[1])
    src = np.clip(np.round(2 * axis - xs).astype(int), 0, alpha.shape[1] - 1)
    out = np.maximum(alpha, alpha[:, src])
    # Close short notches along the straight sides before filling rows.
    closed = ndimage.binary_closing(out > 64, structure=np.ones((41, 1)))
    out = np.where(closed, np.maximum(out, 255), out)
    for y in rows:  # straight sides: fill each row between its outer edges
        xs = np.nonzero(out[y] > 64)[0]
        if len(xs):
            out[y, xs.min():xs.max() + 1] = np.maximum(out[y, xs.min():xs.max() + 1], 255)
    return out


def clip_body(alpha, start):
    """Trim a stray strip on one side of the bottle body (rows from `start`,
    a fraction of the height) to the mirrored extent of the narrower side.
    The cap above is left as is, so asymmetric caps survive."""
    mask = alpha > 64
    rows = np.where(mask.any(axis=1))[0]
    if len(rows) < 50:
        return alpha
    body = rows[int(len(rows) * start):]
    centers = [(np.nonzero(mask[y])[0].min() + np.nonzero(mask[y])[0].max()) / 2 for y in body]
    lefts = [np.nonzero(mask[y])[0].min() for y in body]
    rights = [np.nonzero(mask[y])[0].max() for y in body]
    axis = (np.median(lefts) + np.median(rights)) / 2 if len(body) else np.median(centers)
    out = alpha.copy()
    for y in body:
        xs = np.nonzero(mask[y])[0]
        half = min(axis - xs.min(), xs.max() - axis)
        out[y, :max(int(np.floor(axis - half)), 0)] = 0
        out[y, int(np.ceil(axis + half)) + 1:] = 0
    return out


def keep_largest(alpha):
    """Drop props lying next to the bottle (wood chips, petals)."""
    labels, n = ndimage.label(alpha > 64)
    if n < 2:
        return alpha
    sizes = ndimage.sum(np.ones_like(alpha), labels, range(1, n + 1))
    keep = ndimage.binary_dilation(labels == (int(np.argmax(sizes)) + 1), iterations=3)
    return np.where(keep, alpha, 0)


def cutout(img, mirror=False, solid=False, mirror_fill_=False, body_clip=None, largest=False,
           trim_bottom=None, trim_top=None, straight_left=False):
    from rembg import remove
    img.thumbnail((1200, 1200), Image.LANCZOS)
    rgb = flatten(img)
    cut = remove(rgb, session=session())
    arr = np.asarray(cut)
    alpha = clean_alpha(arr[..., 3])
    rows = np.where(alpha.max(axis=1) > 128)[0]
    if mirror:
        alpha = mirror_clip(alpha)
    else:
        alpha = trim_cast_shadow(arr[..., :3].astype(np.float32), alpha)
    alpha = drop_slivers(alpha, max(2, int((rows[-1] - rows[0]) * 0.006)) if len(rows) else 2)
    line = reflection_line(arr[..., :3].astype(np.float32), alpha)
    if line is not None:
        alpha[line:] = 0
    if largest:
        alpha = keep_largest(alpha)
    if mirror_fill_:
        alpha = mirror_fill(alpha)
    if body_clip:
        alpha = clip_body(alpha, body_clip)
    if solid:
        alpha = solidify(alpha)
        cut = rgb.convert("RGBA")  # the model blanks colours it dropped; use the photo's
    if straight_left:
        # The bottle's left side is straight; a shadow bulging past the
        # body's usual left edge is cut off (charms on the right are kept).
        rows = np.where(alpha.max(axis=1) > 64)[0]
        if len(rows):
            h = rows[-1] - rows[0]
            body = rows[(rows > rows[0] + h * 0.45) & (rows < rows[0] + h * 0.9)]
            lefts = [np.nonzero(alpha[y] > 64)[0].min() for y in body]
            limit = int(np.percentile(lefts, 70)) if lefts else 0
            for y in rows[rows > rows[0] + h * 0.35]:
                alpha[y, :limit] = 0
    if trim_top:
        # Drop a sliver of backdrop the model kept on top of a flat cap.
        rows = np.where(alpha.max(axis=1) > 64)[0]
        if len(rows):
            alpha[:rows[0] + int((rows[-1] - rows[0]) * trim_top)] = 0
    if trim_bottom:
        # Drop a stand or plinth the bottle was photographed on.
        rows = np.where(alpha.max(axis=1) > 64)[0]
        if len(rows):
            alpha[rows[-1] - int((rows[-1] - rows[0]) * trim_bottom):] = 0
    cut.putalpha(Image.fromarray(alpha.clip(0, 255).astype(np.uint8)))
    cut = defringe(cut)
    return cut.crop(cut.getbbox()), {"reflectionRemoved": line is not None, **cut_metrics(alpha)}


def cut_metrics(alpha):
    """Simple checks on the bottle silhouette; see QA_LIMITS."""
    mask = alpha > 128
    if mask.sum() < 500:
        return {"hollow": 1.0, "pieces": 0, "aspect": 0.0}
    filled = ndimage.binary_fill_holes(mask)
    labels, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, labels, range(1, n + 1))
    ys, xs = np.nonzero(mask)
    return {
        "hollow": round(float(1 - mask.sum() / filled.sum()), 3),
        "pieces": int((sizes > mask.sum() * 0.03).sum()),
        "aspect": round(float((np.ptp(xs) + 1) / (np.ptp(ys) + 1)), 2),
    }


QA_LIMITS = {"hollow": 0.04, "pieces": 1, "aspect": 1.35}


def qa_pass(info):
    return (info.get("hollow", 0) <= QA_LIMITS["hollow"]
            and info.get("pieces", 1) <= QA_LIMITS["pieces"]
            and info.get("aspect", 0) <= QA_LIMITS["aspect"])


def showcase(item, house):
    src = fetch(source_url(item))
    if item.get("cutoutCrop"):
        # Fractions [left, top, right, bottom]: keep only the bottle when the
        # photo also shows its box.
        l, t, r, b = item["cutoutCrop"]
        src = src.crop((round(l * src.width), round(t * src.height), round(r * src.width), round(b * src.height)))
    cut, info = cutout(src, mirror=(house == "ghalati" and needs_mirror_clip(item)) or bool(item.get("cutoutMirrorClip")),
                       solid=bool(item.get("cutoutSolid")),
                       mirror_fill_=bool(item.get("cutoutMirrorFill")),
                       body_clip=item.get("cutoutClipBodyFrom"),
                       largest=bool(item.get("cutoutKeepLargest")),
                       trim_bottom=item.get("cutoutTrimBottom"),
                       trim_top=item.get("cutoutTrimTop"),
                       straight_left=bool(item.get("cutoutStraightLeft")))
    bg = Image.open(IMAGES / HOUSES[house][2]).convert("RGBA").resize((SIZE, SIZE), Image.LANCZOS)
    scale = min(BOTTLE_BOX[0] / cut.width, BOTTLE_BOX[1] / cut.height)
    cut = cut.resize((max(1, round(cut.width * scale)), max(1, round(cut.height * scale))), Image.LANCZOS)
    base_y = PODIUM_Y.get(house, DEFAULT_PODIUM_Y)
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    rx, cx = cut.width * 0.45, SIZE / 2
    ImageDraw.Draw(shadow).ellipse([cx - rx, base_y - 11, cx + rx, base_y + 7], fill=(27, 18, 9, 150))
    bg = Image.alpha_composite(bg, shadow.filter(ImageFilter.GaussianBlur(6)))
    bg.alpha_composite(cut, ((SIZE - cut.width) // 2, base_y - cut.height))
    return bg.convert("RGB"), info


def original(item, house):
    img = flatten(fetch(source_url(item)))
    arr = np.asarray(img)
    edge = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]])
    fill = tuple(int(v) for v in np.median(edge, axis=0))
    if edge.std(axis=0).mean() > 25:
        # Busy lifestyle photo: padding would show bars, so crop to a square.
        side = min(img.size)
        left, top = (img.width - side) // 2, (img.height - side) // 2
        return img.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.LANCZOS), {}
    img.thumbnail((SIZE, SIZE), Image.LANCZOS)
    canvas = Image.new("RGB", (SIZE, SIZE), fill)
    canvas.paste(img, ((SIZE - img.width) // 2, (SIZE - img.height) // 2))
    return canvas, {}


def versioned(path):
    """Point the image URL at its current content, so browsers never reuse a
    cached older picture that had the same URL."""
    base = path.partition("?")[0]
    digest = hashlib.md5((PUBLIC / base).read_bytes()).hexdigest()[:8]
    return f"{base}?v={digest}"


def render(item, house, out_dir=None):
    layout = layout_for(item)
    img, info = (showcase if layout == "showcase" else original)(item, house)
    target = image_path(item) if out_dir is None else out_dir / f"{item['id']}.jpg"
    img.save(target, "JPEG", quality=90, optimize=True, progressive=True)
    return layout, info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", nargs="*", default=[])
    ap.add_argument("--action", choices=["to_showcase", "to_original"])
    ap.add_argument("--all-showcase", action="store_true", help="every single-bottle product")
    ap.add_argument("--houses", nargs="*", default=list(HOUSES))
    ap.add_argument("--preview", help="stage images here (resumable) instead of public/images")
    args = ap.parse_args()

    wanted = set(args.ids)
    if args.action:
        rows = json.loads((ROOT / "tools" / "images" / "audit.json").read_text(encoding="utf-8"))
        wanted |= {r["id"] for r in rows if r["action"] == args.action}
    out_dir, metrics = None, {}
    if args.preview:
        from pathlib import Path
        out_dir = Path(args.preview)
        out_dir.mkdir(parents=True, exist_ok=True)
        metrics_file = out_dir / "metrics.json"
        if metrics_file.exists():
            metrics = json.loads(metrics_file.read_text(encoding="utf-8"))

    done, failed = 0, []
    for house in args.houses:
        items = load(house)
        changed = False
        for item in items:
            pick = item["id"] in wanted or (args.all_showcase and layout_for(item) == "showcase")
            if not pick or item["id"] in metrics:
                continue
            try:
                layout, info = render(item, house, out_dir)
            except Exception as exc:  # keep going; report at the end
                failed.append((item["id"], str(exc)[:120]))
                print(f"{house:10} FAILED    {item['id']} {str(exc)[:120]}", flush=True)
                continue
            done += 1
            print(f"{house:10} {layout:9} {item['id']} {info}", flush=True)
            if out_dir is not None:
                metrics[item["id"]] = {"house": house, "layout": layout, **info}
                if done % 10 == 0:
                    metrics_file.write_text(json.dumps(metrics, indent=1), encoding="utf-8")
            else:
                item["image"] = versioned(item["image"])
                item["imageLayout"] = layout
                changed = True
        if changed:
            save(house, items)
    if out_dir is not None:
        metrics_file.write_text(json.dumps(metrics, indent=1), encoding="utf-8")
    print(f"rendered {done}, failed {len(failed)}")
    for fid, err in failed:
        print("  FAIL", fid, err)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
