const fs = require('fs');

const testUrls = [
  { id: 'vintage', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%81%D9%8A%D9%86%D8%AA%D8%A7%D8%AC/p1333777717' },
  { id: 'bundle-modern', url: 'https://ghalati.com/ar/%D8%A8%D8%A7%D9%82%D8%A9-%D9%85%D9%88%D8%AF%D8%B1%D9%86/p193187289' },
  { id: 'bakhoor-oud-ghalati', url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D8%B9%D9%88%D8%AF-%D8%BA%D9%84%D8%A7%D8%AA%D9%8A-%D8%A7%D9%84%D9%85%D9%84%D9%83%D9%8A/p1029384756' },
  { id: 'oil-tom-ford', url: 'https://ghalati.com/ar/%D8%AA%D9%88%D9%84%D8%A9-%D8%AA%D9%88%D9%85-%D9%81%D9%88%D8%B1%D8%AF-%D8%B9%D9%88%D8%AF-%D9%88%D9%88%D8%AF-15-%D9%85%D9%84/p120938475' }
];

async function testFetch() {
  for (const item of testUrls) {
    console.log(`\n========================================\nFetching ${item.id}...`);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) {
        console.log(`Failed HTTP: ${res.status}`);
        continue;
      }
      const html = await res.text();
      const tabIdx = html.indexOf('<div id="details_table"');
      if (tabIdx === -1) {
        console.log('No details_table found in HTML! Checking length:', html.length);
        continue;
      }
      const endMarkers = ['<div id="reviews"', '<div id="comments"', '<div id="more_info"', '<!-- /details_table -->', 'id="customer-reviews"'];
      let minEnd = html.length;
      for (const m of endMarkers) {
        const idx = html.indexOf(m, tabIdx + 50);
        if (idx !== -1 && idx < minEnd) minEnd = idx;
      }
      const block = html.slice(tabIdx, minEnd);
      // clean tags
      const clean = block
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      console.log(`Clean length: ${clean.length}`);
      console.log('Clean excerpt:');
      console.log(clean.slice(0, 500));
    } catch (e) {
      console.error(e.message);
    }
  }
}

testFetch();
