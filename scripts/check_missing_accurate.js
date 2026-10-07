const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('data/ghalati_complete_store_catalog.json', 'utf8'));

console.log('Total store items:', perfumes.length);
console.log('Total scraped catalog items:', catalog.length);

const normalize = (str) => {
  return (str || '')
    .replace(/[^\u0621-\u064A0-9a-zA-Z]/g, '')
    .replace(/(ال|عطر|بخور|معمول|تولة|زيت|باقة|مجموعة|بكج)/g, '')
    .toLowerCase();
};

const missing = [];
const present = [];

catalog.forEach((item) => {
  const cNorm = normalize(item.name);
  const found = perfumes.find((p) => {
    // Check URL id or matching name
    const pUrlMatch = p.url && item.url && p.url.includes(item.id);
    const pNormTitle = normalize(p.title);
    const pNormId = normalize(p.id);
    return pUrlMatch || pNormTitle === cNorm || pNormId === cNorm || (cNorm.length > 3 && pNormTitle.includes(cNorm));
  });

  if (found) {
    present.push({ catalog: item.name, matched: found.title, id: found.id });
  } else {
    missing.push(item);
  }
});

console.log(`\nMatched: ${present.length} items`);
console.log(`\nMissing from store: ${missing.length} items\n`);

missing.forEach((m, idx) => {
  console.log(`${idx + 1}. [ID: ${m.id}] ${m.name} | ${m.sarPrice} SAR -> ${m.jodPrice} JOD | ${m.categoryLabel}`);
});
