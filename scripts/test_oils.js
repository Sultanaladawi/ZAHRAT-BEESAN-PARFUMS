const fs = require('fs');

async function test() {
  const oils = ['oil-rajwa', 'oil-fakhamah', 'oil-wasaef', 'oil-kalakass', 'oil-mokhmariah'];
  const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
  for (const id of oils) {
    const p = perfumes.find(x => x.id === id);
    if (!p) continue;
    const res = await fetch(p.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    const html = await res.text();
    const tabMatch = html.match(/<div\s+id="details_table"\s+class="[^"]*tab-pane[^"]*"[^>]*>/i);
    if (tabMatch) {
      const block = html.slice(tabMatch.index, tabMatch.index + 1000);
      console.log(id, '-->', block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200));
    } else {
      console.log(id, 'no tab');
    }
  }
}
test();
