"""Build light card thumbnails: public/images/thumbs/<name>.webp (400px).

Product cards load these instead of the 1024px originals; the product page
still shows the full image.  Run after any image change:

    python tools/images/thumbs.py          # only missing or outdated thumbs
"""
import sys

from PIL import Image

from catalog import HOUSES, IMAGES, image_path, load

THUMBS = IMAGES / "thumbs"
SIZE = 400


def thumb_path(src):
    return THUMBS / (src.stem + ".webp")


def build(src):
    dst = thumb_path(src)
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return False
    img = Image.open(src).convert("RGB")
    img.thumbnail((SIZE, SIZE), Image.LANCZOS)
    img.save(dst, "WEBP", quality=74, method=6)
    return True


def main():
    THUMBS.mkdir(exist_ok=True)
    made = 0
    for house in HOUSES:
        for item in load(house):
            src = image_path(item)
            if src.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") and src.exists():
                made += build(src)
    print(f"thumbnails written: {made}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
