const fs = require('fs');

async function parseHonest() {
  const url = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%87%D9%88%D9%86%D8%B3%D8%AA/p864997206';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const html = await res.text();
  
  // Look for product-details or article or description text
  fs.writeFileSync('scripts/honest_dump.html', html, 'utf8');
  console.log('Saved honest_dump.html');
}

parseHonest();
