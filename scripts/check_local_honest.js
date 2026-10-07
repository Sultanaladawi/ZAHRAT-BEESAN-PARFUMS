const fs = require('fs');

const files = [
  'data/ghalati_sitemap_products.json',
  'data/ghalati_all_sections_raw.json',
  'data/all_catalog_targets.json',
  'data/ghalati_products.json'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const hasHonest = content.toLowerCase().includes('honest') || content.includes('هونست');
    console.log(`${f}: has honest = ${hasHonest}`);
  }
});
