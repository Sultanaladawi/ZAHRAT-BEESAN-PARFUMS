const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

// Pick samples from bundle, bakhoor, oil
const bundles = perfumes.filter(p => p.categoryType === 'bundle').slice(0, 3);
const bakhoors = perfumes.filter(p => p.categoryType === 'bakhoor').slice(0, 3);
const oils = perfumes.filter(p => p.categoryType === 'oil').slice(0, 3);

const sample = [...bundles, ...bakhoors, ...oils];

async function testOthers() {
  for (const item of sample) {
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`\n================== [${item.id}] [${item.categoryType}] ==================`);
      console.log(`URL: ${item.url}`);
      console.log(`Status: ${res.status}, Final URL: ${res.url}`);
      const html = await res.text();
      const tabMatch = html.match(/<div\s+id="details_table"\s+class="[^"]*tab-pane[^"]*"[^>]*>/i);
      if (tabMatch) {
        const startIdx = tabMatch.index + tabMatch[0].length;
        const endIdx = html.indexOf('<div id="reviews"', startIdx) !== -1 ? html.indexOf('<div id="reviews"', startIdx) : startIdx + 2000;
        const block = html.slice(startIdx, endIdx);
        const text = block
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<br\s*[\/]?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<\/li>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        console.log('Clean text (first 300 chars):');
        console.log(text.slice(0, 300));
      } else {
        console.log('No details_table found!');
      }
    } catch (e) {
      console.error(item.id, e.message);
    }
  }
}

testOthers();
