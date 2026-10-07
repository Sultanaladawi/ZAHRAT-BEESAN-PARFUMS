const fs = require('fs');

async function testFetch() {
  const url = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D8%B1%D8%A8%D9%84-%D8%B1%D9%88%D8%B2/p133723763';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  fs.writeFileSync('scripts/sample_page.html', html);
  console.log('Saved scripts/sample_page.html, size:', html.length);
}

testFetch().catch(console.error);
