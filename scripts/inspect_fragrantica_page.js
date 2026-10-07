const fs = require('fs');

const html = fs.readFileSync('scripts/sample_fragrantica_purple_rose.html', 'utf8');

// Look for perfume image
const mainImgMatch = html.match(/<img[^>]+itemprop=["']image["'][^>]*>/i) ||
                     html.match(/<img[^>]+src=["']([^"']*(?:perfume|bocice|ndimg)[^"']*)["'][^>]*>/gi);
console.log('Main image match:', mainImgMatch);

// Look for notes images: usually in /notes/ or fimgs.net/mdimg/sastojci/
const noteImgs = [...html.matchAll(/<img[^>]+src=["']([^"']*(?:sastojci|notes)[^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi)];
console.log('Total note images found:', noteImgs.length);
noteImgs.forEach(n => {
  console.log('Note:', n[2], '-->', n[1]);
});

// Also check the notes pyramid section in HTML
const pyrIdx = html.indexOf('الهرم العطري') !== -1 ? html.indexOf('الهرم العطري') : html.indexOf('pyramid');
console.log('Pyramid index:', pyrIdx);
if (pyrIdx !== -1) {
  console.log('Context around pyramid:');
  console.log(html.slice(pyrIdx, pyrIdx + 1500));
}
