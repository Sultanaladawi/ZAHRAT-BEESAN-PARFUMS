const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

console.log('--- Inspecting current galleryImages ---');
perfumes.filter(p => p.categoryType === 'perfume').slice(0, 15).forEach(p => {
  console.log(`[${p.id}]`);
  (p.galleryImages || []).forEach(img => {
    console.log('  ', img);
  });
});
