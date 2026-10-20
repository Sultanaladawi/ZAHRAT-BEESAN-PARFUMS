#!/usr/bin/env node
/**
 * Fill titleEn with each supplier's official English product name.
 *
 *   node tools/english-names.js            # report only
 *   node tools/english-names.js --apply    # write public/data/*.json
 *
 * Only products whose titleEn is missing or still Arabic are touched.
 * Salla stores answer in English when asked (Accept-Language: en); Deraah
 * pages are read from the English site (/en_sa/).
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'public', 'data');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SALLA = {
  'perfumes.json': { storeId: '1939633486', origin: 'https://ghalati.com' },
  'assaf_perfumes.json': { storeId: '935113581', origin: 'https://3saf.com' },
  'thnyan_perfumes.json': { storeId: '1657367005', origin: 'https://thnyan.com' },
  'rasasi_perfumes.json': { storeId: '1903977862', origin: 'https://store.rasasi.com.sa' },
  'alrehab_perfumes.json': { storeId: '64344517', origin: 'https://alrehabstore.com' },
  'lebonheur_perfumes.json': { storeId: '673065613', origin: 'https://lebonheurperfumes.com' },
  'oudelite_perfumes.json': { storeId: '1934736234', origin: 'https://sa.oudelite.com' },
};
const LAVERNE = { file: 'laverne_perfumes.json', storeId: '504871843', origin: 'https://laverne.com' };
const ARABIC = /[؀-ۿ]/;
const needs = p => !p.titleEn || ARABIC.test(p.titleEn);
const sallaId = p => String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || '');
const slugOf = url => String(url || '').replace(/[?#].*$/, '').split('/').filter(Boolean).pop() || '';

// Supplier names are often ALL CAPS; give them a calm title case.
function tidy(name) {
  let s = String(name || '').replace(/\s+/g, ' ').trim();
  if (!s || ARABIC.test(s)) return '';
  if (s === s.toUpperCase()) {
    s = s.toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase())
      .replace(/\b(\d+)\s*Ml\b/gi, '$1 ml').replace(/\bEdp\b/g, 'EDP').replace(/\bEdt\b/g, 'EDT');
  }
  return s.replace(/(\d)\s*ml\b/gi, '$1 ml');
}

function headers(cfg) {
  return { Origin: cfg.origin, Referer: `${cfg.origin}/`, 'User-Agent': UA, 'App-Store-Id': cfg.storeId,
    'Store-Identifier': cfg.storeId, Accept: 'application/json', 'Accept-Language': 'en', locale: 'en' };
}

async function sallaNames(cfg, items) {
  const out = new Map();
  const ids = items.map(sallaId).filter(Boolean);
  for (let i = 0; i < ids.length; i += 20) {
    const q = 'source=selected&limit=30&' + ids.slice(i, i + 20).map(id => `source_value[]=${id}`).join('&');
    try {
      const res = await fetch(`https://api.salla.dev/store/v1/products?${q}`, { headers: headers(cfg) });
      if (!res.ok) continue;
      for (const it of (await res.json()).data || []) out.set(String(it.id), tidy(it.name));
    } catch (e) { /* leave these for the next run */ }
  }
  return p => out.get(sallaId(p)) || '';
}

async function laverneNames(items) {
  const out = new Map();
  let url = 'https://api.salla.dev/store/v1/products?per_page=100';
  for (let guard = 0; url && guard < 50; guard++) {
    const res = await fetch(url, { headers: headers(LAVERNE) });
    if (!res.ok) break;
    const json = await res.json();
    for (const it of json.data || []) out.set(slugOf(it.url), tidy(it.name));
    url = json.cursor?.next || null;
  }
  return p => out.get(slugOf(p.url)) || '';
}

async function deraahName(p) {
  const url = String(p.url || '').replace('/ar_sa/', '/en_sa/');
  if (!url.includes('/en_sa/')) return '';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
    if (!res.ok) return '';
    const html = await res.text();
    for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const data = JSON.parse(m[1].trim());
        const nodes = data['@graph'] || (Array.isArray(data) ? data : [data]);
        const prod = nodes.find(x => x && x['@type'] === 'Product');
        if (prod && prod.name) return tidy(prod.name);
      } catch (e) { /* ignore */ }
    }
    const og = html.match(/<meta property="og:title" content="([^"]+)"/);
    return og ? tidy(og[1].replace(/\s*[|–-]\s*Deraah.*$/i, '')) : '';
  } catch (e) {
    return '';
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const jobs = [...Object.entries(SALLA).map(([file, cfg]) => [file, items => sallaNames(cfg, items)]),
    [LAVERNE.file, laverneNames], ['deraah_perfumes.json', null]];
  for (const [file, make] of jobs) {
    const full = path.join(DATA, file);
    const raw = fs.readFileSync(full, 'utf8');
    const items = JSON.parse(raw);
    const todo = items.filter(needs);
    let found = 0;
    if (make) {
      const lookup = await make(todo);
      for (const p of todo) { const n = lookup(p); if (n) { p.titleEn = n; found++; } }
    } else {
      for (let i = 0; i < todo.length; i += 6) {
        const names = await Promise.all(todo.slice(i, i + 6).map(deraahName));
        names.forEach((n, k) => { if (n) { todo[i + k].titleEn = n; found++; } });
      }
    }
    if (apply && found) fs.writeFileSync(full, JSON.stringify(items, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
    console.log(`${file.padEnd(26)} needed ${String(todo.length).padStart(4)} | found ${found}`);
  }
}

main();
