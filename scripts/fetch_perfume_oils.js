const fs = require('fs');

async function fetchPerfumeOils() {
  const catId = '1307407992';
  let nextUrl = `https://api.salla.dev/store/v1/products?filters[category_id]=${catId}&limit=30`;
  const products = [];
  let page = 1;

  while (nextUrl) {
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
      console.log('Error on page', page, res.status);
      break;
    }

    const json = await res.json();
    const items = json.data || [];
    if (items.length === 0) break;

    items.forEach(it => {
      const sarPrice = typeof it.price === 'object' ? it.price?.amount : it.price;
      const regularPrice = typeof it.regular_price === 'object' ? it.regular_price?.amount : it.regular_price;
      const sarNum = parseFloat(sarPrice) || 30;
      const baseJod = Math.round(sarNum / 5.29);
      const finalJod = baseJod + 12;

      products.push({
        id: String(it.id),
        name: it.name,
        sarPrice: sarNum,
        regularSarPrice: parseFloat(regularPrice) || sarNum,
        baseJod: baseJod,
        finalJod: finalJod,
        url: it.url,
        originalImage: it.original_image || it.image?.url,
        thumbnail: it.image?.url,
        description: it.description || '',
        isAvailable: it.is_available !== false
      });
    });

    console.log(`Page ${page}: got ${items.length} items (Total: ${products.length})`);
    nextUrl = json.cursor?.next || null;
    page++;
  }

  console.log(`\n🎉 Total Perfume Oils fetched: ${products.length}`);
  products.forEach(p => console.log(` - [${p.sarPrice} SAR -> ${p.finalJod} JOD] ${p.name} (img: ${p.originalImage ? 'OK' : 'None'})`));

  fs.writeFileSync('./data/ghalati_perfume_oils_raw.json', JSON.stringify(products, null, 2), 'utf8');
}

fetchPerfumeOils().catch(console.error);
