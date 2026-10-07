const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

async function testBatch() {
  const sample = perfumes.slice(0, 15);
  for (const p of sample) {
    try {
      const res = await fetch(p.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en;q=0.9'
        }
      });
      const html = await res.text();
      const hasDetails = html.includes('id="details_table"');
      const finalUrl = res.url;
      console.log(`[${p.id}] status=${res.status} hasDetails=${hasDetails} redirect=${finalUrl !== p.url ? finalUrl : 'no'}`);
    } catch (e) {
      console.log(`[${p.id}] ERROR: ${e.message}`);
    }
  }
}

testBatch();
