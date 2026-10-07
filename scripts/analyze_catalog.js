const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('data/ghalati_complete_store_catalog.json', 'utf8'));

console.log('Current perfumes count:', perfumes.length);
console.log('Total catalog count:', catalog.length);

const clean = (s) => (s || '').replace(/^(عطر|بخور|معمول|تولة|زيت|باقة|مجموعة|بكج)\s+/g, '').replace(/[\s\u200B-\u200D\uFEFF]+/g, ' ').trim().toLowerCase();

const perfumeMap = new Set();
perfumes.forEach(p => {
  perfumeMap.add((p.name || '').trim());
  perfumeMap.add((p.nameAr || '').trim());
  perfumeMap.add(clean(p.name));
  perfumeMap.add(clean(p.nameAr));
});

const missing = [];
for (const item of catalog) {
  const rawName = (item.name || '').trim();
  const cleaned = clean(rawName);
  
  const exactFound = perfumes.some(p => {
    return (p.name || '').trim() === rawName || (p.nameAr || '').trim() === rawName || clean(p.name) === cleaned || clean(p.nameAr) === cleaned;
  });

  if (!exactFound) {
    missing.push(item);
  }
}

console.log('Actually missing items count:', missing.length);
missing.forEach((m, idx) => {
  const p = typeof m.price === 'object' ? (m.price.amount || m.price) : m.price;
  console.log(`${idx + 1}. [ID: ${m.id}] "${m.name}" | ${p} SAR | ${m.url}`);
});
