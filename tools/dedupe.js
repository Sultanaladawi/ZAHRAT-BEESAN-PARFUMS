#!/usr/bin/env node
/**
 * Hide duplicate products and tell look-alike ones apart.
 *
 *   node tools/dedupe.js                        # apply the approved groups
 *   node tools/dedupe.js --dry                  # same, change nothing
 *   node tools/dedupe.js --proposals out.json   # list every suspected group, change nothing
 *   node tools/dedupe.js --approve ID[,HIDDEN>KEPT,...]   # approve groups (any id of the group) or pairs, and apply
 *
 * Suppliers sometimes list the same product twice (often an old sold-out copy
 * next to the live one), and some sell a perfume in several sizes where only
 * one size is in stock. A hidden copy keeps all its data and gets
 * `duplicateOf: "<id of the product shown instead>"`; the store, search,
 * sitemap and product pages leave it out (its /p/ page redirects to the kept
 * one), and the dashboard shows it marked as a duplicate.
 *
 * Nothing is hidden or renamed unless it is in tools/dedupe-approved.json:
 *   { "hide": { "<hidden id>": "<kept id>" }, "rename": { "<id>": ["ar title", "en title"] } }
 * Every run starts from scratch, so when stock changes (the sold-out copy
 * comes back, the kept one sells out) the next run picks again. It runs after
 * the hourly supplier sync.
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'public', 'data');
const APPROVED = path.join(__dirname, 'dedupe-approved.json');
const FILES = fs.readdirSync(DATA).filter(f => /_perfumes\.json$/.test(f) || f === 'perfumes.json');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const argOf = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };

// Arabic-aware name for matching: no diacritics, one alef/ta/ya form, no
// leading "عطر", sizes written one way. (JS \b does not work with Arabic.)
const norm = s => String(s || '')
  .replace(/[ً-ْـ]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/(\d)\s*(مل|ml)/gi, '$1 مل')
  .replace(/^\s*عطر\s+/, '')
  .replace(/[«»"'()]/g, ' ')
  .replace(/\s+/g, ' ').trim().toLowerCase();
const SIZE_RE = /[-–—]?\s*\d+(?:[.,]\d+)?\s*مل(?=\s|$)/g;
const baseName = p => norm(p.title).replace(SIZE_RE, ' ').replace(/\s+/g, ' ').trim();
const inStock = p => p.isAvailable !== false && p.status !== 'out';
const single = p => (Number(p.bottleCount) || 1) === 1 && !/bundle|gift_set/.test(p.categoryType || '');
const sizeOf = p => { const m = norm(p.title).match(/(\d+(?:[.,]\d+)?)\s*مل/) || String((p.specs || {}).size || '').match(/(\d+)\s*مل/); return m ? m[1] : ''; };

const load = () => FILES.map(file => {
  const raw = fs.readFileSync(path.join(DATA, file), 'utf8');
  return { file, raw, items: JSON.parse(raw) };
});

// ── Proposals: every suspected group, with a recommendation ──
function proposals(houses) {
  const groups = [];
  for (const { file, items } of houses) {
    const claimed = new Set();
    // The same name listed more than once: "same" when size, price and contents
    // also match, "same-name" when they differ (then it may be another product).
    const byName = new Map();
    for (const p of items) {
      const k = norm(p.title);
      if (!byName.has(k)) byName.set(k, []);
      byName.get(k).push(p);
    }
    for (const g of byName.values()) {
      if (g.length < 2) continue;
      g.forEach(p => claimed.add(p.id));
      const sig = p => `${norm((p.specs || {}).size)}|${Number(p.sarPrice) || 0}|${Number(p.bottleCount) || 1}`;
      const same = g.every(p => sig(p) === sig(g[0]));
      groups.push({ file, kind: same ? 'same' : 'same-name', note: same ? 'same name, size, price and contents' : 'same name, price or contents differ', items: g });
    }
    // One perfume in several sizes where a sold-out size sits next to an in-stock one.
    const byBase = new Map();
    for (const p of items) {
      if (claimed.has(p.id) || !single(p)) continue;
      const k = baseName(p);
      if (!k) continue;
      if (!byBase.has(k)) byBase.set(k, []);
      byBase.get(k).push(p);
    }
    for (const g of byBase.values()) {
      if (g.length < 2 || !g.some(inStock) || g.every(inStock)) continue;
      groups.push({ file, kind: 'size', note: 'sold-out size next to an in-stock size', items: g });
    }
  }
  return groups.map(g => {
    const keep = g.items.find(inStock) || g.items[0];
    return {
      file: g.file, kind: g.kind, note: g.note, keep: keep.id,
      items: g.items.map(p => ({
        id: p.id, title: p.title, size: sizeOf(p) || (p.specs || {}).size || '', sar: p.sarPrice, jod: p.finalJod,
        inStock: inStock(p), url: p.url, image: p.image, bottleCount: p.bottleCount || 1,
      })),
    };
  });
}

// ── Apply the approved groups ──
function readApproved() {
  try { return JSON.parse(fs.readFileSync(APPROVED, 'utf8')); } catch (e) { return { hide: {}, rename: {} }; }
}

function apply(houses, approved) {
  const report = [];
  const hideOf = new Map(Object.entries(approved.hide || {})); // hidden → kept
  for (const h of houses) {
    const byId = new Map(h.items.map(p => [String(p.id), p]));
    for (const p of h.items) delete p.duplicateOf;
    for (const [id, [ar, en]] of Object.entries(approved.rename || {})) {
      const p = byId.get(id);
      if (p && p.title !== ar) { report.push(`${h.file}: rename ${id} "${p.title}" → "${ar}"`); p.title = ar; if (en) p.titleEn = en; }
    }
    // Group every approved pair around its kept product; if the kept copy is
    // sold out but a hidden one is in stock, that one is shown instead.
    const groups = new Map();
    for (const [hidden, kept] of hideOf) {
      if (!byId.has(hidden) || !byId.has(kept)) continue;
      if (!groups.has(kept)) groups.set(kept, new Set([kept]));
      groups.get(kept).add(hidden);
    }
    for (const [kept, ids] of groups) {
      const members = [...ids].map(i => byId.get(i));
      const shown = inStock(byId.get(kept)) ? byId.get(kept) : (members.find(inStock) || byId.get(kept));
      for (const p of members) {
        if (p === shown) continue;
        p.duplicateOf = String(shown.id);
        report.push(`${h.file}: hide ${p.id} "${p.title}" → ${shown.id}`);
      }
    }
    const out = JSON.stringify(h.items, null, 2) + (h.raw.endsWith('\n') ? '\n' : '');
    if (!dry && out !== h.raw) fs.writeFileSync(path.join(DATA, h.file), out);
  }
  return report;
}

const houses = load();
const propOut = argOf('--proposals');
if (propOut) {
  const groups = proposals(houses);
  fs.writeFileSync(propOut, JSON.stringify(groups, null, 2));
  console.log(`${groups.length} suspected groups written to ${propOut}`);
  process.exit(0);
}

const approved = readApproved();
const approve = argOf('--approve');
if (approve) {
  // "HIDDEN>KEPT" approves one pair; a bare id approves its whole suspected group.
  const tokens = approve.split(',').map(s => s.trim()).filter(Boolean);
  for (const t of tokens.filter(t => t.includes('>'))) { const [h, k] = t.split('>'); approved.hide[h] = k; }
  const want = new Set(tokens.filter(t => !t.includes('>')));
  for (const g of proposals(houses)) {
    if (!g.items.some(p => want.has(p.id))) continue;
    for (const p of g.items) if (p.id !== g.keep) approved.hide[p.id] = g.keep;
  }
  fs.writeFileSync(APPROVED, JSON.stringify(approved, null, 2) + '\n');
}
const report = apply(houses, approved);
console.log(report.join('\n') || 'nothing to change');
console.log(`\n${report.filter(r => r.includes(': hide ')).length} hidden, ${report.filter(r => r.includes(': rename ')).length} renamed${dry ? ' (dry run)' : ''}`);
