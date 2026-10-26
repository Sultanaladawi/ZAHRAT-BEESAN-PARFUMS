#!/usr/bin/env node
/**
 * Fetch what each supplier says about every product (name, SKU, description,
 * price, stock, photos) from the Salla storefront API's product details and
 * save it as one JSON file per house. Used to check sizes and set contents.
 *
 *   node tools/product-facts.js <outDir> [house ...]
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
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sallaId = p => String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || '');
const slugOf = url => String(url || '').replace(/[?#].*$/, '').split('/').filter(Boolean).pop() || '';
const headers = cfg => ({ Origin: cfg.origin, Referer: `${cfg.origin}/`, 'User-Agent': UA, 'Store-Identifier': cfg.storeId, Accept: 'application/json', 'Accept-Language': 'ar' });
async function getJson(url, h) {
  for (let a = 0; a < 6; a++) {
    const res = await fetch(url, { headers: h });
    if (res.status === 429) { await sleep(2000 * (a + 1)); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('rate limited');
}
async function slugIds(cfg) {
  const ids = new Map();
  let url = 'https://api.salla.dev/store/v1/products';
  for (let page = 1; url && page <= 400; page++) {
    const json = await getJson(url, headers(cfg));
    const before = ids.size;
    for (const it of json.data || []) ids.set(slugOf(it.url), String(it.id));
    if (ids.size === before || !(json.cursor && json.cursor.next)) break;
    const u = new URL(json.cursor.next); u.protocol = 'https:'; u.hostname = 'api.salla.dev'; url = u.toString();
  }
  return ids;
}
const text = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
async function pool(items, size, fn) { let n = 0; await Promise.all(Array.from({ length: size }, async () => { while (n < items.length) { const i = n++; await fn(items[i]); } })); }

(async () => {
  const out = process.argv[2];
  fs.mkdirSync(out, { recursive: true });
  const wanted = process.argv.slice(3);
  for (const house of wanted.length ? wanted : Object.keys(SALLA)) {
    const cfg = SALLA[house];
    const items = JSON.parse(fs.readFileSync(path.join(DATA, cfg.file), 'utf8'));
    const ids = cfg.bySlug ? await slugIds(cfg) : null;
    const facts = {}; let failed = 0;
    await pool(items, 4, async p => {
      try {
        const id = ids ? ids.get(slugOf(p.url)) : sallaId(p);
        if (!id) throw new Error('no supplier id');
        const j = (await getJson(`https://api.salla.dev/store/v1/products/${id}/details?with[]=images`, headers(cfg))).data || {};
        facts[p.id] = { sid: id, name: j.name, sku: j.sku, subtitle: j.subtitle, price: j.price, regular: j.regular_price, qty: j.quantity,
          available: j.is_available, url: j.url, desc: text(j.description).slice(0, 2500), images: (j.images || []).map(i => i.url) };
      } catch (e) { failed++; facts[p.id] = { error: e.message }; }
    });
    fs.writeFileSync(path.join(out, `${house}.json`), JSON.stringify(facts));
    console.log(house.padEnd(10), items.length, 'products,', failed, 'failed');
  }
})();
