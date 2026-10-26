#!/usr/bin/env node
/**
 * Apply the product corrections in tools/product-fixes.json to the catalogs.
 *
 *   node tools/apply-fixes.js          # apply
 *   node tools/apply-fixes.js --dry    # list what would change
 *
 * Each entry is checked against what the supplier itself says (its product
 * name, SKU and description; see tools/product-facts.js): the real size of a
 * bottle, what a set contains, men's or women's. Entries can set
 *   title / titleEn      the name shown
 *   size / sizeEn        the size shown in the product details: a number
 *                        means "<n> مل" / "<n> ml", a string is used as is
 *   bottleCount          bottles in the set; the delivery fee, the price and
 *                        the "was" price are recomputed like everywhere else
 *   overviewFix          [from, to] text replaced in the description
 *   why                  where the correction comes from (kept for review)
 * and mark the product `detailsFixed: true`. The supplier sync only touches
 * prices, stock, offers and photos, so these corrections stay. Running it
 * again changes nothing.
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'public', 'data');
const dry = process.argv.includes('--dry');
const fixes = JSON.parse(fs.readFileSync(path.join(__dirname, 'product-fixes.json'), 'utf8'));
const FILES = fs.readdirSync(DATA).filter(f => /_perfumes\.json$/.test(f) || f === 'perfumes.json');
const SAR_PER_JOD = 5.29;

// Same rules as the store (lib/fees.js): sets, small oils, mini perfumes, the rest.
const fees = require('../lib/fees');

let changed = 0;
const left = new Set(Object.keys(fixes));
for (const file of FILES) {
  const full = path.join(DATA, file);
  const raw = fs.readFileSync(full, 'utf8');
  const items = JSON.parse(raw);
  let touched = false;
  for (const p of items) {
    const f = fixes[p.id];
    if (!f) continue;
    left.delete(p.id);
    const before = JSON.stringify(p);
    if (f.title) p.title = f.title;
    if (f.titleEn) p.titleEn = f.titleEn;
    if (f.size !== undefined) {
      p.specs = { ...(p.specs || {}), size: typeof f.size === 'number' ? `${f.size} مل` : f.size };
      p.specsEn = { ...(p.specsEn || {}), size: typeof f.size === 'number' ? `${f.size} ml` : (f.sizeEn || f.size) };
    }
    if (f.overviewFix) {
      for (const key of ['overview', 'overviewEn']) {
        if (typeof p[key] === 'string') p[key] = p[key].split(f.overviewFix[0]).join(f.overviewFix[1]);
      }
    }
    if (f.bottleCount && Number(p.bottleCount) !== f.bottleCount) {
      p.bottleCount = f.bottleCount;
      const fee = fees.feeFor(p);
      p.feeJod = fee;
      p.finalJod = (Number(p.baseJod) || Math.round(p.sarPrice / SAR_PER_JOD)) + fee;
      p.origJod = p.origSarPrice > p.sarPrice ? Math.round(p.origSarPrice / SAR_PER_JOD) + fee : p.finalJod;
    }
    p.detailsFixed = true;
    if (JSON.stringify(p) !== before) { changed++; touched = true; }
  }
  if (touched && !dry) fs.writeFileSync(full, JSON.stringify(items, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
}
console.log(`${dry ? 'would change' : 'changed'} ${changed} products`);
if (left.size) console.log('ids not found:', [...left].join(', '));
