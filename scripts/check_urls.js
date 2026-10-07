const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('data/ghalati_complete_store_catalog.json', 'utf8'));
const sitemap = JSON.parse(fs.readFileSync('data/ghalati_sitemap_products.json', 'utf8'));

console.log('Catalog entries:', catalog.length);

const sitemapIds = new Set();
sitemap.forEach(s => {
  const m = s.url && s.url.match(/\/p(\d+)/);
  if (m) sitemapIds.add(m[1]);
});

const catalogMap = new Map();
catalog.forEach(c => {
  if (c.id) catalogMap.set(String(c.id), c);
  if (c.url) {
    const m = c.url.match(/\/p(\d+)/);
    if (m) catalogMap.set(m[1], c);
  }
});

console.log('Catalog mapped count:', catalogMap.size);

const notInSitemap = [];
perfumes.forEach(p => {
  const m = p.url && p.url.match(/\/p(\d+)/);
  const pid = m ? m[1] : null;
  if (!sitemapIds.has(pid)) {
    const catItem = catalogMap.get(pid);
    notInSitemap.push({
      id: p.id,
      title: p.title,
      url: p.url,
      inCatalog: !!catItem,
      catUrl: catItem ? catItem.url : null
    });
  }
});

console.log(`Total perfumes not in sitemap: ${notInSitemap.length}`);
console.log('Sample not in sitemap (first 10):');
console.log(JSON.stringify(notInSitemap.slice(0, 10), null, 2));
