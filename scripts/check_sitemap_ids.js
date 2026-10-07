const fs = require('fs');

const sitemap = JSON.parse(fs.readFileSync('data/ghalati_sitemap_products.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('data/ghalati_complete_store_catalog.json', 'utf8'));
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

console.log('Sitemap total:', sitemap.length);
console.log('Catalog total:', catalog.length);
console.log('Current perfumes:', perfumes.length);

// Extract all IDs from sitemap
const sitemapIds = sitemap.map(s => {
  const m = s.url.match(/\/p(\d+)/);
  return m ? m[1] : null;
}).filter(Boolean);

console.log('Unique IDs in sitemap:', new Set(sitemapIds).size);
