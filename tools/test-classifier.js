#!/usr/bin/env node
/**
 * Table of real and tricky products for the shared classifier
 * (public/js/classify-product.js).   node tools/test-classifier.js
 * Exits 1 when a row disagrees, so it can run in CI.
 */
const { classifyProduct, placement } = require('../public/js/classify-product');

const P = (name, o = {}) => ({ name, sku: '', type: 'product', description: '', ...o });
const byId = new Map([
  ['1', P('عطر فرانكل 100 مل', { id: 1, description: 'عطر فرانكل بحجم 100 مل' })],
  ['2', P('عطر ريسك 100 مل', { id: 2, description: 'عطر ريسك بحجم 100 مل' })],
  ['3', P('ملمع شفاه', { id: 3, sku: 'LIPGS-1' })],
  ['4', P('عطر ميني 25 مل', { id: 4, description: '25 مل' })],
]);
const group = (name, ids, o = {}) => P(name, { type: 'group_products', is_bundle: true, sku: 'PKG-1-ON-1', sub_products: ids.map(i => ({ sub_product_id: i, sub_product_quantity: 1 })), ...o });

// Rows with a house follow the owner's filing conventions for that house.
const H = (house, label, item, type, count = null, conf = null) => [label, item, type, count, conf, house];

// [label, product, expected categoryType, expected bottleCount | null, expected confidence | null]
const ROWS = [
  ['supplier bundle of two full perfumes', group('مجموعة غيم', [1, 2]), 'bundle', 2, 'high'],
  ['supplier bundle: 2 perfumes + lip gloss', group('سحر المسك والأنوثة', [1, 2, 3]), 'bundle', 2, 'high'],
  ['supplier bundle of minis counts as one bottle', group('مجموعة السفر', [4, 4, 4]), 'bundle', 1, 'high'],
  ['single perfume', P('عطر وايلد كولت 200 مل', { sku: 'WCB-200-ON-1', description: 'عطر بحجم 200 مل' }), 'perfume', 1, 'high'],
  ['"من مجموعة X" is a product line, not a pack', P('جاسي من مجموعة توليفة 100مل', { description: 'عطر 100 مل' }), 'perfume', 1, 'high'],
  ['"&" inside one perfume name', P('Milk & Cookies Extrait De Parfum 100 ml', { description: 'Extrait de parfum' }), 'perfume', 1, 'high'],
  ['pack word + PKG code, minis', P('مجموعة اروقيت 25 مل - كوميت · ميس · خطير', { sku: 'PKG-3X25-ON-1' }), 'bundle', 1, null],
  ['3-pack written "- 3 حبات"', P('عطر إيلارا 50 مل - 3 حبات'), 'bundle', 3, null],
  ['two named perfumes joined with و, PKG code', P('جنتل وبلو لافيرن بخور', { sku: 'PKG-LP1-ON-1', description: 'مجموعة' }), 'bundle', 2, null],
  ['twist & spray set', P('مس لافيرن قاردن - تويست', { sku: 'MLG-TW-SF-0126' }), 'bundle', null, null],
  ['"set" written in Arabic letters', P('سن سيت اند يو', { sku: 'PKG-LP1-ON-1' }), 'bundle', null, null],
  ['perfume sold with body powder (PWD SKU)', P('قاردن باودر اويسيس', { sku: 'PWD-50-00004', description: 'عطر مع بودرة الجسم' }), 'bundle', null, null],
  ['named after a scent but a spray in ml', P('بخور وايلد كولت', { sku: 'WCB-150-ON-35000', description: 'بخور وايلد كولت — 150 مل عطر' }), 'perfume', 1, 'high'],
  ['bakhoor by weight', P('مبثوث دهن عود بخور 25 جرام', { description: '25 جرام' }), 'bakhoor', 1, null],
  ['home freshener', P('معطر المفارش هوم 500 مل', { description: 'معطر مفارش 500 مل' }), 'bakhoor', 1, null],
  ['tola oil', P('تولة غالية 15 مل'), 'oil', 1, null],
  ['body mist', P('بلانكا - رذاذ للجسم', { description: 'رذاذ 75 مل' }), 'hair_mist', 1, null],
  ['hair perfume', P('عطر الشعر لا مدام 50 مل'), 'hair_mist', 1, null],
  ['pack words but a bakhoor product is low confidence', P('باكج بخور الصباح', { sku: 'PKG-LP1-ON-1' }), 'bundle', null, null],
  H('alrehab', 'Al-Rehab "عطر الشعر" stays a perfume', P('عطر الشعر لا مدام 50 مل'), 'perfume', 1, null),
  H('rasasi', 'Rasasi body & hair mist stays a perfume', P('سمو الرصاصي رينا معطر للجسم والشعر 100 مل'), 'perfume', 1, null),
  H('laverne', 'Laverne body mist is a hair_mist', P('بلانكا - رذاذ للجسم', { description: 'رذاذ 75 مل' }), 'hair_mist', 1, null),
  H('laverne', 'Laverne "عطر للشعر" is a hair_mist', P('سينس فور إيفر عطر للشعر — 75 مل'), 'hair_mist', 1, null),
  H('laverne', 'Laverne bakhoor-named spray is a perfume', P('لادور بخور كلاسيك 10 مل', { sku: 'LDB-10-SF-1' }), 'perfume', 1, null),
  H('rasasi', 'Rasasi "بخور" in ml stays bakhoor', P('بخور انسجام 100 مل', { description: 'بخور 100 مل' }), 'bakhoor', 1, null),
  H('laverne', 'Laverne PKG code on a single travel bottle stays a perfume', P('مسك قاردن لحقيبتك', { sku: 'PKG-LP492-ON-1' }), 'perfume', 1, null),
  H('rasasi', 'a spray with oud oil in its name (30 ml) is a perfume', P('دهن عود الكمبودي بخاخ 30مل'), 'perfume', 1, null),
  H('rasasi', 'a concentrated perfume is a perfume', P('عطر العود عطر مركز 20مل'), 'perfume', 1, null),
  H('oudelite', 'oud paste is bakhoor even if the text says oil', P('معجون فاخر', { description: 'معجون عود بدهن' }), 'bakhoor', 1, null),
  H('oudelite', 'burner in a gift bag stays bakhoor', P('شنطة مبخرة صغيرة وولاعة', { category: { name: 'الهدايا والإكسسوارات' } }), 'bakhoor', 1, null),
  H('oudelite', 'item in the gifts & accessories category is a set', P('اورينت ستيل اسود', { category: { name: 'الهدايا والإكسسوارات' } }), 'bundle', null, null),
];

let bad = 0;
for (const [label, item, type, count, conf, house] of ROWS) {
  const r = classifyProduct(item, { byId, house });
  const problems = [];
  if (r.categoryType !== type) problems.push(`type ${r.categoryType}, expected ${type}`);
  if (count != null && r.bottleCount !== count) problems.push(`bottles ${r.bottleCount}, expected ${count}`);
  if (conf && r.confidence !== conf) problems.push(`confidence ${r.confidence}, expected ${conf}`);
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${label}${problems.length ? ' - ' + problems.join('; ') + '\n       ' + r.reasons.join('; ') : ''}`);
  if (problems.length) bad++;
}

// A low-confidence guess never lands in the perfumes section.
const weak = classifyProduct(P('الحديقة الكبرى - لهُ', { sku: 'DISHM-1-ON-1' }), { byId });
const place = placement('assaf', weak);
const gate = weak.confidence === 'low' && place.categoryType === 'bundle' && place.needsReview;
console.log(`${gate ? 'ok  ' : 'FAIL'} low confidence is filed as a flagged bundle (${weak.confidence} -> ${place.categoryType}, needsReview ${place.needsReview})`);
if (!gate) bad++;
const lav = placement('laverne', classifyProduct(group('تركواز وحديقة الاختيارات', [1, 2, 3]), { byId }));
const lavOk = lav.categoryType === 'bundle' && lav.subCategory === 'gift_set';
console.log(`${lavOk ? 'ok  ' : 'FAIL'} Laverne set with 3 items goes to gift_set (${lav.subCategory})`);
if (!lavOk) bad++;

console.log(bad ? `\n${bad} failing` : '\nall good');
process.exit(bad ? 1 : 0);
