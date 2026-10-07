const fs = require('fs');
const html = fs.readFileSync('scripts/sample_heroic_fragrantica.html', 'utf8');

const pCard = html.match(/https:\/\/fimgs\.net\/mdimg\/perfume-social-cards\/ar-[^"'\s]+\.jpeg/i);
const social = html.match(/https:\/\/fimgs\.net\/mdimg\/perfume\/social\.[0-9]+\.jpg/i);
const bottle = html.match(/https:\/\/fimgs\.net\/mdimg\/perfume\/o\.[0-9]+\.jpg/i);

console.log('Heroic card:', pCard ? pCard[0] : (social ? social[0] : 'none'));
console.log('Heroic bottle:', bottle ? bottle[0] : 'none');

// Find pyramid notes
const notesMatch = [...html.matchAll(/class="cell shrink"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi)].map(m => m[1]);
console.log('Notes:', notesMatch);

const descMatch = html.match(/itemprop="description"[^>]*>([\s\S]*?)<\/div>/i);
if (descMatch) {
  console.log('Desc:', descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}
