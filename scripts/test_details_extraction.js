const fs = require('fs');

async function testExtraction() {
  const data = JSON.parse(fs.readFileSync('data/remaining_53_scraped.json', 'utf8'));
  const testItems = [data[1], data[7], data[15], data[21], data[30], data[44], data[46]];

  for (const item of testItems) {
    console.log(`\nTesting extraction for: ${item.name} (${item.url})`);
    try {
      const res = await fetch(item.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await res.text();
      const match = html.match(/id="details_table"[^>]*>([\s\S]*?)<\/div>/i);
      if (match) {
        console.log('SUCCESS! Found details_table:');
        console.log(match[1].replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8).join('\n'));
      } else {
        console.log('No details_table found. Checking fallback...');
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

testExtraction();
