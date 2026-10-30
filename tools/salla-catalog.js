/**
 * Everything the Salla suppliers sell, and the part of it we carry.
 *
 * - enumerate(): every product the storefront API shows for a store (the plain
 *   listing, plus every category when `exhaustive` is set), sold out ones too.
 * - classify(): is a product in the fragrance scope of the store?
 *     'in'     perfumes, oils, minis, perfume sets, bakhoor, burners, mists
 *     'out'    clothes, shoes, watches, sunglasses, bags, make-up, body care
 *     'unsure' anything we cannot tell (goes to the discover report)
 * - buildRecord(): a catalog entry in the same shape as the earlier imports.
 * - importMissing(): adds the in-scope products we do not have yet.
 *
 * Used by tools/sync-check.js (--import) on the hourly run.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data');
const IMAGES = path.join(ROOT, 'public', 'images');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SAR_PER_JOD = 5.29;

const HOUSES = {
  assaf: {
    file: 'assaf_perfumes.json', storeId: '935113581', origin: 'https://3saf.com', prefix: 'assaf',
    brand: 'عطور عساف (Assaf)', perfumer: 'دار عطور عساف (Assaf Perfumes)', perfumerEn: 'House of Assaf', key: 'id',
  },
  laverne: {
    file: 'laverne_perfumes.json', storeId: '504871843', origin: 'https://laverne.com', prefix: 'laverne',
    brand: 'عطور لافيرن (Laverne)', perfumer: 'دار لافيرن للعطور (Laverne Perfumes)', perfumerEn: 'House of Laverne', key: 'slug',
  },
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const slugOf = url => String(url || '').replace(/[?#].*$/, '').split('/').filter(Boolean).pop() || '';
const amount = v => Number(typeof v === 'object' && v ? v.amount : v);
const text = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const headers = (cfg, lang = 'ar') => ({
  Origin: cfg.origin, Referer: `${cfg.origin}/`, 'User-Agent': UA,
  'Store-Identifier': cfg.storeId, Accept: 'application/json', 'Accept-Language': lang,
});

async function getJson(url, h) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: h });
    if (res.status === 429) { await sleep(2000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('rate limited');
}

// All products of one listing; follows the API's "next" link (moved back to
// api.salla.dev) until a page brings nothing new.
async function listing(cfg, query, into = new Map()) {
  let url = `https://api.salla.dev/store/v1/products${query ? `?${query}` : ''}`;
  for (let page = 1; url && page <= 400; page++) {
    const json = await getJson(url, headers(cfg));
    const before = into.size;
    for (const it of json.data || []) into.set(String(it.id), it);
    if (into.size === before) break;
    const next = json.cursor && json.cursor.next;
    if (!next) break;
    const u = new URL(next);
    u.protocol = 'https:';
    u.hostname = 'api.salla.dev';
    url = u.toString();
  }
  return into;
}

const flatten = (cats, out = []) => {
  for (const c of cats || []) { out.push(c); flatten(c.sub_categories || c.children, out); }
  return out;
};

/**
 * Every product the store shows. `exhaustive` also reads each category (and
 * sub-category) listing, in case a product is only reachable from there.
 * Returns { items: Map(id -> item), extra: [ids found only by the extra passes] }.
 */
async function enumerate(cfg, { exhaustive = false } = {}) {
  const items = await listing(cfg, '');
  const extra = [];
  if (exhaustive) {
    const cats = flatten((await getJson('https://api.salla.dev/store/v1/categories', headers(cfg))).data)
      .filter(c => c.id && !['offers', 'blog'].includes(c.id));
    for (const c of cats) {
      let part;
      try { part = await listing(cfg, `source=categories&source_value[]=${c.id}`); } catch (e) { continue; } // a category the API refuses
      for (const [id, it] of part) if (!items.has(id)) { items.set(id, it); extra.push(id); }
    }
  }
  return { items, extra };
}

// ── Scope ──────────────────────────────────────────────────────────────

// SKU families that are never fragrance: make-up, bags, refills, scarves, body care.
const OUT_SKU = /^(DRS|WT-|SNG|SCRF|SRF|BG-|BGS|BTY|LIPGS|LIPNR|GB-RFL|TSR|PNTM-350|LDSG|BLV-350|HC-|MPCHC|LRSHC|IWHHC|BLHC|PTO|PMG|SNS-PDR|PKG-BG|PKG-WSG|PKG-SNWT|PKG-LD[A-Z]{1,3}-O)/i;
const OUT_NAME = /شمعة|شموع|candle|ساعة|ساعات|نظار|فستان|احذية|أحذية|حذاء|مولود|أطفال|اطفال|قميص|بولو|سالوبيت|شنطة|حقيبة|حقائب|سكارف|وشاح|محفظة|قلم|مسكرا|ماسكرا|كحل|حواجب|ملمع|قلوس|ليب|جل للإستحمام|جل للاستحمام|العناية باليدين|مستحضر|عبوة إعادة|إعادة التعبئة|باودر\s*—|dress|watch|sunglass|bag\b|shoe|lip/i;
const PERFUME_SIGNAL = /عطر|عطور|بخور|دهن|perfume|eau de|parfum|مبخرة|معطر|بخاخ/i;

// Millilitre sizes that belong to a perfume (not a lip-gloss shade like "07 مل").
function perfumeSizes(desc) {
  return [...desc.matchAll(/(?<![\d٠-٩])(\d{1,4})\s*(?:مل|ml)(?![\u0600-\u06FFA-Za-z])/gi)].map(m => Number(m[1])).filter(n => n >= 10);
}

function classify(it) {
  const name = String(it.name || '');
  const sku = String(it.sku || '');
  const desc = text(it.description);
  if (OUT_SKU.test(sku) && !/PKG-LP|PKG-ASFP/i.test(sku)) return { scope: 'out', why: `sku ${sku}` };
  const sizes = perfumeSizes(`${name} ${desc}`);
  const beauty = /قلوس|قلم|مسكرا|ماسكرا|كحل|حواجب|ملمع|شفاه|ليب|رموش|إطلالة|اطلالة/i.test(`${name} ${desc}`);
  const isSet = /^(PKG|DIS)/i.test(sku) || /مجموعة|ثلاثية|ثنائية|عطور|باقة|بكج|صندوق|تشكيلة|collection|set/i.test(name);
  if (OUT_NAME.test(name) && !sizes.length) return { scope: 'out', why: `name ${name}` };
  if (/^PKG-ASFP/i.test(sku)) {
    // "24 ساعة" in an offer text is hours, not a watch.
    const noHours = `${name} ${desc}`.replace(/(لمدة|خلال|ال)?\s*[\d٠-٩]+\s*(?:ساعة|ساعات)/g, ' ');
    return /عطر|مل/.test(desc) && !/ساعة|نظارة|watch/i.test(noHours) ? { scope: 'in', why: 'perfume collection' } : { scope: 'unsure', why: 'collection with a watch, glasses or no perfume text' };
  }
  if (isSet && beauty && !sizes.length) {
    return PERFUME_SIGNAL.test(desc) && /تجمع المجموعة بين عطر|عطر\s+\S+\s+(?:بطابعه|بحجم)/.test(desc)
      ? { scope: 'in', why: 'perfume with make-up, no size' } : { scope: 'out', why: 'make-up set' };
  }
  if (isSet && beauty && sizes.length && sizes.every(n => n < 30) && !/عطر\s*\S*\s*(?:بحجم|\d)/.test(desc)) {
    return { scope: 'unsure', why: 'make-up set with small sizes' };
  }
  if (sizes.length || PERFUME_SIGNAL.test(`${name} ${desc}`) || /^(PKG|DIS|ATH|PRF)/i.test(sku)) {
    return { scope: 'in', why: sizes.length ? `sizes ${sizes.join(',')}` : 'perfume text' };
  }
  return { scope: 'unsure', why: 'no perfume evidence' };
}

// ── Records ────────────────────────────────────────────────────────────

function detectCategoryType(name = '', desc = '', sku = '') {
  const t = `${name} ${desc}`;
  if (/^(PKG|DIS)/i.test(sku)) return 'bundle';
  if (/باقة|مجموعة|بكج|صندوق|عرض|ثلاثية|ثنائية|تشكيلة|طقم/i.test(name) && !/من مجموعة/i.test(name)) return 'bundle';
  if (/تولة|زيت عطري|دهن عود|دهن العود|\b6\s*مل|\b3\s*مل/i.test(t) && !/بخاخ/i.test(t)) return 'oil';
  if (/بخور|معمول|معطر جو|معطر للمنزل|معطر الغرف|عود معطر|دخون|مبثوث|مبسوس|مغموس|لبان|مبخرة/i.test(name)) return 'bakhoor';
  if (/عطر الشعر|عطر شعر|هير|hair/i.test(name)) return 'hair_mist';
  return 'perfume';
}

// Same rule as server.js inferBottleCount: packs of mini sizes count as one bottle.
function inferBottleCount(name = '', desc = '', catType = 'perfume') {
  if (catType !== 'bundle') return 1;
  const t = `${name} ${desc}`;
  if (/15\s*مل|25\s*مل|30\s*مل|10\s*مل|ميني|ديسكفري|عينات|مجموعة السفر|2\s*مل/i.test(t)) return 1;
  if (/8\s*عطور|ثمانية\s*عطور/.test(t)) return 8;
  if (/7\s*عطور|سبع\s*عطور/.test(t)) return 7;
  if (/6\s*عطور|ستة\s*عطور/.test(t)) return 6;
  if (/5\s*عطور|خمسة\s*عطور/.test(t)) return 5;
  if (/4\s*عطور|أربع\s*عطور|اربع\s*عطور/.test(t)) return 4;
  if (/عطرين|عطران|ثنائية|لك ولها|قطعتين|ثنائي/.test(t)) return 2;
  if (/ثلاث|3\s*عطور|باقة|بكج/.test(t)) return 3;
  return 1;
}

// The fee rules live in lib/fees.js once that exists (minis, tolas, sets); until
// then the same rules are applied here.
let fees = null;
try { fees = require('../lib/fees'); } catch (e) { /* not in this tree yet */ }
function feeFor(rec, small) {
  if (fees && typeof fees.feeFor === 'function') return fees.feeFor(rec);
  const count = Number(rec.bottleCount) || 1;
  if (count > 1) return count * 4 + 10;
  if (small) return 5;
  const ml = (`${rec.specs && rec.specs.size} ${rec.title}`.match(/(\d+)\s*(?:مل|ml)(?![a-z\d])/i) || [])[1];
  const mini = rec.categoryType === 'perfume' && (/ميني|mini/i.test(rec.title) || (ml && Number(ml) >= 8 && Number(ml) <= 30)) && !/دهن|زيت|شعر|معطر|hair/i.test(rec.title);
  return mini ? 5 : 12;
}

function sizeOf(name, desc, catType) {
  const hit = `${name} ${desc}`.match(/(?<![\d٠-٩])(\d{1,4})\s*(?:مل|ml)(?![\u0600-\u06FFA-Za-z])/i);
  if (catType === 'bundle') return 'مجموعة عطور فاخرة';
  return hit ? `${hit[1]} مل` : 'حسب المنتج';
}

function filler(name) {
  return {
    opening: 'مقدمة عطرية منعشة', heart: 'قلب عطري متناغم', base: 'قاعدة عطرية فاخرة', prominent: name,
  };
}

function buildRecord(house, it, titleEn) {
  const cfg = HOUSES[house];
  const slug = slugOf(it.url);
  const id = cfg.key === 'slug' ? slug : String(it.id);
  const name = String(it.name || '').trim();
  const desc = text(it.description);
  const catType = detectCategoryType(name, desc, it.sku);
  const small = /تولة|زيت عطري|\b(?:3|6|8|10|12|15|20)\s*مل/.test(`${name} ${desc}`.slice(0, 200)) && catType === 'oil';
  const count = inferBottleCount(name, desc, catType);
  const sar = amount(it.price);
  const regular = amount(it.regular_price);
  const orig = Number.isFinite(regular) && regular > sar ? regular : sar;
  const base = Math.round(sar / SAR_PER_JOD);
  const available = it.is_available !== false && it.status !== 'out' && !it.is_out_of_stock;
  const sizeAr = sizeOf(name, desc, catType);
  const en = titleEn || name;
  const f = filler(name);
  const single = catType !== 'bundle' && catType !== 'bakhoor';
  const sub = house === 'laverne'
    ? (catType === 'bundle' ? (count >= 3 || /^(PKG|DIS)/i.test(it.sku || '') ? 'gift_set' : 'bundle') : catType)
    : undefined;
  const rec = {
    id: `${cfg.prefix}-${id}`,
    sallaId: id,
    house,
    title: name,
    titleEn: en,
    brand: cfg.brand,
    bottleCount: count,
    feeJod: 12,
    sarPrice: sar,
    origSarPrice: orig,
    baseJod: base,
    finalJod: base + 12,
    origJod: base + 12,
    isAvailable: available,
    status: available ? 'sale' : 'out',
    url: cfg.key === 'slug' ? `${cfg.origin}/ar/${slug}` : it.url,
    bottleUrl: it.original_image || (it.image && it.image.url) || '',
    image: `images/${cfg.prefix}_${id}.jpg`,
    originalImage: it.original_image || (it.image && it.image.url) || '',
    galleryImages: [],
    overview: desc.slice(0, 600) || name,
    overviewEn: en,
    opening: f.opening, openingEn: f.opening,
    heart: f.heart, heartEn: f.heart,
    base: f.base, baseEn: f.base,
    prominent: f.prominent, prominentEn: f.prominent,
    specs: {
      origin: 'المملكة العربية السعودية', category: 'للجنسين', size: sizeAr,
      type: catType === 'bundle' ? 'مجموعة إهداء' : 'عطر أو دو بارفيوم (Eau de Parfum)', perfumer: cfg.perfumer,
    },
    specsEn: {
      origin: 'Kingdom of Saudi Arabia', category: 'Unisex', size: sizeAr.replace('مل', 'ml').replace('مجموعة عطور فاخرة', 'Gift set'),
      type: catType === 'bundle' ? 'Gift Set' : 'Eau De Parfum', perfumer: cfg.perfumerEn,
    },
    categoryType: catType,
    imageLayout: 'original',
  };
  const fee = feeFor(rec, small);
  rec.feeJod = fee;
  rec.finalJod = base + fee;
  rec.origJod = orig > sar ? Math.round(orig / SAR_PER_JOD) + fee : base + fee;
  if (it.promotion_title) rec.promotionTitle = String(it.promotion_title).trim();
  if (sub) rec.subCategory = sub;
  if (single) rec.needsTemplate = true;
  return rec;
}

// Supplier photo as a 1024 px white-padded square plus a 400 px webp thumbnail.
async function saveImages(rec) {
  let sharp;
  try { sharp = require('sharp'); } catch (e) { return false; }
  const src = rec.originalImage;
  if (!src) return false;
  const res = await fetch(src, { headers: { 'User-Agent': UA } });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  const file = path.join(ROOT, 'public', rec.image);
  const square = await sharp(buf).flatten({ background: '#ffffff' })
    .resize(1024, 1024, { fit: 'contain', background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, square);
  fs.mkdirSync(path.join(IMAGES, 'thumbs'), { recursive: true });
  await sharp(square).resize(400, 400, { fit: 'inside' }).webp({ quality: 74 })
    .toFile(path.join(IMAGES, 'thumbs', `${path.basename(rec.image, '.jpg')}.webp`));
  const hash = require('crypto').createHash('md5').update(square).digest('hex').slice(0, 8);
  rec.image = `${rec.image}?v=${hash}`;
  return true;
}

async function englishNames(cfg, ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    const q = 'source=selected&limit=30&' + chunk.map(id => `source_value[]=${id}`).join('&');
    try {
      const json = await getJson(`https://api.salla.dev/store/v1/products?${q}`, headers(cfg, 'en'));
      for (const it of json.data || []) out.set(String(it.id), String(it.name || '').trim());
    } catch (e) { /* the Arabic title is used */ }
  }
  return out;
}

/**
 * Adds the in-scope products the store does not carry. Returns a summary and
 * the unsure ones. Stops (adds nothing) when more than `cap` would be added.
 */
async function importMissing(house, ours, supplierItems, { cap = 40, write = true } = {}) {
  const cfg = HOUSES[house];
  const have = new Set(ours.map(p => (cfg.key === 'slug' ? slugOf(p.url) : String(p.sallaId))));
  const missing = [...supplierItems.values()].filter(it => !have.has(cfg.key === 'slug' ? slugOf(it.url) : String(it.id)));
  const picked = []; const unsure = []; let skipped = 0;
  for (const it of missing) {
    const c = classify(it);
    if (c.scope === 'in') picked.push(it);
    else if (c.scope === 'unsure') unsure.push({ id: String(it.id), name: it.name, sku: it.sku, price: amount(it.price), url: it.url, why: c.why });
    else skipped++;
  }
  const summary = { house, supplier: supplierItems.size, ours: ours.length, missing: missing.length, outOfScope: skipped, unsure, added: [] };
  if (picked.length > cap) { summary.aborted = `${picked.length} new products is more than the cap of ${cap}; nothing added`; summary.wouldAdd = picked.map(i => i.name); return summary; }
  const names = await englishNames(cfg, picked.map(i => String(i.id)));
  const norm = t => String(t || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
  const titles = new Set(ours.map(p => norm(p.title)));
  for (const it of picked) {
    const rec = buildRecord(house, it, names.get(String(it.id)));
    // A set that shares its name with a single perfume (e.g. "لويارد") says so.
    if (titles.has(norm(rec.title))) {
      rec.title += rec.categoryType === 'bundle' ? ' - مجموعة' : ' - إصدار آخر';
      rec.titleEn += rec.categoryType === 'bundle' ? ' (set)' : ' (other edition)';
    }
    titles.add(norm(rec.title));
    try { await saveImages(rec); } catch (e) { /* the supplier photo is fetched again next run */ }
    ours.push(rec);
    summary.added.push({ id: rec.id, title: rec.title, available: rec.isAvailable, category: rec.categoryType });
  }
  if (write && summary.added.length) {
    const raw = fs.readFileSync(path.join(DATA, cfg.file), 'utf8');
    fs.writeFileSync(path.join(DATA, cfg.file), JSON.stringify(ours, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
  }
  return summary;
}

module.exports = { HOUSES, enumerate, listing, classify, buildRecord, importMissing, saveImages, slugOf, text, headers, getJson };
