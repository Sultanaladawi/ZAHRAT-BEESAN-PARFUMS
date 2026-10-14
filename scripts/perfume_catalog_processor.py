#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
👑 قصر زهرة بيسان للعطور الملكية — Zahrat Beesan Parfums
أداة سحب وأرشفة وتفريغ خلفيات عطور الكتالوج بصيغة PNG شفافة عالية الدقة
Perfumes PNG Catalog Archiver & Background Processor
=============================================================================
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
from urllib.parse import urlparse
import urllib.request
from typing import Optional, List, Dict

try:
    from PIL import Image
except ImportError:
    print("❌ مكتبة Pillow غير مثبتة. يرجى تثبيتها عبر: pip install pillow")
    sys.exit(1)

# محاولة استيراد rembg للتفريغ الذكي فائق الدقة
REMBG_AVAILABLE = False
try:
    from rembg import remove, new_session
    rembg_session = new_session("isnet-general-use")
    REMBG_AVAILABLE = True
    print("✨ تم تحميل محرك الذكاء الاصطناعي لتفريغ الصور (rembg: isnet-general-use) بنجاح!")
except Exception:
    print("⚠️ ملاحظة: مكتبة rembg غير مفعلة، سيتم استخدام المعالج المدمج (Pillow Smart Alpha). لتفعيل الذكاء الاصطناعي الكامل: pip install rembg onnxruntime")

# تنظيف أسماء الملفات لنظام ويندوز والأنظمة الأخرى
def sanitize_filename(name: str) -> str:
    # إزالة الرموز غير المسموحة في أسماء الملفات: <>:"/\|?*
    cleaned = re.sub(r'[<>:"/\\|?*]', '_', name)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned[:120]  # حد أقصى لطول الاسم

# إزالة الخلفية بجودة عالية
def remove_background(image: Image.Image) -> Image.Image:
    if REMBG_AVAILABLE:
        try:
            return remove(
                image,
                session=rembg_session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=15,
                alpha_matting_erode_size=10
            )
        except Exception as e:
            print(f"  ⚠️ خطأ في rembg ({e})، جاري التراجع للمعالج المدمج...")

    # تفريغ مدمج خفيف للخلفيات البيضاء والرمادية الفاتحة
    img = image.convert("RGBA")
    datas = img.getdata()
    newData = []
    for item in datas:
        # فحص إذا كان البكسل أبيض أو قريباً من الأبيض النقي
        if item[0] > 235 and item[1] > 235 and item[2] > 235:
            # تدرج ناعم للحواف
            diff = min(item[0] - 235, item[1] - 235, item[2] - 235)
            alpha = max(0, 255 - diff * 12)
            newData.append((item[0], item[1], item[2], alpha))
        else:
            newData.append(item)
    img.putdata(newData)
    return img

# معالجة مجلد محلي على الجهاز
def process_local_folder(local_folder: Path, output_folder: Path):
    if not local_folder.exists() or not local_folder.is_dir():
        print(f"❌ المجلد المحلي المحدد غير موجود: {local_folder}")
        return

    output_folder.mkdir(parents=True, exist_ok=True)
    supported_exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
    files = [f for f in local_folder.iterdir() if f.suffix.lower() in supported_exts]

    print(f"\n📂 بدء معالجة المجلد المحلي: {local_folder}")
    print(f"📦 تم العثور على {len(files)} صورة.")

    for idx, f in enumerate(files, 1):
        target_name = sanitize_filename(f.stem) + ".png"
        target_path = output_folder / target_name
        print(f"  [{idx}/{len(files)}] جاري معالجة: {f.name} -> {target_name}...")
        try:
            with Image.open(f) as img:
                out_img = remove_background(img)
                out_img.save(target_path, "PNG", optimize=True)
        except Exception as e:
            print(f"  ❌ خطأ أثناء معالجة {f.name}: {e}")

    print(f"\n✅ اكتملت معالجة المجلد المحلي بنجاح! تم الحفظ في: {output_folder}\n")

# سحب الكتالوج المعتمد من المتجر وتفريغه وتنظيمه في فولدرات الشركات
def process_and_save_catalog(output_folder: Path, max_per_brand: int = 50):
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "public" / "data"

    # خريطة ملفات الكتالوج الرسمية لكل ماركة
    brand_configs = [
        {"id": "laverne", "nameAr": "دار لافيرن", "file": data_dir / "laverne_perfumes.json"},
        {"id": "assaf", "nameAr": "عطور عساف", "file": data_dir / "assaf_perfumes.json"},
        {"id": "ghalati", "nameAr": "دار غلاتي", "file": data_dir / "perfumes.json"},
        {"id": "thunayan", "nameAr": "عطور ثنيان", "file": data_dir / "thnyan_perfumes.json"},
        {"id": "rasasi", "nameAr": "شركة الرصاصي", "file": base_dir / "data" / "rasasi_master_archive.json"},
        {"id": "al-rehab", "nameAr": "شركة الرحاب", "file": base_dir / "data" / "alrehab_master_archive.json"},
        {"id": "deraah", "nameAr": "شركة درعه", "file": data_dir / "deraah_perfumes.json"},
        {"id": "labonair", "nameAr": "لو بانهور", "file": data_dir / "lebonheur_perfumes.json"},
    ]

    print(f"\n👑 زهرة بيسان — بدء أرشفة وتفريغ كتالوج العطور...")
    print(f"📁 مجلد الإخراج الرئيسي: {output_folder}")
    print(f"🎯 الحد الأقصى لكل دار: {max_per_brand if max_per_brand > 0 else 'كافة المنتجات (بلا حدود)'}\n")

    for brand in brand_configs:
        file_path = brand["file"]
        if not file_path.exists():
            print(f"⚠️ ملف البيانات لـ {brand['nameAr']} غير موجود: {file_path}")
            continue

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                items = json.load(f)
        except Exception as e:
            print(f"❌ تعذر قراءة بيانات {brand['nameAr']}: {e}")
            continue

        brand_folder = output_folder / sanitize_filename(brand["nameAr"])
        brand_folder.mkdir(parents=True, exist_ok=True)

        limit = len(items) if max_per_brand <= 0 else min(max_per_brand, len(items))
        print(f"\n🏛️ دار: {brand['nameAr']} | إجمالي المنتجات: {len(items)} | سيتم معالجة: {limit}")

        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

        for i in range(limit):
            item = items[i]
            title = item.get("title") or item.get("name") or item.get("nameAr") or f"perfume_{i+1}"
            safe_title = sanitize_filename(title)
            target_path = brand_folder / f"{safe_title}.png"

            # تحقق مما إذا كان الملف موجوداً مسبقاً لتوفير الوقت
            if target_path.exists():
                print(f"  [{i+1}/{limit}] موجود مسبقاً: {safe_title}")
                continue

            # تحديد مسار أو رابط الصورة
            img_url = item.get("bottleUrl") or item.get("image") or item.get("originalImage")
            if not img_url:
                continue

            temp_file = brand_folder / f"_temp_{i}.jpg"
            download_success = False

            try:
                # إذا كانت صورة محلية في المتجر
                if img_url.startswith("images/") or img_url.startswith("/images/"):
                    local_img_path = base_dir / "public" / img_url.lstrip("/")
                    if local_img_path.exists():
                        with Image.open(local_img_path) as img:
                            out_img = remove_background(img)
                            out_img.save(target_path, "PNG", optimize=True)
                            print(f"  [{i+1}/{limit}] ✅ تم تفريغ وحفظ (محلي): {safe_title}")
                            continue

                # إذا كان رابط سحابي (CDN)
                if img_url.startswith("http"):
                    req = urllib.request.Request(img_url, headers=headers)
                    with urllib.request.urlopen(req, timeout=15) as response, open(temp_file, 'wb') as out_file:
                        out_file.write(response.read())
                    download_success = True

                if download_success and temp_file.exists():
                    with Image.open(temp_file) as img:
                        out_img = remove_background(img)
                        out_img.save(target_path, "PNG", optimize=True)
                        print(f"  [{i+1}/{limit}] ✅ تم سحب وتفريغ (أونلاين): {safe_title}")
            except Exception as e:
                print(f"  [{i+1}/{limit}] ❌ تعذر معالجة {title}: {e}")
            finally:
                if temp_file.exists():
                    try:
                        temp_file.unlink()
                    except Exception:
                        pass

    print(f"\n🎉 تم الانتهاء بنجاح من أرشفة وتفريغ الكتالوج بالكامل في: {output_folder}\n")

def main():
    parser = argparse.ArgumentParser(
        description="أداة زهرة بيسان لسحب وأرشفة وتفريغ خلفيات العطور بصيغة PNG شفافة عالية الجودة."
    )
    parser.add_argument(
        "--output",
        type=str,
        default="Perfumes_PNG_Catalog",
        help="مسار المجلد الرئيسي لحفظ فولدرات الشركات والعطور (الافتراضي: Perfumes_PNG_Catalog)",
    )
    parser.add_argument(
        "--max-per-brand",
        type=int,
        default=50,
        help="الحد الأقصى لعدد العطور المسحوبة لكل شركة (الافتراضي: 50، ضع 0 لكافة المنتجات)",
    )
    parser.add_argument(
        "--local-folder",
        type=str,
        default=None,
        help="اختياري: مسار مجلد صور على جهازك لتفريغ خلفيتها وظلالها مباشرةً",
    )
    args = parser.parse_args()

    if args.local_folder:
        process_local_folder(Path(args.local_folder), Path(args.output))
    else:
        process_and_save_catalog(Path(args.output), max_per_brand=args.max_per_brand)

if __name__ == "__main__":
    main()
