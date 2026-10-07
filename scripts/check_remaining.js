const fs = require('fs');

const current = require('../public/data/perfumes.json');
const all = require('../data/ghalati_complete_store_catalog.json');

console.log(`Current live perfumes in Zahrat Beesan store: ${current.length}`);
console.log(`Total catalog extracted from Ghalati: ${all.length}`);

function normalize(s) {
  return s.replace(/^عطر\s+/, '').replace(/^بخور\s+/, '').replace(/^معمول\s+/, '').replace(/^باقة\s+/, '').replace(/^مجموعة\s+/, '').replace(/^بكج\s+/, '').replace(/[\s\-_]/g, '').trim();
}

const remaining = all.filter(item => {
  const normItem = normalize(item.name);
  return !current.some(c => {
    const normCur = normalize(c.title);
    return normCur.includes(normItem) || normItem.includes(normCur);
  });
});

console.log(`\nRemaining products to onboard: ${remaining.length}`);
console.log('\nBreakdown of remaining products by section:');
const bySec = {};
remaining.forEach(r => {
  bySec[r.categoryLabel] = bySec[r.categoryLabel] || [];
  bySec[r.categoryLabel].push(r);
});

for (const [sec, list] of Object.entries(bySec)) {
  console.log(`\n=== ${sec} (${list.length} products) ===`);
  list.forEach(p => console.log(`  - [${p.sarPrice} SAR -> ${p.jodPrice} JOD] ${p.name}`));
}
