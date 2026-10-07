const fs = require('fs');
const path = require('path');

const perfumesPath = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
const perfumes = JSON.parse(fs.readFileSync(perfumesPath, 'utf8'));

console.log('Total items before sort:', perfumes.length);

// Ensure every item has exact categoryType
perfumes.forEach(p => {
  if (!p.categoryType) {
    if (p.id.startsWith('bundle-') || p.id.startsWith('package-') || p.id.startsWith('set-') || p.id.includes('edition') || p.id.includes('sandouq')) {
      p.categoryType = 'bundle';
    } else if (p.id.startsWith('bakhoor-') || p.id.startsWith('mamool-') || p.id.startsWith('oud-aldar')) {
      p.categoryType = 'bakhoor';
    } else if (p.id.startsWith('oil-')) {
      p.categoryType = 'oil';
    } else {
      p.categoryType = 'perfume';
    }
  }
});

// Category ordering priority:
// 1. perfume (العطور الفاخرة)
// 2. bundle (باقات الإهداء والباكجات)
// 3. bakhoor (البخور والمعمول)
// 4. oil (الزيوت العطرية والتولات)
const priority = {
  'perfume': 1,
  'bundle': 2,
  'bakhoor': 3,
  'oil': 4
};

perfumes.sort((a, b) => {
  const pA = priority[a.categoryType] || 99;
  const pB = priority[b.categoryType] || 99;
  if (pA !== pB) return pA - pB;
  return 0;
});

const counts = {};
perfumes.forEach(p => {
  counts[p.categoryType] = (counts[p.categoryType] || 0) + 1;
});

console.log('Category breakdown after sort:', counts);

fs.writeFileSync(perfumesPath, JSON.stringify(perfumes, null, 2), 'utf8');
console.log('Successfully saved sorted perfumes.json');
