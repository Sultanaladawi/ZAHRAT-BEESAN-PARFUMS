const fs = require('fs');
const { parseProductPage } = require('./parse_ghalati_product.js');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

console.log(`Starting live sync for ${perfumes.length} products...`);

async function fetchOne(p, index) {
  try {
    const res = await fetch(p.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en;q=0.9'
      }
    });

    const finalUrl = res.url;
    const isRedirectToHome = finalUrl === 'https://ghalati.com/ar/' || finalUrl === 'https://ghalati.com/ar';

    if (!res.ok || isRedirectToHome) {
      return {
        id: p.id,
        success: false,
        status: res.status,
        redirected: isRedirectToHome,
        url: p.url,
        finalUrl
      };
    }

    const html = await res.text();
    const parsed = parseProductPage(html, p);

    return {
      id: p.id,
      success: true,
      status: res.status,
      url: p.url,
      finalUrl,
      parsed
    };
  } catch (err) {
    return {
      id: p.id,
      success: false,
      error: err.message,
      url: p.url
    };
  }
}

async function run() {
  const results = [];
  const chunkSize = 5;

  for (let i = 0; i < perfumes.length; i += chunkSize) {
    const chunk = perfumes.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((p, idx) => fetchOne(p, i + idx))
    );
    results.push(...chunkResults);
    const successCount = results.filter(r => r.success).length;
    console.log(`Progress: ${results.length}/${perfumes.length} (Success: ${successCount})`);
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync('data/live_scraped_ghalati.json', JSON.stringify(results, null, 2), 'utf8');
  console.log(`Finished! Total: ${results.length}, Success: ${results.filter(r => r.success).length}, Failed: ${results.filter(r => !r.success).length}`);
}

run();
