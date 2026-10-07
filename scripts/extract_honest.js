const fs = require('fs');
const html = fs.readFileSync('scripts/honest_dump.html', 'utf8');

const regex = /<article[^>]*>([\s\S]*?)<\/article>/i;
const match = regex.exec(html);
if (match) {
  console.log('Article:\n', match[1].replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean).join('\n'));
} else {
  console.log('No article found');
}

const priceRegex = /data-price="([^"]+)"|class="product-price[^"]*"[^>]*>([^<]+)</g;
let pm;
while ((pm = priceRegex.exec(html)) !== null) {
  console.log('Price match:', pm[1] || pm[2]);
}
