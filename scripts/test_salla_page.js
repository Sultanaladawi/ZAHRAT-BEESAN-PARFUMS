const fs = require('fs');

async function inspectCat() {
  const url = 'https://ghalati.com/ar/%D9%84%D8%A3%D8%AC%D9%88%D8%A7%D8%A1%D9%8D-%D8%B3%D9%80%D8%A7%D8%AD%D8%B1%D8%A9/c1377526805';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  console.log('Cat HTML len:', html.length);
  fs.writeFileSync('./scripts/cat_debug.html', html, 'utf8');

  // Search for product IDs or URLs
  const pRegex = /\/p\d+/g;
  const pMatches = [...new Set(html.match(pRegex) || [])];
  console.log('Matches with /p12345:', pMatches);

  // Search for product titles or names in the HTML
  const titles = ['وصائف', 'أزرق', 'دار الكرم', 'رجوة', 'جازي', 'العنود', 'وعد', 'غلاتي', 'مبثوث', 'السمو', 'المجالس'];
  titles.forEach(t => {
    const idx = html.indexOf(t);
    console.log(`Keyword "${t}": found at ${idx}`);
    if (idx !== -1) {
      console.log('   Snippet: ...' + html.slice(Math.max(0, idx - 100), idx + 200).replace(/\s+/g, ' ') + '...');
    }
  });
}

inspectCat().catch(console.error);
