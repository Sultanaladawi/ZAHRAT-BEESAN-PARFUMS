/**
 * What is this supplier product, really?  One classifier for the importer
 * (tools/salla-catalog.js) and for audits (tools/audit-classes.js).
 *
 *   classifyProduct(item, { byId, categoryNames, house })
 *     item          a product as the Salla storefront API returns it
 *     byId          Map(id -> item) of the store's other products, so a set's
 *                   components can be looked up (sub_products)
 *     categoryNames the supplier categories the product is listed in (optional)
 *   returns { categoryType, kind, bottleCount, confidence, reasons[] }
 *
 *   categoryType  perfume | bundle | oil | bakhoor | hair_mist
 *   kind          the finer picture: perfume, mini, set, gift_set, oil, bakhoor,
 *                 hair_mist, unknown
 *   confidence    'high' | 'medium' | 'low'.  Low never goes to the perfumes
 *                 section by itself: the importer files it as a flagged bundle
 *                 and lists it in tools/import-review.json.
 *
 * Signals, strongest first:
 *   1. the supplier says it is a bundle (type "group_products", is_bundle)
 *   2. SKU family PKG-/DIS- (the suppliers' package codes)
 *   3. words in the title (Arabic and English) that name a pack
 *   4. the description lists several perfumes / sizes / extras
 *   5. the supplier categories it sits in (gift boxes, collections, duos)
 *   6. several distinct perfume sizes or "3 × 25 مل" in the title
 * A product line ("من مجموعة توليفة") or a single perfume whose name has "&"
 * ("Milk & Cookies") is not a pack.
 */
(function () {
'use strict';

const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const norm = t => String(t || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();

// Words that name a pack in a title.
const PACK_TITLE = /(?<![ء-ي])(مجموع[هة]|محموع[هة]|مجموعات|كولكشن|كوليكشن|بكج|باكج|باقه|باقة|بوكس|بوكسات|صندوق|طقم|ثنائيه|ثنائية|ثلاثيه|ثلاثية|رباعيه|رباعية|خماسيه|خماسية|تشكيله|تشكيلة|توزيعات|عروض|عرض|هديه|هدية|هدايا|ديسكفري|استكشاف|الاستكشاف|سيت)(?![ء-ي])|\b(set|collection|duo|trio|bundle|box|gift|discovery|pack)\b/i;
// A gift bag / bag set that holds perfumes (Oud Elite's "شنطة ...").
const BAG_SET = /(?<![ء-ي])(شنط[هة]|حقيب[هة])(?![ء-ي])/;
// "من مجموعة X" / "of the X collection" names the product line of one bottle.
const LINE_PHRASE = /من\s+مجموع[هة]\s+\S+|\bfrom\s+the\s+.*\bcollection\b|\bcollection\s+\S+\s+\d+\s*ml\b/i;
const SIZE_TIMES = /\d+\s*[×xX*]\s*\d+\s*(?:مل|ml)|(?:مل|ml)\s*[×xX]\s*\d+|(?<![\d٠-٩])[2-9٢-٩]\s*(?:عطور|عطرين|زجاجات|قطع|حبات|حبة)(?![ء-ي])|\d{2,3}\s*حبة/i;
const TWIST = /-\s*(?:تويست|twist)\s*(?:&\s*spray)?\s*$/i;
// "لحقيبتك" means "for your bag" (travel size), not a bag in the box.
const EXTRAS = /(?<!ل)(?<![ء-ي])(?:حقيب(?!تك)|شنط(?!تك))|بودر|باودر|ملمع|محدد|ماسكر|كحل|قلم|نظار|ساع[هة]|شمع|فرش|مرآه|مراه|منشف|وشاح|\b(?:bag|powder|lip|mascara|sunglass|watch|candle)\b/i;
const SET_DESC = /(تتضمن|تحتوي|يحتوي|تتكون|تتألف|تضم|يضم|تشمل|يشمل|تجمع)\s+(?:ال)?(?:مجموعه|مجموعة|باقة|بوكس|صندوق|علبه|علبة)?[^.]{0,40}(عطر|عطور|زجاج|قطع|مل)|\b(includes|contains|consists of|comes with)\b/i;
const SET_CATEGORY = /مجموع|بوكسات|هدايا|هديه|الاهداء|الإهداء|ثنائيات|ثنائيه|استكشاف|الاستكشاف|توزيعات|كولكشن|تويست|collection|gift|duo|bundle|box|twist/i;
const OIL = /تول[هة]|زيت\s*عطري|دهن\s*(?:ال)?عود|دهن\s*عود|بودي\s*(?:اويل|زيت)|اويل|\boil\b|attar|دهن/i;
const BAKHOOR = /بخور|معمول|دخون|مبثوث|مبسوس|مغموس|معجون|لبان|مبخر[هة]|عود\s*(?:معطر|بخور)|bakhoor|bakhur|incense|burner|معطر\s*(?:لل|ال|ل)?(?:جو|منزل|غرف|بيت|سيار|مفارش)|فواح[هة]|ملطف|دفيوزر|ديفيوزر|diffuser|air\s*freshener|room\s*spray/i;
// A bakhoor-named product that is really a spray (EDP) - "بخور وايلد كولت 150 مل".
// The owner's filing conventions by house (not what the words alone would say):
//  - hair & body mists have their own section only at Laverne and Deraah; elsewhere
//    ("عطر الشعر لا مدام" at Al-Rehab, "معطر للجسم والشعر" at Rasasi) they stay perfumes;
//  - a bakhoor-named SPRAY ("بخور وايلد كولت", "لادور بخور كلاسيك") is a perfume at
//    Assaf and Laverne; at the other houses a "بخور" product is bakhoor.
const HAIR_SECTION_HOUSES = ['laverne', 'deraah'];
const SCENT_NAMED_HOUSES = ['assaf', 'laverne'];
// Strong bakhoor words in the NAME: these beat an oil hint from the description.
const BAKHOOR_NAME = /معجون|دخون|مبثوث|معمول|مبخر[هة]|مغموس|مبسوس/;
const SPRAY = /بخاخ|عطر|eau\s*de|parfum|edp|spray/i;
const HOME = /معطر\s*(?:لل|ال|ل)?(?:جو|منزل|غرف|بيت|سيار|مفارش)|فواح[هة]|ملطف|دفيوزر|ديفيوزر|diffuser|air\s*freshener|room\s*spray|مبخر[هة]|معجون|معمول|مبثوث|دخون|burner/i;
const HAIR = /عطر\s*(?:لل|ال|ل)?\s*شعر|معطر\s*(?:لل|ال|ل)?\s*شعر|هير\s*مست|hair\s*mist|hair\s*perfume/i;
const BODY = /رذاذ\s*(?:لل|ال|ل)?\s*جسم|معطر\s*(?:ال)?جسم|عطر\s*(?:لل|ال)?جسم|بودي\s*(?:مست|سبراي)|body\s*(?:mist|spray)/i;

const sizesOf = t => [...String(t).matchAll(/(?<![\d٠-٩.])(\d{1,4})\s*(?:مل|ml)(?![؀-ۿA-Za-z])/gi)].map(m => Number(m[1])).filter(n => n >= 3);

// The suppliers put the size in the SKU too: WCB-150-ON-35000, BLB-100-SF-8600.
const skuSize = sku => { const m = String(sku || '').match(/^[A-Za-z]{2,6}-(\d{2,4})-(?:[A-Za-z]{2}-)?\d+$/); return m ? Number(m[1]) : null; };

function hasLine(t) { return LINE_PHRASE.test(t); }

/**
 * Perfumes in the pack, counted the way the store prices it (lib/fees.js):
 * full-size bottles count one each; a pack made only of minis counts as one.
 */
function countBottles(components, textual) {
  if (components && components.length) {
    let full = 0, mini = 0, other = 0;
    for (const c of components) {
      const qty = Math.max(1, Number(c.qty) || 1);
      if (c.kind === 'extra') { other += qty; continue; }
      if (c.kind === 'mini') mini += qty; else full += qty;
    }
    if (full) return full;
    if (mini) return 1;
    return Math.max(1, Math.min(other, 1));
  }
  return textual;
}

const WORD_COUNT = [[/ثمانيه\s*عطور|8\s*عطور/, 8], [/سبع[هة]?\s*عطور|7\s*عطور/, 7], [/ست[هة]?\s*عطور|6\s*عطور/, 6],
  [/خمس[هة]?\s*عطور|5\s*عطور|خماسي/, 5], [/اربع[هة]?\s*عطور|4\s*عطور|رباعي/, 4], [/ثلاث[هة]?\s*عطور|3\s*عطور|ثلاثي/, 3],
  [/عطرين|عطران|ثنائي|لك ولها|قطعتين|2\s*عطور|عطر\s*و\s*عطر/, 2]];

// Counted from the words when the pack's components are not known: the title
// first ("3 حبات", "2 × 100 مل", "ثلاثية", two perfume names joined by و/+),
// then the description.
function textualCount(title, desc = '', pkg = false) {
  const t = norm(title);
  const times = t.match(/(?<![\d٠-٩])([2-9])\s*[×xX*]\s*\d+\s*(?:مل|ml)/);
  if (times) return Number(times[1]);
  const pieces = t.match(/(?<![\d٠-٩])([2-9])\s*(?:حبات|حبه|حبة|زجاجات|عطور)/);
  if (pieces) return Number(pieces[1]);
  for (const [re, n] of WORD_COUNT) if (re.test(t)) return n;
  if (/\s\+\s|\s&\s/.test(title) || /\S\s+و\S+\s+\S/.test(title) && (pkg || /مجموع|باكج|بكج|عرض|ثنائ/.test(t))) return 2;
  // A description that counts bottles is only trusted when it is not about minis
  // ("5 عطور ميني" in a mini garden set is one bottle's worth in the store's rule).
  const d = norm(desc.slice(0, 300));
  const small = sizesOf(desc.slice(0, 300)).some(n => n <= 30) || /ميني|mini/.test(d);
  if (!small) for (const [re, n] of WORD_COUNT) if (re.test(d)) return n;
  return 1;
}

/** Component descriptor for one sub-product of a set. */
function describeComponent(sub, byId) {
  const id = String(sub.sub_product_id || sub.id);
  const it = byId && byId.get(id);
  const qty = sub.sub_product_quantity || sub.quantity || 1;
  if (!it) return { id, qty, kind: 'unknown' };
  const name = norm(it.name);
  const sizes = sizesOf(`${it.name} ${strip(it.description).slice(0, 200)}`);
  if (EXTRAS.test(name) && !/عطر|perfume/.test(name)) return { id, qty, kind: 'extra', name: it.name };
  if (/^(BG-|BGS|LIP|MPC|SNG|WT-|SCRF|SRF)/i.test(it.sku || '')) return { id, qty, kind: 'extra', name: it.name };
  const small = sizes.length && sizes.every(n => n <= 30);
  return { id, qty, kind: small ? 'mini' : 'perfume', name: it.name };
}

function classifyProduct(item, ctx = {}) {
  const reasons = [];
  const name = String(item.name || '').trim();
  const desc = strip(item.description);
  const nName = norm(name);
  const nDesc = norm(desc);
  const sku = String(item.sku || '');
  const cats = [].concat(ctx.categoryNames || [], item.category && item.category.name ? [item.category.name] : []);
  const titleAndDesc = `${nName} ${nDesc.slice(0, 400)}`;
  const titleNoLine = name.replace(LINE_PHRASE, ' ');
  const nTitleNoLine = norm(titleNoLine);
  const skuMl = skuSize(sku);
  const titleSizes = sizesOf(name).concat(!sizesOf(name).length && skuMl ? [skuMl] : []);
  const descSizes = sizesOf(desc.slice(0, 300));

  // ── pack evidence: strong signals decide, weak ones only confirm ──
  let strong = 0, weak = 0;
  const isGroup = item.type === 'group_products' || item.is_bundle === true;
  const pkgSku = /^(PKG|DIS)/i.test(sku);
  if (isGroup) { strong += 10; reasons.push('the supplier lists it as a bundle (group of products)'); }
  // A PKG- code on a product that reads as a single bottle ("مسك قاردن لحقيبتك",
  // "ديكلير 50") does not make it a pack unless something else says so.
  const singleLooking = /لحقيبتك|لحقيبتكِ/.test(name) || (sizesOf(name).length === 1 && sizesOf(name)[0] >= 10) || /^\S+\s+\d{2,3}$/.test(name.trim());
  const readsSingle = /^PKG/i.test(sku) && singleLooking && !isGroup && !PACK_TITLE.test(nTitleNoLine) && !TWIST.test(name)
    && !/\s\+\s/.test(name) && !/\S\s+و\S+\s+\S/.test(name) && !SIZE_TIMES.test(`${name} ${desc.slice(0, 160)}`)
    && !/مجموع[هة]|(?:ثلاث|اربع|خمس|ست)[هة]?\s*(?:عطور|روائح)|\d\s*عطور/.test(nDesc.slice(0, 300));
  if (pkgSku && !readsSingle) { strong += 3; reasons.push(`SKU ${sku.split('-')[0]}- is a package code`); }
  else if (pkgSku) reasons.push(`SKU ${sku.split('-')[0]}- is a package code, but the product reads as a single bottle`);
  if (PACK_TITLE.test(nTitleNoLine)) { strong += 4; reasons.push('title names a pack'); }
  if (TWIST.test(name)) { strong += 4; reasons.push('"- تويست": a twist-and-spray set'); }
  if (/^PWD/i.test(sku)) { strong += 3; reasons.push('SKU PWD-: perfume with body powder'); }
  const giftCat = cats.some(c => /هدايا|اكسسوار|الاهداء|gift/.test(norm(c)));
  if (BAG_SET.test(nName) && giftCat && !/مبخر[هة]/.test(nName)) { strong += 4; reasons.push('gift bag in the gifts category'); }
  else if (giftCat && !/مبخر[هة]/.test(nName) && cats.some(c => /هدايا\s*و\s*الاكسسوار|الهدايا\s*والإكسسوارات/.test(c.replace(/\s+/g, ' ')))) { strong += 4; reasons.push('listed in the gifts & accessories category'); }
  if (SIZE_TIMES.test(`${name} ${desc.slice(0, 160)}`)) { strong += /(?<![\d٠-٩])[2-9٢-٩]\s*(?:حبات|حبة)|\d{2,3}\s*حبة/.test(name) ? 4 : 3; reasons.push('a count in the text ("3 × 25 مل", "3 حبات")'); }
  if (new Set(titleSizes).size >= 2) { strong += 3; reasons.push(`several sizes in the title (${[...new Set(titleSizes)].join('/')})`); }
  if (/\s\+\s/.test(name)) { strong += 2; reasons.push('title joins items with +'); }
  else if (/\s&\s/.test(name)) { weak += 1; reasons.push('title has "&" (may be one perfume name, e.g. Milk & Cookies)'); }
  if (SET_DESC.test(nDesc.slice(0, 500))) { weak += 1; reasons.push('the description says what is inside'); }
  if (EXTRAS.test(nName)) { weak += 1; reasons.push('title names extras (powder, lip, …)'); }
  const setCat = cats.find(c => SET_CATEGORY.test(norm(c)));
  if (setCat) { weak += 1; reasons.push(`supplier category: ${setCat}`); }
  weak = Math.min(weak, 2);
  const lineOnly = LINE_PHRASE.test(name);
  if (lineOnly && !isGroup && !pkgSku) { strong = Math.max(0, strong - 3); reasons.push('"من مجموعة X" is a product line, not a pack'); }
  if (!pkgSku && !isGroup && titleSizes.length === 1 && titleSizes[0] >= 30 && !PACK_TITLE.test(nTitleNoLine)) { weak = 0; reasons.push('one size in the title, no pack word'); }

  // ── what a single product is ──
  const house = String(ctx.house || '');
  let kind = 'perfume';
  let namedAfterScent = false;
  const gramSize = /(?<![\d٠-٩])\d+\s*(?:جرام|غرام|جم|g|قرص|اقراص|قطعه|قطعة)(?![ء-يA-Za-z])/i.test(`${name} ${desc.slice(0, 120)}`);
  const mlSizes = titleSizes.concat(descSizes);
  const minMl = mlSizes.length ? Math.min(...mlSizes) : null;
  if (BODY.test(nName) || HAIR.test(nName)) {
    if (HAIR_SECTION_HOUSES.includes(house) || !house) kind = 'hair_mist';
    else reasons.push('hair/body mist, filed with the perfumes at this house');
  }
  if (kind === 'perfume' && BAKHOOR.test(nName) && !HOME.test(nName) && !gramSize && !BAKHOOR_NAME.test(nName) && (SCENT_NAMED_HOUSES.includes(house) || !house && mlSizes.some(n => n >= 75))) {
    kind = 'perfume'; namedAfterScent = true; reasons.push('named after a scent (bakhoor/oud) but sold as a spray in ml');
  } else if (kind === 'perfume' && gramSize && (BAKHOOR.test(nName) || !titleSizes.length)) kind = 'bakhoor';
  else if (kind === 'perfume' && BAKHOOR_NAME.test(nName) && !OIL.test(nName)) kind = 'bakhoor';
  else if (kind === 'perfume') {
    // Oil words: in the name (a spray with oil in its name, 30 ml or more, stays a perfume),
    // in the description, or the supplier category (tolas / oils up to 20 ml).
    const spray = /بخاخ|spray|عطر\s*مركز/.test(nName);
    const withOil = /مع\s*دهن|بدهن|\bwith\s+oil/.test(nName); // the oil is an ingredient of a perfume
    const oilName = OIL.test(nName) && !spray && !withOil;
    const oilDesc = OIL.test(nDesc.slice(0, 120)) && !spray && !withOil && !/بخاخ|spray/.test(nDesc.slice(0, 120));
    const oilCat = cats.some(c => /تول|زيوت|دهن/.test(norm(c))) && !spray && (minMl === null || minMl <= 20);
    if (oilName || oilDesc || oilCat) kind = 'oil';
    else if (titleSizes.length === 1 && titleSizes[0] <= 8 && !/ميني|mini/.test(nName)) kind = 'oil';
    else if (/مخلط/.test(nName) && !spray && minMl !== null && minMl <= 30) kind = 'oil';
    else if (BAKHOOR.test(nName) && !(/لبان/.test(nName) && !/بخور|معمول|دخون|مبثوث|مبخر|معجون/.test(nName) && minMl !== null && minMl >= 75)) kind = 'bakhoor';
  }

  // ── decide ──
  let categoryType, confidence, bottleCount = 1, components = null;
  const total = strong + weak;
  if (isGroup || total >= 7) {
    categoryType = 'bundle'; kind = 'set'; confidence = 'high';
  } else if (total >= 4 && strong >= 3) {
    categoryType = 'bundle'; kind = 'set';
    confidence = strong >= 4 && (kind === 'set') && !pkgSku ? 'high' : (pkgSku && strong === 3 && weak === 0 ? 'low' : 'medium');
    if (pkgSku && strong === 3 && weak === 0) reasons.push('package code only, nothing else says it is a pack');
  } else if (total >= 3) {
    categoryType = 'bundle'; kind = 'set'; confidence = 'low';
    reasons.push(`weak pack signals (${strong}+${weak})`);
  } else {
    categoryType = kind; confidence = 'high';
    if (kind === 'perfume') {
      const sizes = titleSizes.length ? titleSizes : descSizes;
      if (sizes.length && sizes.every(n => n <= 30)) kind = 'mini';
      if (!sizes.length && !/عطر|perfume|eau|parfum|edp|edt/i.test(titleAndDesc)) { confidence = 'medium'; reasons.push('no size and no perfume word'); }
    }
    if (total === 2 && kind === 'perfume') { confidence = 'low'; reasons.push(`some pack signals (${strong}+${weak})`); }
  }

  if (categoryType === 'bundle') {
    const subs = Array.isArray(item.sub_products) ? item.sub_products : [];
    if (subs.length) {
      components = subs.map(sp => describeComponent(sp, ctx.byId));
      const known = components.filter(c => c.kind !== 'unknown');
      bottleCount = known.length === components.length
        ? countBottles(components, 1)
        : Math.max(countBottles(known, 1), textualCount(name, desc, pkgSku));
      reasons.push(`components: ${components.map(c => `${c.qty}× ${c.kind}${c.name ? ` (${c.name})` : ''}`).join(', ')}`);
    } else {
      const sizes = titleSizes.length ? titleSizes : descSizes;
      const minis = (sizes.length && sizes.every(n => n <= 30)) || /ميني|ديسكفري|عينات|مجموعه السفر|discovery|sample/.test(titleAndDesc);
      bottleCount = minis ? 1 : textualCount(name, desc, pkgSku);
    }
  }
  if (bottleCount < 1) bottleCount = 1;
  // Laverne files sets as gift_set (box, 3+ items, extras) or bundle (a pair).
  let subCategory;
  if (categoryType === 'bundle') {
    const extras = components ? components.some(c => c.kind === 'extra') : EXTRAS.test(nName);
    const n = components ? components.length : bottleCount;
    subCategory = (n >= 3 || extras || pkgSku && /صندوق|بوكس|هدا|box|gift|discovery|استكشاف/.test(titleAndDesc)) ? 'gift_set' : 'bundle';
  }
  return { categoryType, kind, bottleCount, confidence, reasons, score: strong + weak, namedAfterScent, subCategory, components };
}

/**
 * Where a classified product goes in the catalog.
 *   categoryType / subCategory / bottleCount / namedAfterScent / needsReview
 * A low-confidence product never goes to the perfumes section on its own: it
 * is filed as a bundle and flagged needsReview (the importer also lists it in
 * tools/import-review.json), so the owner sees it before it sits among perfumes.
 */
function placement(house, cls) {
  const out = { categoryType: cls.categoryType, bottleCount: cls.bottleCount, needsReview: false, namedAfterScent: !!cls.namedAfterScent };
  if (cls.confidence === 'low' && cls.categoryType === 'perfume') {
    out.categoryType = 'bundle';
    out.needsReview = true;
  } else if (cls.confidence === 'low') {
    out.needsReview = true;
  }
  if (house === 'laverne') {
    if (out.categoryType === 'bundle') out.subCategory = cls.subCategory || 'bundle';
    else if (cls.kind === 'mini') { out.categoryType = 'mini'; out.subCategory = 'mini'; }
    else out.subCategory = out.categoryType;
  }
  return out;
}

const api = { classifyProduct, placement, sizesOf, norm, strip };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else if (typeof window !== 'undefined') window.ProductClassifier = api;
})();
