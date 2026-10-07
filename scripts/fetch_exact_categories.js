const fs = require('fs');

async function fetchAllCategory(catId, catName) {
  let page = 1;
  const products = [];
  while (true) {
    const url = `https://api.salla.dev/store/v1/products?filters[category_id]=${catId}&page=${page}&limit=30`;
    const res = await fetch(url, {
      headers: {
        'Origin': 'https://ghalati.com',
        'Referer': 'https://ghalati.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'App-Store-Id': '1939633486',
        'Store-Identifier': '1939633486',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    if (!res.ok) {
      console.log(`Error on page ${page}:`, res.status);
      break;
    }
    const json = await res.json();
    const items = json.data || [];
    if (items.length === 0) break;
    items.forEach(it => {
      products.push({
        id: it.id,
        name: it.name,
        price: it.price?.amount,
        regular_price: it.regular_price?.amount,
        url: it.url,
        image: it.main_image,
        images: (it.images || []).map(img => img.url),
        description: it.description,
        is_available: it.is_available,
        promotion: it.promotion
      });
    });
    console.log(`Page ${page}: got ${items.length} items`);
    if (items.length < 30) break;
    page++;
  }
  console.log(`\n=== Category: ${catName} (${catId}) -> Total ${products.length} products ===`);
  products.forEach(p => console.log(`  - [${p.price} SAR] ${p.name} (Available: ${p.is_available}) -> ${p.url}`));
  return products;
}

async function run() {
  const bakhoor = await fetchAllCategory('1377526805', 'الأجواء الساحرة (بخور ومعمول)');
  const bundles = await fetchAllCategory('103216922', 'الإهداء فاخر (باقات ومجموعات)');

  fs.writeFileSync('./data/ghalati_bakhoor_exact.json', JSON.stringify(bakhoor, null, 2), 'utf8');
  fs.writeFileSync('./data/ghalati_bundles_exact.json', JSON.stringify(bundles, null, 2), 'utf8');
  console.log('\nData saved to ./data/ghalati_bakhoor_exact.json and ./data/ghalati_bundles_exact.json');
}

run().catch(console.error);
