const fs = require('fs');

const sitemap = JSON.parse(fs.readFileSync('data/ghalati_sitemap_products.json', 'utf8'));
const honest = sitemap.filter(item => {
  const str = JSON.stringify(item).toLowerCase();
  return str.includes('honest') || str.includes('هونست');
});

console.log('Honest in sitemap:', JSON.stringify(honest, null, 2));
