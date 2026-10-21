#!/usr/bin/env node
/**
 * Fill every product's photo gallery with all of the supplier's photos.
 *
 *   node tools/galleries.js              # all houses
 *   node tools/galleries.js assaf deraah # some houses
 *
 * Salla houses: the storefront API's product details (with[]=images) list
 * every photo in the supplier's order. Deraah: the product page's own photos
 * (<sku>-1.jpg, -2.jpg …). Photos are stored full-size (Salla's resize
 * prefix removed) in galleryImages; a product whose check fails keeps its
 * old gallery. The product modal shows our podium image first, then these.
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'public', 'data');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const SALLA = {
  ghalati: { file: 'perfumes.json', storeId: '1939633486', origin: 'https://ghalati.com' },
  assaf: { file: 'assaf_perfumes.json', storeId: '935113581', origin: 'https://3saf.com' },
  thnyan: { file: 'thnyan_perfumes.json', storeId: '1657367005', origin: 'https://thnyan.com' },
  rasasi: { file: 'rasasi_perfumes.json', storeId: '1903977862', origin: 'https://store.rasasi.com.sa' },
  alrehab: { file: 'alrehab_perfumes.json', storeId: '64344517', origin: 'https://alrehabstore.com' },
  lebonheur: { file: 'lebonheur_perfumes.json', storeId: '673065613', origin: 'https://lebonheurperfumes.com' },
  laverne: { file: 'laverne_perfumes.json', storeId: '504871843', origin: 'https://laverne.com', bySlug: true },
  oudelite: { file: 'oudelite_perfumes.json', storeId: '1934736234', origin: 'https://sa.oudelite.com' },
};
const DERAAH = { file: 'deraah_perfumes.json' };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const sallaId = p => String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || '');
const slugOf = url => String(url || '').replace(/[?#].*$/, '').split('/').filter(Boolean).pop() || '';
// "…/WlRyvX/<uuid>-500x500-<file>.jpg" → "…/WlRyvX/<file>.jpg"
const fullSize = url => String(url || '').replace(/\/[a-f0-9-]{36}-\d+(?:\.\d+)?x\d+(?:\.\d+)?-/i, '/');

function headers(cfg) {
  return {
    Origin: cfg.origin, Referer: `${cfg.origin}/`, 'User-Agent': UA,
    'Store-Identifier': cfg.storeId, Accept: 'application/json', 'Accept-Language': 'ar',
  };
}

async function getJson(url, hdrs) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: hdrs });
    if (res.status === 429) { await sleep(2000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('rate limited');
}

// Laverne's catalog is keyed by URL slug, so map slugs to product ids first.
async function slugIds(cfg) {
  const ids = new Map();
  let url = 'https://api.salla.dev/store/v1/products';
  for (let page = 1; url && page <= 400; page++) {
    const json = await getJson(url, headers(cfg));
    const before = ids.size;
    for (const it of json.data || []) ids.set(slugOf(it.url), String(it.id));
    if (ids.size === before || !(json.cursor && json.cursor.next)) break;
    const u = new URL(json.cursor.next);
    u.protocol = 'https:';
    u.hostname = 'api.salla.dev';
    url = u.toString();
  }
  return ids;
}

async function sallaImages(cfg, id) {
  const json = await getJson(`https://api.salla.dev/store/v1/products/${id}/details?with[]=images`, headers(cfg));
  const images = ((json.data || {}).images || [])
    .filter(im => im && im.url && (!im.type || im.type === 'image'))
    .sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0) || (a.sort || 0) - (b.sort || 0));
  return [...new Set(images.map(im => fullSize(im.url)))];
}

async function deraahImages(p) {
  const sku = slugOf(p.url).replace(/\.html$/, '');
  const res = await fetch(p.url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ar' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const found = new Map();
  const re = /https:\/\/www\.deraahstore\.com\/dw\/image\/v2\/[^"'\s?]+\/images\/([^"'\s?/]+)\.(?:jpe?g|png|webp)/gi;
  for (const m of html.matchAll(re)) {
    const name = m[1];
    if (!name.startsWith(sku)) continue; // photos of other products on the page
    const n = Number((name.match(/-(\d+)$/) || [])[1]) || 0;
    if (!found.has(name)) found.set(name, { n, url: `${m[0]}?sw=800&sh=800&q=85` });
  }
  return [...found.values()].sort((a, b) => a.n - b.n).map(x => x.url);
}

// Runs fn over items, a few at a time.
async function pool(items, size, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; await fn(items[i], i); }
  }));
}

async function runHouse(house) {
  const cfg = SALLA[house] || (house === 'deraah' ? DERAAH : null);
  if (!cfg) { console.error(`unknown house: ${house}`); return; }
  const file = path.join(DATA, cfg.file);
  const raw = fs.readFileSync(file, 'utf8');
  const items = JSON.parse(raw);
  const ids = cfg.bySlug ? await slugIds(cfg) : null;
  let updated = 0, failed = 0, photos = 0, single = 0;
  await pool(items, house === 'deraah' ? 3 : 4, async p => {
    try {
      let list;
      if (house === 'deraah') list = await deraahImages(p);
      else {
        const id = ids ? ids.get(slugOf(p.url)) : sallaId(p);
        if (!id) throw new Error('no supplier id');
        list = await sallaImages(cfg, id);
      }
      if (!list.length) throw new Error('no photos');
      if (JSON.stringify(list) !== JSON.stringify(p.galleryImages || [])) updated++;
      p.galleryImages = list;
      photos += list.length;
      if (list.length < 2) single++;
    } catch (e) {
      failed++;
      if (failed <= 5) console.log(`  ${house} ${p.id}: ${e.message}`);
    }
  });
  if (updated) fs.writeFileSync(file, JSON.stringify(items, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
  const ok = items.length - failed;
  console.log(`${house.padEnd(10)} ${items.length} products, ${updated} updated, ${failed} failed, `
    + `avg ${(photos / Math.max(ok, 1)).toFixed(1)} photos, ${single} with one photo only`);
}

(async () => {
  const wanted = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const houses = wanted.length ? wanted : [...Object.keys(SALLA), 'deraah'];
  for (const h of houses) await runHouse(h);
})();
