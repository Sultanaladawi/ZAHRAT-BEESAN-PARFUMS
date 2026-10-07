const fs = require('fs');

async function fetchCategoryAll(catId, catSlug, catLabel) {
  let nextUrl = `https://api.salla.dev/store/v1/products?filters[category_id]=${catId}&limit=30`;
  const products = [];
  let pageNum = 1;

  while (nextUrl) {
    try {
      const res = await fetch(nextUrl, {
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
        console.error(`Error fetching ${catLabel} page ${pageNum}:`, res.status);
        break;
      }

      const json = await res.json();
      const items = json.data || [];
      if (items.length === 0) break;

      items.forEach(it => {
        const sarPrice = typeof it.price === 'object' ? it.price?.amount : it.price;
        const regularPrice = typeof it.regular_price === 'object' ? it.regular_price?.amount : it.regular_price;
        const sarNum = parseFloat(sarPrice) || 0;
        const jodPrice = Math.round(sarNum / 5.29) + 12;

        products.push({
          id: String(it.id),
          name: it.name,
          categorySlug: catSlug,
          categoryLabel: catLabel,
          sarPrice: sarNum,
          regularSarPrice: parseFloat(regularPrice) || sarNum,
          jodPrice: jodPrice,
          url: it.url,
          originalImage: it.original_image || it.image?.url,
          thumbnail: it.image?.url,
          description: it.description || '',
          isAvailable: it.is_available !== false
        });
      });

      console.log(`[${catLabel}] Page ${pageNum}: fetched ${items.length} items (Total so far: ${products.length})`);
      nextUrl = json.cursor?.next || null;
      pageNum++;
    } catch (e) {
      console.error(`Error fetching ${catLabel}:`, e.message);
      break;
    }
  }

  return products;
}

async function run() {
  const categories = [
    { id: '1389534759', slug: 'bestsellers-summer', label: 'العطور الأكثر طلباً والانتعاش الصيفي' },
    { id: '540837480', slug: 'royal-elite', label: 'عطور النخبة الملكية (نصف السعر)' },
    { id: '103216922', slug: 'gift-sets', label: 'باقات الإهداء والمجموعات الفاخرة' },
    { id: '1377526805', slug: 'bakhoor-oud', label: 'قسم البخور والمعمول والعود الملكي' },
    { id: '1657519607', slug: 'heritage-national', label: 'باقات التراث واليوم الوطني' }
  ];

  const catalog = [];
  const seenIds = new Set();
  const summaryByCategory = {};

  for (const c of categories) {
    const prods = await fetchCategoryAll(c.id, c.slug, c.label);
    summaryByCategory[c.label] = prods.length;
    for (const p of prods) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        catalog.push(p);
      }
    }
  }

  console.log('\n=============================================');
  console.log('🎉 TOTAL UNIQUE PRODUCTS EXTRACTED:', catalog.length);
  console.log('=============================================');
  for (const [cat, count] of Object.entries(summaryByCategory)) {
    console.log(`  - ${cat}: ${count} products`);
  }

  fs.writeFileSync('./data/ghalati_complete_store_catalog.json', JSON.stringify(catalog, null, 2), 'utf8');
  console.log('\nSaved full catalog to ./data/ghalati_complete_store_catalog.json');
}

run().catch(console.error);
