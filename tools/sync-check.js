#!/usr/bin/env node
/**
 * Check (and optionally apply) every supplier's live price and stock.
 *
 *   node tools/sync-check.js                  # report only, all houses
 *   node tools/sync-check.js deraah           # one or more houses
 *   node tools/sync-check.js --apply          # also update public/data/*.json
 *
 * Reports, per house: products whose live price differs from ours, products
 * that went out of stock (or came back), and products the supplier no longer
 * lists. The report is saved to tools/sync-report.json. With --apply, prices
 * and stock are written back and delisted products are marked unavailable
 * (never deleted); products whose check failed are left untouched.
 */
const fs = require('fs');
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

async function sallaLive(house, items) {
  const cfg = SALLA_HOUSES[house];
  const headers = {
    Origin: cfg.origin, Referer: `${cfg.origin}/`, 'User-Agent': UA,
    'App-Store-Id': cfg.storeId, 'Store-Identifier': cfg.storeId, Accept: 'application/json',
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
        const price = Number(typeof it.price === 'object' ? it.price?.amount : it.price);
        live.set(String(it.id), {
          price,
          available: it.is_available !== false && it.status !== 'out' && !it.is_out_of_stock,
        });
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
  const headers = {
    Origin: cfg.origin, Referer: `${cfg.origin}/`, 'User-Agent': UA,
    'App-Store-Id': cfg.storeId, 'Store-Identifier': cfg.storeId, Accept: 'application/json',
  };
  const live = new Map();
  let url = 'https://api.salla.dev/store/v1/products?per_page=100';
  for (let guard = 0; url && guard < 100; guard++) {
    const res = await fetch(url, { headers });
    if (!res.ok) return items.map(p => ({ p, error: `listing HTTP ${res.status}` }));
    const json = await res.json();
    for (const it of json.data || []) {
      const price = Number(typeof it.price === 'object' ? it.price?.amount : it.price);
      live.set(slugOf(it.url), {
        price,
        available: it.is_available !== false && it.status !== 'out' && !it.is_out_of_stock,
      });
    }
    url = json.cursor?.next || null;
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
    return { p, price, available };
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

function applyChanges(items, results) {
  const byId = new Map(results.map(r => [r.p.id, r]));
  let changed = 0;
  for (const p of items) {
    const r = byId.get(p.id);
    if (!r || r.error) continue;
    const before = JSON.stringify([p.sarPrice, p.origSarPrice, p.finalJod, p.origJod, p.isAvailable, p.status]);
    if (r.missing) {
      p.isAvailable = false;
      p.status = 'out';
    } else {
      if (Number.isFinite(r.price) && r.price > 0 && Math.abs(r.price - Number(p.sarPrice)) >= 0.5) {
        const fee = Number(p.feeJod) || 12;
        p.sarPrice = r.price;
        if (!(Number(p.origSarPrice) > r.price)) p.origSarPrice = r.price;
        p.baseJod = Math.round(r.price / SAR_PER_JOD);
        p.finalJod = p.baseJod + fee;
        p.origJod = p.origSarPrice > p.sarPrice ? Math.round(p.origSarPrice / SAR_PER_JOD) + fee : p.finalJod;
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
    if (JSON.stringify([p.sarPrice, p.origSarPrice, p.finalJod, p.origJod, p.isAvailable, p.status]) !== before) changed++;
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

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
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
    console.log(`${house.padEnd(10)} products ${String(r.total).padStart(4)} | price changed ${r.priceChanged.length} | out of stock ${r.wentOut.length} | back in stock ${r.cameBack.length} | gone ${r.missing.length} | check failed ${r.errors.length}${note}`);
  }
  fs.writeFileSync(path.join(__dirname, 'sync-report.json'), JSON.stringify(reports, null, 2));
}

main();
