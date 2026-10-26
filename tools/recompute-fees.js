#!/usr/bin/env node
/**
 * Keep every single-bottle product's fee in line with lib/fees.js
 * (finalJod = baseJod + feeJod; "was" price keeps the same fee).
 *
 *   node tools/recompute-fees.js          # apply
 *   node tools/recompute-fees.js --dry    # list what would change
 *
 * Only single-bottle products are touched, and only when the stored fee differs
 * from the rule, so it is safe to run after every sync (it does nothing when
 * the catalog is already right). To re-price all mini perfumes, change
 * MINI_FEE_JOD in lib/fees.js and public/js/app.js, then run this.
 */
const fs = require('fs');
const path = require('path');
const fees = require('../lib/fees');

const DATA = path.join(__dirname, '..', 'public', 'data');
const dry = process.argv.includes('--dry');
const SAR_PER_JOD = 5.29;
let total = 0;

for (const file of fs.readdirSync(DATA).filter(f => /_perfumes\.json$/.test(f) || f === 'perfumes.json')) {
  const full = path.join(DATA, file);
  const raw = fs.readFileSync(full, 'utf8');
  const items = JSON.parse(raw);
  let touched = 0;
  for (const p of items) {
    if ((Number(p.bottleCount) || 1) > 1) continue;
    const fee = fees.feeFor(p);
    const old = Number(p.feeJod) || fees.BASE_FEE_JOD;
    if (fee === old) continue;
    const base = Number(p.baseJod) || Math.round(Number(p.sarPrice) / SAR_PER_JOD);
    const before = { fee: old, final: p.finalJod, orig: p.origJod };
    p.feeJod = fee;
    p.finalJod = base + fee;
    p.origJod = Number(p.origSarPrice) > Number(p.sarPrice) ? Math.round(Number(p.origSarPrice) / SAR_PER_JOD) + fee : p.finalJod;
    touched++;
    console.log(`${file.padEnd(24)} ${p.id.padEnd(32)} ${before.fee}→${fee}  ${before.final}→${p.finalJod}  ${(p.title || '').slice(0, 44)}${p.isAvailable === false ? ' (out)' : ''}`);
  }
  total += touched;
  if (touched && !dry) fs.writeFileSync(full, JSON.stringify(items, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
}
console.log(`${dry ? 'would change' : 'changed'} ${total} products`);
