const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

const targets = ['moudhi', 'rozana', 'layana', 'majestic-wood', 'nowara', 'purple-rose'];

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

  // 1. Showcase
  if (p.image) addGalleryItem(p.image, 'العرض الملكي', false);

  // 2. Box packaging
  if (p.boxImage) addGalleryItem(p.boxImage, 'العطر مع العلبة الفاخرة', false);

  // 3. Flacon
  const flaconSrc = p.originalImage || p.bottleUrl || p.fragranticaBottle;
  if (flaconSrc && flaconSrc !== p.image && flaconSrc !== p.boxImage) {
    addGalleryItem(flaconSrc, 'الزجاجة الصافية', true);
  }

  // 4. Fragrantica pyramid card
  if (p.fragranticaCard) {
    addGalleryItem(p.fragranticaCard, 'بطاقة الهرم العطري والمكونات', false);
  }

  // 5. Extra gallery
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
