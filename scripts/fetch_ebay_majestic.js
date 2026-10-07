const fs = require('fs');

async function run() {
  try {
    const res = await fetch('https://www.ebay.com/itm/298637454274', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const urls = html.match(/https:\/\/i\.ebayimg\.com\/images\/g\/[^\/"]+\/s-l\d+\.jpg/g) || [];
    console.log('Unique ebay images:', [...new Set(urls)]);
  } catch(e) {
    console.error(e);
  }
}

run();
