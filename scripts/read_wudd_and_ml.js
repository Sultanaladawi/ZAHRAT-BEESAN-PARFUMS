const fs = require('fs');

console.log('--- RASAYIL WUDD ---');
const wuddHtml = fs.readFileSync('scripts/wudd_boutiqaat.html', 'utf8');
const wuddIdx = wuddHtml.indexOf('الروائح الأساسية');
if (wuddIdx !== -1) {
  console.log(wuddHtml.slice(wuddIdx - 100, wuddIdx + 400));
}

console.log('\n--- MOUNTAIN LEATHER ---');
const mlHtml = fs.readFileSync('scripts/gw_mountain_leather.html', 'utf8');
const text = mlHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const idx = text.indexOf('ماونتن ليذر');
if (idx !== -1) {
  console.log(text.slice(idx, idx + 800));
}

// Check Salla description of Mountain Leather in perfumes.json
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const ml = perfumes.find(p => p.id === 'mountain-leather');
if (ml) {
  console.log('\nCurrent Mountain Leather in catalog:');
  console.log('Overview:', ml.overview);
  console.log('Opening:', ml.opening);
  console.log('Heart:', ml.heart);
  console.log('Base:', ml.base);
}
