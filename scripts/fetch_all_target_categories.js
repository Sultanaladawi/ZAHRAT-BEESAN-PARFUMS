const fs = require('fs');

async function fetchCategory(catId, catSlug, catLabel) {
  let page = 1;
  const products = [];
  while (true) {
    const url = `https://api.salla.dev/store/v1/products?filters[category_id]=${catId}&page=${page}&limit=30`;
    try {
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
      if (!res.ok) break;
      const json = await res.json();
      const items = json.data || [];
      if (items.length === 0) break;
      items.forEach(it => {
        products.push({
          id: it.id,
          name: it.name,
          categoryLabel: catLabel,
          categorySlug: catSlug,
          price: it.price,
          regular_price: it.regular_price,
          url: it.url,
          original_image: it.original_image,
          image_url: it.image?.url,
          description: it.description,
          is_available: it.is_available
        });
      });
      if (items.length < 30) break;
      page++;
    } catch (e) {
      console.error(`Error fetching ${catLabel} page ${page}:`, e.message);
      break;
    }
  }
  console.log(`Fetched [${catLabel}]: ${products.length} products`);
  return products;
}

async function run() {
  const categories = [
    { id: '1377526805', slug: 'bakhoor', label: 'البخور والمعمول الفاخر' },
    { id: '103216922', slug: 'bundles', label: 'باقات الإهداء والمجموعات' },
    { id: '540837480', slug: 'royal', label: 'عطور النخبة الملكية (نصف السعر)' },
    { id: '1266077781', slug: 'musk', label: 'مجموعة المسك الفاخر' },
    { id: '1657519607', slug: 'national-day', label: 'باقات اليوم الوطني والتراث' }
  ];

  const allProducts = [];
  const seenIds = new Set();

  for (const c of categories) {
    const prods = await fetchCategory(c.id, c.slug, c.label);
    for (const p of prods) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        allProducts.push(p);
      }
    }
  }

  console.log(`\n🎉 Total unique products fetched across all target categories: ${allProducts.length}`);
  fs.writeFileSync('./data/ghalati_all_sections_raw.json', JSON.stringify(allProducts, null, 2), 'utf8');
}

run().catch(console.error);
