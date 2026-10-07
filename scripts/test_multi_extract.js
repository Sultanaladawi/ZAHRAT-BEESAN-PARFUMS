const fs = require('fs');

const testUrls = [
  { id: 'purple-rose', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D8%B1%D8%A8%D9%84-%D8%B1%D9%88%D8%B2/p133723763' },
  { id: 'vintage', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%81%D9%8A%D9%86%D8%AA%D8%A7%D8%AC/p1333777717' },
  { id: 'bundle-modern', url: 'https://ghalati.com/ar/%D8%A8%D8%A7%D9%82%D8%A9-%D9%85%D9%88%D8%AF%D8%B1%D9%86/p193187289' },
  { id: 'bakhoor-oud-ghalati', url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D8%B9%D9%88%D8%AF-%D8%BA%D9%84%D8%A7%D8%AA%D9%8A-%D8%A7%D9%84%D9%85%D9%84%D9%83%D9%8A/p1029384756' },
  { id: 'oil-tom-ford', url: 'https://ghalati.com/ar/%D8%AA%D9%88%D9%84%D8%A9-%D8%AA%D9%88%D9%85-%D9%81%D9%88%D8%B1%D8%AF-%D8%B9%D9%88%D8%AF-%D9%88%D9%88%D8%AF-15-%D9%85%D9%84/p120938475' }
];

async function check() {
  for (const item of testUrls) {
    console.log(`\n========================================\nFetching ${item.id}...`);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      console.log(`Status: ${res.status}`);
      if (res.status !== 200) continue;
      const html = await res.text();
      
      // Look for the description container in Salla
      // Usually Salla puts product description inside:
      // <article class="article article--main ..."> or <div class="content-entry ..."> or <div class="product__description">
      const match = html.match(/<article[^>]*class=\"[^\"]*article--main[^\"]*\"[^>]*>([\s\S]*?)<\/article>/i) ||
                    html.match(/class=\"[^\"]*content-entry[^\"]*\"[^>]*>([\s\S]*?)<\/div>/i) ||
                    html.match(/class=\"[^\"]*product__description[^\"]*\"[^>]*>([\s\S]*?)<\/div>/i);
      if (match) {
        const text = match[1].replace(/<script[\s\S]*?<\/script>/gi, '')
                             .replace(/<style[\s\S]*?<\/style>/gi, '')
                             .replace(/<br\s*[\/]?>/gi, '\n')
                             .replace(/<\/p>/gi, '\n\n')
                             .replace(/<[^>]+>/g, ' ')
                             .replace(/&nbsp;/g, ' ')
                             .replace(/\s+/g, ' ')
                             .trim();
        console.log('Description excerpt (first 400 chars):');
        console.log(text.slice(0, 400));
      } else {
        console.log('No direct container match. Searching for text containing keywords...');
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

check();
