const fs = require('fs');
const html = fs.readFileSync('scripts/sample_page.html', 'utf8');

// Search for Arabic keywords like "الهرم العطري", "افتتاحية", "قلب", "قاعدة"
const idx = html.indexOf('افتتاحية');
if (idx !== -1) {
  console.log('Found افتتاحية at index:', idx);
  console.log(html.substring(Math.max(0, idx - 400), idx + 800).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
} else {
  console.log('افتتاحية not found directly in raw HTML text, searching for "المكونات" or "وصف"');
  const idx2 = html.indexOf('وصف');
  if (idx2 !== -1) {
    console.log(html.substring(idx2 - 100, idx2 + 500).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  }
}

// Search for any <article> or salla product details
const regex = /<article[\s\S]*?<\/article>/gi;
const articles = html.match(regex);
if (articles) {
  console.log('\n--- Articles found:', articles.length);
  articles.forEach((a, i) => {
    console.log(`Article ${i}:`, a.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 500));
  });
}
