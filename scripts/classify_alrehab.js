/**
 * Al-Rehab fine-grained classification.
 * Adds `subCategory` (+ Arabic/English label) to every product in alrehab_perfumes.json
 * and data/alrehab_master_archive.json without touching anything else.
 *
 *   node scripts/classify_alrehab.js
 *
 * Sub categories (order = display order on the storefront):
 *   perfume      عطور (60 مل فأكثر)
 *   mini         عطور ميني (25 – 50 مل)
 *   pens         كراتين الأقلام (8 مل × 48 حبة)
 *   bundle       باقات ومجموعات
 *   oil          زيوت عطرية رول (6 مل) / زيوت عطرية
 *   dehn         دهن وأدهان (دهن عود ودهن عطري)
 *   bakhoor      بخور ودخون
 *   maamoul      معمول
 *   airfreshener ملطفات جو
 *   roomspray    معطرات غرف ومنزل وفواحات
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = [
  path.join(ROOT, 'public', 'data', 'alrehab_perfumes.json'),
  path.join(ROOT, 'data', 'alrehab_master_archive.json')
];

const LABELS = {
  perfume:      { ar: 'العطور (60 – 125 مل)',            en: 'Perfumes (60–125 ml)' },
  mini:         { ar: 'عطور ميني (25 – 50 مل)',          en: 'Mini Perfumes (25–50 ml)' },
  pens:         { ar: 'كراتين عطور الأقلام (48 قلماً)',  en: 'Pen Perfume Cartons (48 pcs)' },
  bundle:       { ar: 'باقات ومجموعات الإهداء',          en: 'Gift Sets & Bundles' },
  oil:          { ar: 'الزيوت العطرية (رول)',            en: 'Perfume Oils (Roll-on)' },
  dehn:         { ar: 'الدهون ودهن العود',               en: 'Dehn & Oud Oils' },
  bakhoor:      { ar: 'البخور والدخون',                  en: 'Bakhoor & Incense' },
  maamoul:      { ar: 'المعمول',                         en: 'Maamoul' },
  airfreshener: { ar: 'ملطفات الجو',                     en: 'Air Fresheners' },
  roomspray:    { ar: 'معطرات الغرف والمنزل',            en: 'Room & Home Sprays' }
};

function mlOf(title) {
  const m = String(title).match(/(\d+(?:\.\d+)?)\s*(?:مل|ml)/i);
  return m ? Number(m[1]) : null;
}

function classify(p) {
  const t = String(p.title || '');

  if (p.categoryType === 'bundle') return 'bundle';
  if (/اقلام|أقلام/.test(t)) return 'pens';
  if (/^\s*ملطف/.test(t) || /ملطف\s*جو/.test(t)) return 'airfreshener';
  if (/^\s*معطر(?!\s*جسم)/.test(t) || /فواحة/.test(t)) return 'roomspray';
  if (/دهن|دهون/.test(t)) return 'dehn';
  if (/زيت\s*عطري/.test(t) || p.categoryType === 'oil') return 'oil';
  if (/معمول/.test(t)) return 'maamoul';
  if (p.categoryType === 'bakhoor' || /بخور|دخون|معجون|مبسوس|عود\s*(الديوان|الشيوخ)/.test(t)) return 'bakhoor';

  const ml = mlOf(t) ?? mlOf(p.specs && p.specs.size);
  if (ml !== null && ml <= 50) return 'mini';
  return 'perfume';
}

for (const file of FILES) {
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const counts = {};
  for (const p of data) {
    const sub = classify(p);
    p.subCategory = sub;
    p.subCategoryAr = LABELS[sub].ar;
    p.subCategoryEn = LABELS[sub].en;
    counts[sub] = (counts[sub] || 0) + 1;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log(path.relative(ROOT, file), counts);
}

module.exports = { classify, LABELS };
