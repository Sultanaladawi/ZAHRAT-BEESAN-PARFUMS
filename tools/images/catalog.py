"""Shared catalog helpers for the product-image pipeline.

Layout rule (owner decision):
  - showcase: single bottles (perfumes, perfume oils, minis, hair/body mists)
              are cut out and placed on the house's royal podium template.
  - original: bundles, gift sets, sample cartons, bakhoor/maamoul/oud,
              air & home fresheners and deodorants keep the official photo.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
DATA = PUBLIC / "data"
IMAGES = PUBLIC / "images"

# house key -> (catalog file, image prefix, template background)
HOUSES = {
    "ghalati": ("perfumes.json", "ghalati", "ghalati_master_bg.jpg"),
    "assaf": ("assaf_perfumes.json", "assaf", "assaf_master_bg.jpg"),
    "thnyan": ("thnyan_perfumes.json", "thnyan", "thnyan_master_bg.jpg"),
    "rasasi": ("rasasi_perfumes.json", "rasasi", "rasasi_master_bg.jpg"),
    "alrehab": ("alrehab_perfumes.json", "alrehab", "alrehab_master_bg.jpg"),
    "lebonheur": ("lebonheur_perfumes.json", "lebonheur", "lebonheur_master_bg.jpg"),
    "laverne": ("laverne_perfumes.json", "laverne", "laverne_master_bg.jpg"),
    "deraah": ("deraah_perfumes.json", "deraah", "deraah_master_bg.jpg"),
}

ORIGINAL_CATEGORIES = {"bundle", "gift_set", "bakhoor"}
SHOWCASE_CATEGORIES = {"perfume", "oil", "mini", "hair_mist"}

# Multi-item packs, cartons and offers are never single bottles.
PACK_RE = re.compile(
    r"مجموع|بكج|باكج|باقة|باقه|بوكس|كرتون|اقلام|أقلام|توزيعات|عينات|تستر"
    r"|\d+\s*حب[ةه]|حبات|ثلاثية|ثنائية|\d\s*\+\s*\d|\s\+\s"
    r"|\bbox\b|\bset\b|collection|gift|bundle|tester|discovery|\bpens?\b",
    re.I,
)
# Room/fabric fresheners and deodorants keep the original photo.
FRESHENER_RE = re.compile(
    r"ملطف|معطر\s*(?:ال)?(?:جو|منزل|غرف|بيت|سيار)|مفارش|فواحة|مزيل"
    r"|deodorant|air\s*fresh|home\s*fragrance|room\s*(?:spray|fragrance)",
    re.I,
)
# Hair and body mists are bottles, so they go on the template.
MIST_RE = re.compile(r"معطر\s*(?:ال)?(?:شعر|جسم)|عطر\s*الشعر|hair\s*mist|body\s*mist", re.I)


def text_of(item):
    return " ".join(str(item.get(k) or "") for k in ("title", "titleEn", "subCategoryAr", "subCategoryEn"))


# "من مجموعة X" names the product line of a single bottle, not a pack.
LINE_RE = re.compile(r"من\s+مجموع[ةه]\s+\S+", re.I)


def layout_for(item):
    cat = item.get("categoryType") or "perfume"
    text = LINE_RE.sub(" ", text_of(item))
    if MIST_RE.search(text) and not PACK_RE.search(text):
        return "showcase"
    if FRESHENER_RE.search(text) or PACK_RE.search(text):
        return "original"
    if cat in ORIGINAL_CATEGORIES:
        return "original"
    return "showcase"


def load(house):
    file = HOUSES[house][0]
    return json.loads((DATA / file).read_text(encoding="utf-8"))


def save(house, items):
    file = HOUSES[house][0]
    (DATA / file).write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def image_path(item):
    return PUBLIC / str(item.get("image", "")).split("?")[0]
