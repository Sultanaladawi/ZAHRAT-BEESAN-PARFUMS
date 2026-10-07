const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const translations = {
  ar: {
    quickViewShowcase: "العرض الملكي",
    quickViewBox: "العطر مع العلبة الفاخرة",
    quickViewFlacon: "الزجاجة الصافية",
    quickViewCard: "بطاقة الهرم العطري والمكونات"
  }
};
const t = translations.ar;
const currentLang = 'ar';

const testIds = [
  'purple-rose',
  'ambitious',
  'cartage-noble',
  'boudoir',
  'vintage',
  'honest',
  'package-cartage-noble',
  'bakhoor-al-diwan',
  'oil-musk-toot'
];

testIds.forEach(id => {
  const p = perfumes.find(x => x.id === id);
  if (!p) {
    console.log('Not found:', id);
    return;
  }

  const galleryItems = [];
  const seenUrls = new Set();

  const addGalleryItem = (src, label, isFlacon = false) => {
    if (!src || seenUrls.has(src)) return;
    seenUrls.add(src);
    galleryItems.push({ src, label, isFlacon });
  };

  if (p.image) {
    addGalleryItem(p.image, t.quickViewShowcase, false);
  }

  if (p.boxImage) {
    addGalleryItem(p.boxImage, t.quickViewBox, false);
  }

  const flaconSrc = p.originalImage || p.bottleUrl || p.fragranticaBottle;
  if (flaconSrc && flaconSrc !== p.image && flaconSrc !== p.boxImage) {
    addGalleryItem(flaconSrc, t.quickViewFlacon, true);
  }

  if (p.fragranticaCard) {
    addGalleryItem(p.fragranticaCard, t.quickViewCard, false);
  }

  if (p.galleryImages && Array.isArray(p.galleryImages)) {
    p.galleryImages.forEach((imgUrl, idx) => {
      if (!imgUrl || seenUrls.has(imgUrl)) return;
      if (imgUrl === p.fragranticaBottle || imgUrl === p.bottleUrl || imgUrl === p.originalImage) return;
      if (imgUrl.includes('/perfume/o.') || imgUrl.includes('perfume-social-cards') || imgUrl.includes('social.')) return;
      if (imgUrl.includes('500x500') || imgUrl.includes('100x100') || imgUrl.includes('lsSRUDFXv00bFNJa4GiHjtn4Y9KTDd1SCrksaoPn')) return;

      let label = `${currentLang === 'ar' ? 'إطلالة إضافية' : 'Extra View'} ${galleryItems.length + 1}`;
      if (imgUrl.includes('secundar')) {
        label = t.quickViewBox;
      }
      addGalleryItem(imgUrl, label, false);
    });
  }

  console.log(`\n================ [${p.id}] (${p.title}) ================`);
  galleryItems.forEach((item, i) => {
    console.log(`  ${i + 1}. [${item.label}] -> ${item.src.substring(0, 70)}...`);
  });
});
