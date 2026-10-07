const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

const targets = [
  'rozana',
  'emotion',
  'shades',
  'bois-noir',
  'dama',
  'exotic-wood',
  'honest',
  'utopia-essence',
  'moudhi',
  'majestic-wood',
  'nowara',
  'layana'
];

targets.forEach(id => {
  const p = perfumes.find(x => x.id === id);
  if (!p) {
    console.log(`ERROR: ${id} not found`);
    return;
  }

  const galleryItems = [];
  const seenUrls = new Set();

  const addGalleryItem = (src, label, isFlacon = false) => {
    if (!src || seenUrls.has(src)) return;
    seenUrls.add(src);
    galleryItems.push({ src, label, isFlacon });
  };

  if (p.image) addGalleryItem(p.image, 'العرض الملكي', false);
  if (p.boxImage) addGalleryItem(p.boxImage, 'العطر مع العلبة الفاخرة', false);

  const flaconSrc = p.originalImage || p.bottleUrl || p.fragranticaBottle;
  if (flaconSrc && flaconSrc !== p.image && flaconSrc !== p.boxImage) {
    addGalleryItem(flaconSrc, 'الزجاجة الصافية', true);
  }

  if (p.fragranticaCard) {
    addGalleryItem(p.fragranticaCard, 'بطاقة الهرم العطري والمكونات', false);
  }

  if (p.galleryImages && Array.isArray(p.galleryImages)) {
    p.galleryImages.forEach(img => {
      addGalleryItem(img, 'إطلالة إضافية', false);
    });
  }

  console.log(`\n=== [${p.title} (${p.id})] - ${galleryItems.length} gallery tabs ===`);
  galleryItems.forEach((item, idx) => {
    console.log(`  ${idx + 1}. [${item.label}] -> ${item.src} (isFlacon: ${item.isFlacon})`);
  });
});
