#!/usr/bin/env node
/**
 * Check (and optionally apply) every supplier's live price and stock.
 *
 *   node tools/sync-check.js                  # report only, all houses
 *   node tools/sync-check.js deraah           # one or more houses
 *   node tools/sync-check.js --apply          # also update public/data/*.json
 *   node tools/sync-check.js --discover       # also list supplier products we don't carry
 *
 * Reports, per house: products whose live price differs from ours, products
 * that went out of stock (or came back), and products the supplier no longer
 * lists. The report is saved to tools/sync-report.json. With --apply, prices,
 * "was" prices, offer titles, sale end dates and stock are written back,
 * delisted products are marked unavailable (never deleted), products whose
 * check failed are left untouched, and the supplier offer groups used by the
 * bag (public/data/offers.json) are refreshed.
 */
const fs = require('fs');
const catalog = require('./salla-catalog');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const SALLA_HOUSES = {
  ghalati: { file: 'perfumes.json', storeId: '1939633486', origin: 'https://ghalati.com' },
  assaf: { file: 'assaf_perfumes.json', storeId: '935113581', origin: 'https://3saf.com' },
  thnyan: { file: 'thnyan_perfumes.json', storeId: '1657367005', origin: 'https://thnyan.com' },
  rasasi: { file: 'rasasi_perfumes.json', storeId: '1903977862', origin: 'https://store.rasasi.com.sa' },
  alrehab: { file: 'alrehab_perfumes.json', storeId: '64344517', origin: 'https://alrehabstore.com' },
  lebonheur: { file: 'lebonheur_perfumes.json', storeId: '673065613', origin: 'https://lebonheurperfumes.com' },
  oudelite: { file: 'oudelite_perfumes.json', storeId: '1934736234', origin: 'https://sa.oudelite.com' },
};
// Laverne is a Salla store too, but its products are keyed by URL slug.
const SALLA_LISTED_HOUSES = {
  laverne: { file: 'laverne_perfumes.json', storeId: '504871843', origin: 'https://laverne.com' },
};
const PAGE_HOUSES = {
  deraah: { file: 'deraah_perfumes.json' },
};
const SAR_PER_JOD = 5.29;

const sallaId = p => String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || '');
const amount = v => Number(typeof v === 'object' && v ? v.amount : v);

// Price, list price, offer title, sale end and stock from one Salla product.
function sallaFields(it) {
  const price = amount(it.price);
  const regular = amount(it.regular_price);
  return {
    price,
    regular: Number.isFinite(regular) && regular > price ? regular : price,
    promo: typeof it.promotion_title === 'string' ? it.promotion_title.trim() : '',
    endsAt: it.discount_ends ? new Date(Number(it.discount_ends) > 1e9 && Number(it.discount_ends) < 1e11 ? Number(it.discount_ends) * 1000 : it.discount_ends).toISOString() : null,
    available: it.is_available !== false && it.status !== 'out' && !it.is_out_of_stock,
  };
}

async function sallaLive(house, items) {
  const cfg = SALLA_HOUSES[house];
  const headers = {
    Origin: cfg.origin, Referer: `${cfg.origin}/`, 'User-Agent': UA,
    'App-Store-Id': cfg.storeId, 'Store-Identifier': cfg.storeId, Accept: 'application/json',
    // The API answers in English unless asked; offer titles must stay Arabic.
    'Accept-Language': 'ar',
  };
  const ids = items.map(sallaId).filter(Boolean);
  const live = new Map();
  const failedIds = new Set();
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    const q = 'source=selected&limit=30&' + chunk.map(id => `source_value[]=${id}`).join('&');
    try {
      const res = await fetch(`https://api.salla.dev/store/v1/products?${q}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      for (const it of (await res.json()).data || []) {
        live.set(String(it.id), sallaFields(it));
      }
    } catch (e) {
      chunk.forEach(id => failedIds.add(id));
    }
  }
  return items.map(p => {
    const id = sallaId(p);
    if (failedIds.has(id)) return { p, error: 'request failed' };
    const l = live.get(id);
    return l ? { p, ...l } : { p, missing: true };
  });
}

const slugOf = url => String(url || '').replace(/[?#].*$/, '').split('/').filter(Boolean).pop() || '';

async function sallaListedLive(house, items) {
  const cfg = SALLA_LISTED_HOUSES[house];
  const live = new Map();
  try {
    for (const it of await sallaListing(cfg, '')) live.set(slugOf(it.url), sallaFields(it));
  } catch (e) {
    return items.map(p => ({ p, error: `listing ${e.message}` }));
  }
  return items.map(p => {
    const l = live.get(slugOf(p.url));
    return l ? { p, ...l } : { p, missing: true };
  });
}

async function pageLive(p) {
  try {
    const res = await fetch(p.url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow' });
    if (res.status === 404 || res.status === 410) return { p, missing: true };
    if (!res.ok) return { p, error: `HTTP ${res.status}` };
    const html = await res.text();
    let price = null;
    let available = null;
    for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const data = JSON.parse(m[1].trim());
        const nodes = data['@graph'] || (Array.isArray(data) ? data : [data]);
        const prod = nodes.find(x => x && x['@type'] === 'Product');
        const offer = prod && (Array.isArray(prod.offers) ? prod.offers[0] : prod.offers);
        if (offer) {
          price = parseFloat(offer.price);
          // Stores geo-price by visitor IP; normalise USD offers back to SAR.
          if (String(offer.priceCurrency || '').toUpperCase() === 'USD') price = Math.round(price * 3.75);
          available = String(offer.availability || '').includes('InStock');
        }
      } catch (e) { /* ignore malformed blocks */ }
    }
    if (price === null) return { p, error: 'no price on page' };
    // Deraah's tracking data carries the list price; trust it only when its
    // sale price is this product's (some pages show another size there).
    let regular = price;
    const ins = html.match(/"unit_price":([\d.]+),"unit_sale_price":([\d.]+)/);
    if (ins && Math.abs(Number(ins[2]) - price) < 1 && Number(ins[1]) > price) regular = Number(ins[1]);
    return { p, price, regular, available };
  } catch (e) {
    return { p, error: e.message };
  }
}

async function pagesLive(items, concurrency = 6) {
  const out = [];
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < items.length) {
      const p = items[next++];
      out.push(await pageLive(p));
    }
  }));
  return out;
}

// Titles we set ourselves for discontinued items; the supplier must not overwrite them.
const CANCELLED_TITLES = /غير متوفر حالياً|الغاء|إلغاء|ملغي/;

function applyChanges(items, results) {
  const byId = new Map(results.map(r => [r.p.id, r]));
  let changed = 0;
  for (const p of items) {
    const r = byId.get(p.id);
    if (!r || r.error) continue;
    const snapshot = () => JSON.stringify([p.sarPrice, p.origSarPrice, p.finalJod, p.origJod, p.isAvailable, p.status, p.promotionTitle, p.saleEndsAt]);
    const before = snapshot();
    if (r.missing) {
      p.isAvailable = false;
      p.status = 'out';
    } else {
      const fee = Number(p.feeJod) || 12;
      if (Number.isFinite(r.price) && r.price > 0 && Math.abs(r.price - Number(p.sarPrice)) >= 0.5) {
        p.sarPrice = r.price;
        p.baseJod = Math.round(r.price / SAR_PER_JOD);
        p.finalJod = p.baseJod + fee;
      }
      // The "was" price follows the supplier's list price, up or down.
      if (Number.isFinite(r.regular) && r.regular > 0) {
        p.origSarPrice = Math.max(r.regular, Number(p.sarPrice) || 0);
        p.origJod = p.origSarPrice > p.sarPrice ? Math.round(p.origSarPrice / SAR_PER_JOD) + fee : p.finalJod;
      }
      if ('promo' in r && !CANCELLED_TITLES.test(p.promotionTitle || '') && p.promotionTitle !== 'يتوفر قريباً') {
        if (r.promo) p.promotionTitle = r.promo; else delete p.promotionTitle;
      }
      if ('endsAt' in r) {
        if (r.endsAt) p.saleEndsAt = r.endsAt; else delete p.saleEndsAt;
      }
      if (r.available === false) {
        p.isAvailable = false;
        p.status = 'out';
      } else if (r.available === true && (p.isAvailable === false || p.status === 'out')) {
        p.isAvailable = true;
        p.status = 'sale';
        if (p.promotionTitle === 'يتوفر قريباً') delete p.promotionTitle;
      }
    }
    if (snapshot() !== before) changed++;
  }
  return changed;
}

function compare(house, results) {
  const report = { house, total: results.length, priceChanged: [], wentOut: [], cameBack: [], missing: [], errors: [] };
  for (const r of results) {
    const p = r.p;
    const row = { id: p.id, title: p.title, ourSar: p.sarPrice, ourJod: p.finalJod };
    if (r.error) { report.errors.push({ ...row, error: r.error }); continue; }
    if (r.missing) { report.missing.push(row); continue; }
    if (Number.isFinite(r.price) && Math.abs(r.price - Number(p.sarPrice)) >= 0.5) {
      report.priceChanged.push({ ...row, liveSar: r.price });
    }
    const ourAvail = p.isAvailable !== false;
    if (ourAvail && r.available === false) report.wentOut.push(row);
    if (!ourAvail && r.available === true) report.cameBack.push(row);
  }
  return report;
}

// Supplier offer categories behind the bag's group offers (see OFFER_RULES in
// public/js/cart.js). Every page is read so no product is missed.
const OFFER_CATEGORIES = {
  'ghalati-2': { house: 'ghalati', category: '1389534759' },
  'thnyan-4': { house: 'thnyan', category: '214031821' },
};

function sallaHeaders(cfg) {
  return {
    Origin: cfg.origin, Referer: `${cfg.origin}/`, 'User-Agent': UA,
    'App-Store-Id': cfg.storeId, 'Store-Identifier': cfg.storeId, Accept: 'application/json', 'Accept-Language': 'ar',
  };
}

// All products of a Salla listing. Follows the API's "next" link (moved back
// to api.salla.dev when it points at another host) and stops once a page
// brings nothing new.
async function sallaListing(cfg, query) {
  const seen = new Map();
  let url = `https://api.salla.dev/store/v1/products${query ? `?${query}` : ''}`;
  for (let page = 1; url && page <= 400; page++) {
    let json = null;
    for (let attempt = 0; attempt < 4 && !json; attempt++) {
      const res = await fetch(url, { headers: sallaHeaders(cfg) });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      json = await res.json();
    }
    if (!json) throw new Error('rate limited');
    const before = seen.size;
    for (const it of json.data || []) seen.set(String(it.id), it);
    if (seen.size === before) break;
    const next = json.cursor && json.cursor.next;
    if (!next) break;
    const u = new URL(next);
    u.protocol = 'https:';
    u.hostname = 'api.salla.dev';
    url = u.toString();
  }
  return [...seen.values()];
}

async function refreshOffers() {
  const file = path.join(DATA, 'offers.json');
  let current = {};
  try { current = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { /* first run */ }
  const next = { ...current };
  for (const [key, o] of Object.entries(OFFER_CATEGORIES)) {
    try {
      const items = await sallaListing(SALLA_HOUSES[o.house], `source=categories&source_value[]=${o.category}`);
      const ids = items.filter(it => it.is_available !== false && !it.is_out_of_stock).map(it => String(it.id));
      if (ids.length) next[key] = [...new Set(ids)].sort();
      console.log(`offer ${key.padEnd(10)} ${ids.length} products`);
    } catch (e) {
      console.log(`offer ${key.padEnd(10)} check failed (${e.message}), kept the old list`);
    }
  }
  if (JSON.stringify(next) !== JSON.stringify(current)) fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
}

// Supplier products we don't carry yet (report only: new items need photos).
async function discover(house, items) {
  const cfg = SALLA_HOUSES[house];
  if (!cfg) return null;
  const ours = new Set(items.map(sallaId));
  const live = await sallaListing(cfg, '');
  return live.filter(it => !ours.has(String(it.id)) && it.is_available !== false && !it.is_out_of_stock)
    .map(it => ({ id: String(it.id), name: it.name, price: amount(it.price), url: it.url }));
}

// What the import added or could not decide: tools/import-review.json (kept in
// the repo, for a person to look at) and tools/last-import.txt (becomes the
// commit message, not kept).
function writeImportReport(summaries) {
  const report = {};
  const lines = [];
  for (const s of summaries) {
    report[s.house] = { supplier: s.supplier, unsure: s.unsure, aborted: s.aborted || null, wouldAdd: s.wouldAdd || null };
    if (s.added.length) {
      lines.push(`${s.house}: added ${s.added.length} new product(s)`);
      for (const a of s.added) lines.push(`  + ${a.title} (${a.category}${a.available ? '' : ', sold out'})`);
    }
    if (s.aborted) lines.push(`${s.house}: ${s.aborted}`);
    if (s.unsure.length) lines.push(`${s.house}: ${s.unsure.length} product(s) need a look, see tools/import-review.json`);
  }
  fs.writeFileSync(path.join(__dirname, 'import-review.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(__dirname, 'last-import.txt'), lines.join('\n') + (lines.length ? '\n' : ''));
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const wantDiscover = args.includes('--discover');
  const found = {};
  const wantImport = args.includes('--import');
  // The category-by-category pass costs ~80 requests a house: once a day, or on request.
  const exhaustive = args.includes('--exhaustive') || (wantImport && new Date().getUTCHours() === 3);
  const importCap = Number((args.find(a => a.startsWith('--cap=')) || '').slice(6)) || 40;
  const importSummaries = [];
  const wanted = args.filter(a => !a.startsWith('--'));
  const all = { ...SALLA_HOUSES, ...SALLA_LISTED_HOUSES, ...PAGE_HOUSES };
  const houses = wanted.length ? wanted : Object.keys(all);
  const reports = [];
  for (const house of houses) {
    const cfg = all[house];
    if (!cfg) { console.error(`unknown house: ${house}`); continue; }
    const file = path.join(DATA, cfg.file);
    const raw = fs.readFileSync(file, 'utf8');
    const items = JSON.parse(raw);
    const results = SALLA_HOUSES[house] ? await sallaLive(house, items)
      : SALLA_LISTED_HOUSES[house] ? await sallaListedLive(house, items)
        : await pagesLive(items);
    const r = compare(house, results);
    reports.push(r);
    let note = '';
    if (apply) {
      const changed = applyChanges(items, results);
      if (changed) fs.writeFileSync(file, JSON.stringify(items, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
      note = ` | updated ${changed}`;
    }
    if (wantDiscover) {
      try {
        const extra = await discover(house, items);
        if (extra) { found[house] = extra; note += ` | not carried ${extra.length}`; }
      } catch (e) { note += ' | discovery failed'; }
    }
    // Products the supplier added since the last run (new, sold out, or only
    // reachable from a category): in-scope ones are added to the catalog,
    // unsure ones go to the discover report. Never more than the cap per run.
    if (wantImport && catalog.HOUSES[house]) {
      try {
        const fresh = JSON.parse(fs.readFileSync(file, 'utf8'));
        const { items: supplier, extra } = await catalog.enumerate(catalog.HOUSES[house], { exhaustive });
        const sum = await catalog.importMissing(house, fresh, supplier, { cap: importCap, write: apply });
        sum.foundOnlyInCategories = extra.length;
        importSummaries.push(sum);
        note += ` | supplier ${sum.supplier} | added ${sum.added.length} | unsure ${sum.unsure.length}${sum.aborted ? ' | ABORTED (cap)' : ''}`;
      } catch (e) { note += ` | import failed (${e.message})`; }
    }
    console.log(`${house.padEnd(10)} products ${String(r.total).padStart(4)} | price changed ${r.priceChanged.length} | out of stock ${r.wentOut.length} | back in stock ${r.cameBack.length} | gone ${r.missing.length} | check failed ${r.errors.length}${note}`);
  }
  if (wantImport) writeImportReport(importSummaries);
  if (apply && !wanted.length) await refreshOffers();
  fs.writeFileSync(path.join(__dirname, 'sync-report.json'), JSON.stringify(reports, null, 2));
  if (wantDiscover) fs.writeFileSync(path.join(__dirname, 'discover-report.json'), JSON.stringify(found, null, 2));
}

main();
