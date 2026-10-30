#!/usr/bin/env node
/**
 * Does the classifier agree with how the catalog files our products?
 *
 *   node tools/audit-classes.js              # every Salla house
 *   node tools/audit-classes.js assaf laverne
 *
 * Fetches each supplier's current listing, runs public/js/classify-product.js
 * on every product we carry and compares the section (perfume / bundle / oil /
 * bakhoor / hair_mist) and, for sets, the bottle count. Prints the agreement
 * per house and writes the disagreements to tools/class-audit.json for a
 * person to look at. It changes nothing in the catalog.
 */
const fs = require('fs');
const path = require('path');
const { classifyProduct } = require('../public/js/classify-product');
const catalog = require('./salla-catalog');

const DATA = path.join(__dirname, '..', 'public', 'data');
const STORES = {
  ghalati: ['perfumes.json', '1939633486', 'https://ghalati.com'],
  assaf: ['assaf_perfumes.json', '935113581', 'https://3saf.com'],
  thnyan: ['thnyan_perfumes.json', '1657367005', 'https://thnyan.com'],
  rasasi: ['rasasi_perfumes.json', '1903977862', 'https://store.rasasi.com.sa'],
  alrehab: ['alrehab_perfumes.json', '64344517', 'https://alrehabstore.com'],
  lebonheur: ['lebonheur_perfumes.json', '673065613', 'https://lebonheurperfumes.com'],
  laverne: ['laverne_perfumes.json', '504871843', 'https://laverne.com'],
  oudelite: ['oudelite_perfumes.json', '1934736234', 'https://sa.oudelite.com'],
};

// How our curated catalog labels a product, on the classifier's scale.
function filedAs(p) {
  if (p.subCategory === 'dehn') return 'oil';
  if (['pens', 'gift_set', 'bundle'].includes(p.subCategory)) return 'bundle';
  const c = p.categoryType;
  if (c === 'bundle' || c === 'gift_set') return 'bundle';
  if (c === 'mini') return 'perfume';
  return c || 'perfume';
}

async function main() {
  const wanted = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const houses = wanted.length ? wanted : Object.keys(STORES);
  const report = { generated: new Date().toISOString(), sections: [], bottles: [] };
  let n = 0, ok = 0;
  for (const house of houses) {
    const [file, storeId, origin] = STORES[house];
    const ours = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
    const supplier = await catalog.listing({ storeId, origin }, '');
    const byId = new Map([...supplier.values()].map(i => [String(i.id), i]));
    const bySlug = new Map([...supplier.values()].map(i => [catalog.slugOf(i.url), i]));
    let hn = 0, hok = 0;
    for (const p of ours) {
      const m = String(p.url || '').match(/\/p(\d+)/);
      const it = byId.get(String(p.sallaId || '')) || (m && byId.get(m[1])) || bySlug.get(catalog.slugOf(p.url));
      if (!it) continue;
      const cls = classifyProduct(it, { byId, house });
      hn++;
      const label = filedAs(p);
      if (cls.categoryType === label) hok++;
      else report.sections.push({ house, id: p.id, title: p.title, filedAs: label, classifier: cls.categoryType, confidence: cls.confidence, reasons: cls.reasons });
      if (label === 'bundle' && cls.categoryType === 'bundle' && Number(p.bottleCount) !== cls.bottleCount) {
        report.bottles.push({ house, id: p.id, title: p.title, ours: Number(p.bottleCount) || 1, classifier: cls.bottleCount, reasons: cls.reasons.filter(r => /components|count|size/.test(r)) });
      }
    }
    console.log(`${house.padEnd(10)} ${hok}/${hn} agree (${(hok / hn * 100).toFixed(1)}%)`);
    n += hn; ok += hok;
  }
  console.log(`overall    ${ok}/${n} (${(ok / n * 100).toFixed(1)}%) | section disagreements ${report.sections.length} | set bottle counts that differ ${report.bottles.length}`);
  fs.writeFileSync(path.join(__dirname, 'class-audit.json'), JSON.stringify(report, null, 1) + '\n');
}

main();
