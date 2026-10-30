# 🌿 دار زهرة بيسان للعطور الملكية | Zahrat Beesan Parfums 👑
> **متجر النخبة للعطور العربية والفرنسية الفاخرة | Haute Parfumerie & Luxury E-Commerce**

[![GitHub license](https://img.shields.io/badge/license-MIT-gold.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Node.js-blue.svg)]()
[![Status](https://img.shields.io/badge/status-Production%20Ready-emerald.svg)]()
[![Catalog Items](https://img.shields.io/badge/Catalog-116%20Exclusive%20Products-amber.svg)]()

---

## 🌟 نبذة عن المشروع | Overview

**دار زهرة بيسان للعطور (Zahrat Beesan Parfums)** هو منصة تجارة إلكترونية ملكية فاخرة، تم تصميمها وهندستها بأعلى معايير الفخامة لتقديم تجربة تسوق تفاعلية استثنائية لعشاق العطور الراقية في الأردن، دول الخليج العربي، وحول العالم.

يضم المتجر التشكيلة الرسمية الكاملة لـ **دار غلاتي السعودية (Ghalati)** بالإضافة إلى نخبة الإصدارات الملكية، بإجمالي **116 منتجاً معتمداً 100%**:
1. 💎 **العطور الفاخرة الملكية (57 عطراً)**: مع الهرم العطري المفصل (الافتتاحية، قلب العطر، القاعدة، والروائح البارزة).
2. 🎁 **باقات ومجموعات الإهداء والتراث (22 باقة)**: صناديق ديوراما فاخرة ومجموعات التراث الأصيل (طويق، الروشن، سدو، اليمامة، ديسكفري، ولاكجري).
3. 🪵 **البخور والمعمول والعود الملكي (15 منتجاً)**: أجود أنواع العود الأزرق، المبثوث، ومعمول دار الكرم ووصائف.
4. 💧 **الزيوت العطرية والتولات النقية (22 تولة 15 مل)**: خلاصات نقية مركزة خالية من الكحول.

---

## ✨ المميزات الرئيسية | Key Features

- 🏛️ **القالب الملكي الموحد (Royal Showcase Pedestal)**: صور استثنائية عالية الدقة للمنتجات مستقرة على منصة رخامية ملكية مع ظلال واقعية وإضاءة استوديو متقدمة.
- 📦 **صور العطور مع العلب الفاخرة (Bottle with Luxury Packaging / Box)**: صور غير مقصوصة للعطور إلى جانب علبها وكرتوناتها الرسمية الفاخرة الموثقة.
- 📜 **توثيق موسوعة فراجرانتيكا العالمية (Fragrantica Arabia Integration)**:
  - ربط رسمي مباشر بصفحة توثيق كل عطر على موسوعة Fragrantica.
  - بطاقات الهرم العطري والمكونات والاتفاقات الرئيسية (Main Accords & Olfactory Notes).
  - شارة توثيق رسمية في نافذة التفاصيل السريعة (Quick View Modal).
- 🚫 **خلو تام من تكرار الصور (Zero Duplicate Imagery)**: تنظيم فائق لمعرض الصور داخل النافذة التفاعلية بدون تكرار الزجاجة الصافية، وتوفير تجربة استعراض سلسة.
- 💱 **محول عملات ديناميكي متعدد الدول**: يدعم 10 عملات رئيسية (JOD, SAR, AED, QAR, KWD, BHD, OMR, USD, EUR, GBP) مع حساب فوري لأسعار الصرف وهوامش الربح المعتمدة.
- 🌐 **دعم كامل للثنائية اللغوية (عربي / إنجليزي)**: تبديل فوري للغة والاتجاه (RTL / LTR) مع قواميس نصوص معتمدة 100%.
- 📲 **نظام طلب مباشر عبر WhatsApp**: توليد رسائل طلب منسقة تلقائياً باسم العطر والسعر بالعملة المحددة ورقم خدمة العملاء المعتمد (+962796697413).
- 🛡️ **توثيق التراخيص الرسمية**: بطاقة ترخيص رسمي لوزارة الصناعة والتجارة الأردنية وضريبة الدخل مع السجل التجاري والرقم الضريبي.
- ⚡ **أداء فائق وتصميم متجاوب**: متوافق تماماً مع جميع الهواتف الذكية والأجهزة اللوحية وشاشات الحواسيب المكتبية.

---

## 🏗️ هيكلية المشروع | Project Structure

```text
zahrat-beesan-perfumes/
├── public/
│   ├── index.html              # الواجهة الرئيسية للمتجر الملكي
│   ├── css/
│   │   └── style.css           # تصميم CSS المخصص ونظام الألوان الملكي والخطوط
│   ├── js/
│   │   ├── app.js              # منطق التفاعل، إدارة المعرض، وتصفية المنتجات
│   │   └── translations.js     # قاموس الترجمة المعتمد ثنائي اللغة (عربي / إنجليزي)
│   ├── data/
│   │   └── perfumes.json       # قاعدة بيانات المنتجات (116 منتج معتمد بكافة الحقول)
│   └── images/                 # الصور الملكية وقوالب العرض والزجاجات الصافية
├── data/                       # ملفات الربط والمسح الشامل وبيانات فراجرانتيكا
├── scripts/                    # أدوات المعالجة والتحديث التلقائي للكتالوج
├── server.js                   # خادم ويب خفيف وسريع يعتمد على Node.js و Express
├── package.json                # التبعيات ومعلومات الحزمة
└── README.md                   # التوثيق الشامل للمشروع
```

---

## 🚀 التشغيل المحلي | Getting Started

### المتطلبات المسبقة
- [Node.js](https://nodejs.org/) (الإصدار 18 أو أحدث)
- npm (الإصدار 9 أو أحدث)

### التثبيت والتشغيل
1. استنساخ المستودع:
   ```bash
   git clone https://github.com/Sultanaladawi/ZAHRAT-BEESAN-PARFUMS.git
   cd ZAHRAT-BEESAN-PARFUMS
   ```

2. تثبيت الحزم:
   ```bash
   npm install
   ```

3. تشغيل الخادم المحلي:
   ```bash
   npm start
   # أو: node server.js
   ```

4. تصفح المتجر:
   افتح المتصفح على: `http://localhost:5005`

---

## 📜 الترخيص والحقوق | License & Rights

جميع الحقوق محفوظة © دار زهرة بيسان للتسوق والمتاجرة الإلكترونية | 2026.
مرخص ومسجل رسمياً لدى وزارة الصناعة والتجارة الأردنية.

## Dashboard (`/admin`)

Orders, products (hide, price, featured), offers, coupons, notify-me requests
and site settings. Set these in Vercel → Settings → Environment Variables:

| Variable | What it is |
|---|---|
| `ADMIN_PASSWORD` | The owner's dashboard password (required; the dashboard stays locked without it). The owner signs in as `admin` (or `ADMIN_USERNAME`), shown as `ADMIN_NAME`, and adds managers and employees on the Team page. |
| `ADMIN_GITHUB_TOKEN` | Fine-grained GitHub token for the data repo only, permission **Contents: Read and write**. Without it, changes are lost on every deploy. |
| `ANTHROPIC_API_KEY` | Optional. Turns on the dashboard's AI assistant (Claude Opus 5.5, billed to that key). Without it the assistant page explains what is missing. |
| `ADMIN_DATA_REPO` | Optional. The **private** repo that holds `admin-data.json` (default `Sultanaladawi/zahrat-beesan-data`). This store repo is public, so dashboard data (orders, coupon codes) is never saved here; a public data repo is refused. |

Locally the data is kept in `data/admin-state.json` (git-ignored).

## Fees on top of the supplier price

`finalJod = baseJod + feeJod` (base = supplier SAR ÷ 5.29, rounded). The fee rules live in `lib/fees.js` (server, sync and tools) and are mirrored in `public/js/app.js` (`getClientDeliveryFeeJod`):

| What | Fee (JOD) |
|---|---|
| one bottle (default) | 12 |
| several bottles in one product | 4 × bottles + 10 |
| small oils: tola, Al-Rehab dehn up to 20 ml | `SMALL_OIL_FEE_JOD` = 5 |
| **mini perfumes**: one small bottle ≤ 30 ml, titled ميني/mini, or in a house's own mini line | `MINI_FEE_JOD` = 5 |

To change the mini fee: edit `MINI_FEE_JOD` in `lib/fees.js` **and** in `public/js/app.js`, then run `node tools/recompute-fees.js` (the hourly sync runs it too, so new products get the right fee). Plain 31–50 ml perfumes are not minis. `node tools/recompute-fees.js --dry` lists what would change.

Mini perfumes also get their own "عطور ميني" section and filter chip on house pages (`isMiniPerfume` in `app.js`).

## Where a new product goes (sets, minis, oils, bakhoor…)

When the hourly sync (`tools/sync-check.js --import`) or the live Ghalati sync
meets a product we do not carry, `public/js/classify-product.js` decides what
it is and which section it belongs to (one file, used by the server, the
browser and the tools):

1. the supplier flags it as a bundle (`type: group_products`) → set, and its
   bottles are counted from the components (`sub_products`);
2. the SKU family `PKG-` / `DIS-` and the words of the title (مجموعة، بكج،
   باقة، ثنائية، ثلاثية، "3 حبات"، "3 × 25 مل"، سيت، "- تويست" …) → set;
3. oils / tolas, bakhoor, hair & body mists, perfumes named after a scent
   ("بخور وايلد كولت" is a spray); "من مجموعة X" is a product line, not a pack;
4. weak hints (the description lists what is inside, extras such as powder or
   lip gloss, the supplier category) only confirm.

A result with low confidence is never filed under perfumes: it goes to the
bundles section flagged `needsReview` and is listed in `tools/import-review.json`.

The owner's filing conventions are rules too (hair/body mists have their own
section only at Laverne and Deraah; a bakhoor-named spray is a perfume at Assaf
and Laverne; a PKG- code on a single travel bottle does not make a set; paste,
dokhoon and mabthooth are bakhoor even when the text mentions oil). Filings the
owner approved one by one are in `tools/class-overrides.json`: the classifier,
the importer and the audit never change or flag them.

Tools: `node tools/test-classifier.js` (table of real examples),
`node tools/sync-check.js --import --dry` (shows the decision and the reasons for
every new product, changes nothing), `node tools/audit-classes.js` (compares the
classifier with how the catalog files today's products; writes
`tools/class-audit.json`, changes nothing).
