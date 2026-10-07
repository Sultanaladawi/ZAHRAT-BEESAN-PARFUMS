const fs = require('fs');
const html = fs.readFileSync('scripts/honest_dump.html', 'utf8');

const keywords = ['افتتاحية', 'قلب العطر', 'قاعدة العطر', 'مكونات', 'وصف', 'description', 'price', 'product'];
keywords.forEach(kw => {
  const idx = html.indexOf(kw);
  console.log(`Keyword "${kw}": index = ${idx}`);
  if (idx !== -1) {
    console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 200)));
    console.log('---');
  }
});
