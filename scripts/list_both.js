const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('data/ghalati_complete_store_catalog.json', 'utf8'));

console.log('=== Current Store Products ===');
perfumes.forEach(p => {
  console.log(`- [${p.id}] ${p.name} (${p.categoryType || 'perfume'})`);
});

console.log('\n=== Scraped Catalog Items ===');
catalog.forEach((c, idx) => {
  const p = typeof c.price === 'object' ? c.price.amount : c.price;
  console.log(`${idx + 1}. [${c.id}] ${c.name} | Price: ${p}`);
});
