const https = require('https');
const fs = require('fs');

async function checkSitemap(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const matches = [...data.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
        resolve(matches);
      });
    }).on('error', () => resolve([]));
  });
}

function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        // If it redirects to homepage or /ar or /ar/, then product does not exist
        if (loc === '/' || loc === '/ar' || loc === '/ar/' || loc.endsWith('laverne.com/ar') || loc.endsWith('laverne.com/ar/')) {
          return resolve({ status: res.statusCode, redirectedHome: true, url });
        }
        if (!loc.startsWith('http')) loc = 'https://laverne.com' + loc;
        return fetchUrl(loc).then(resolve);
      }
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => resolve({ status: res.statusCode, html, url }));
    });
    req.on('error', () => resolve({ status: 500, error: true, url }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 408, timeout: true, url });
    });
  });
}

async function main() {
  console.log('Fetching sitemaps...');
  const s2 = await checkSitemap('https://laverne.com/ar/sitemap-2.xml');
  console.log('Total URLs in sitemap 2:', s2.length);

  const results = [];
  const activeProducts = [];
  const concurrency = 10;
  
  for (let i = 0; i < s2.length; i += concurrency) {
    const chunk = s2.slice(i, i + concurrency);
    const chunkRes = await Promise.all(chunk.map(fetchUrl));
    for (const r of chunkRes) {
      if (r.status === 200 && r.html && !r.redirectedHome) {
        // Check if page actually contains product
        if (r.html.includes('"@type":"Product"') || r.html.includes('"@type": "Product"')) {
          activeProducts.push(r);
        }
      }
    }
    process.stdout.write(`Checked ${Math.min(i + concurrency, s2.length)}/${s2.length} | Found active: ${activeProducts.length}\r`);
  }

  console.log(`\nScan complete! Found ${activeProducts.length} active products out of ${s2.length} URLs.`);

  // Save raw html list or urls
  fs.writeFileSync('data/laverne_active_urls.json', JSON.stringify(activeProducts.map(p => p.url), null, 2));
  console.log('Saved data/laverne_active_urls.json');
}

main().catch(console.error);
