const fs = require('fs');

async function fetchCategory(name, catUrl) {
  console.log(`\n=== Category: ${name} (${catUrl}) ===`);
  const products = [];
  for (let page = 1; page <= 4; page++) {
    const url = `${catUrl}?page=${page}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await res.text();
      const regex = /href="(https:\/\/ghalati\.com\/ar\/[^"]+\/p\d+)"/g;
      const pageUrls = new Set();
      let m;
      while ((m = regex.exec(html)) !== null) {
        pageUrls.add(decodeURIComponent(m[1]));
      }
      if (pageUrls.size === 0) break;
      for (const u of pageUrls) {
        if (!products.includes(u)) products.push(u);
      }
    } catch (e) {
      console.error(`Error fetching page ${page}:`, e.message);
      break;
    }
  }
  console.log(`Found ${products.length} products in ${name}:`);
  products.forEach(p => console.log('  ->', p));
  return products;
}

async function run() {
  const cats = [
    { name: 'المعمول', url: 'https://ghalati.com/ar/%D8%A7%D9%84%D9%85%D8%B9%D9%85%D9%88%D9%84/c1783238196' },
    { name: 'البخور', url: 'https://ghalati.com/ar/%D8%A7%D9%84%D8%A8%D8%AE%D9%88%D8%B1/c1248116412' },
    { name: 'المجموعات', url: 'https://ghalati.com/ar/%D8%A7%D9%84%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A7%D8%AA/c1435381319' },
    { name: 'المسك', url: 'https://ghalati.com/ar/%D8%A7%D9%84%D9%85%D8%B3%D9%83/c1266077781' }
  ];

  const results = {};
  for (const c of cats) {
    results[c.name] = await fetchCategory(c.name, c.url);
  }

  fs.writeFileSync('./data/ghalati_categories_dump.json', JSON.stringify(results, null, 2), 'utf8');
}

run().catch(console.error);
