async function findHonest() {
  // Let's test search with english or arabic or salla dev
  const queries = ['honest', 'هونست', 'عطر هونست'];
  for (const q of queries) {
    try {
      const res = await fetch(`https://api.salla.dev/store/v1/products?q=${encodeURIComponent(q)}&limit=50`, {
        headers: {
          'Store-Identifier': '1939633486',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      const data = await res.json();
      console.log(`Query "${q}":`, (data.data || []).map(p => ({ id: p.id, name: p.name })));
    } catch (e) {
      console.error(e.message);
    }
  }

  // Also let's check sitemap or all product IDs from Salla
  console.log('\nChecking all salla products pagination...');
  let page = 1;
  let allFound = [];
  let nextUrl = 'https://api.salla.dev/store/v1/products?limit=50';
  while (nextUrl && page <= 6) {
    const res = await fetch(nextUrl, {
      headers: {
        'Store-Identifier': '1939633486',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const data = await res.json();
    if (!data.data || data.data.length === 0) break;
    for (const p of data.data) {
      if (p.name.includes('هونست') || (p.description && p.description.includes('هونست')) || (p.promotion_title && p.promotion_title.includes('هونست'))) {
        console.log('FOUND HONEST IN SALLA:', p);
      }
    }
    console.log(`Page ${page}: got ${data.data.length} items`);
    nextUrl = data.cursor ? data.cursor.next : null;
    page++;
  }
}

findHonest();
