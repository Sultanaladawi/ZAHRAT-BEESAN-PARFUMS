const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

// 1. Update Rozana
const rozana = perfumes.find(p => p.id === 'rozana');
if (rozana) {
  rozana.boxImage = 'images/box_rozana.jpg';
  console.log('✓ Updated Rozana boxImage to images/box_rozana.jpg');
}

// 2. Update Moudhi
const moudhi = perfumes.find(p => p.id === 'moudhi');
if (moudhi) {
  moudhi.boxImage = 'images/box_moudhi.jpg';
  moudhi.fragranticaCard = 'images/pyramid_moudhi.jpg';
  moudhi.galleryImages = ['images/box_moudhi_presentation.jpg'];
  console.log('✓ Updated Moudhi boxImage, fragranticaCard, and galleryImages');
}

// 3. Strict Deduplication check across all 119 perfumes
let duplicateCount = 0;
perfumes.forEach(p => {
  const seen = new Set();
  
  // Register primary images
  if (p.image) seen.add(p.image);
  if (p.boxImage) {
    if (seen.has(p.boxImage)) {
      console.warn(`Duplicate boxImage in ${p.id}: ${p.boxImage}`);
      p.boxImage = null;
      duplicateCount++;
    } else {
      seen.add(p.boxImage);
    }
  }
  if (p.originalImage) {
    if (seen.has(p.originalImage)) {
      console.warn(`Duplicate originalImage in ${p.id}: ${p.originalImage}`);
      duplicateCount++;
    } else {
      seen.add(p.originalImage);
    }
  }
  if (p.fragranticaCard) {
    if (seen.has(p.fragranticaCard)) {
      console.warn(`Duplicate fragranticaCard in ${p.id}: ${p.fragranticaCard}`);
      p.fragranticaCard = null;
      duplicateCount++;
    } else {
      seen.add(p.fragranticaCard);
    }
  }

  // Gallery images deduplication
  if (Array.isArray(p.galleryImages)) {
    const cleanGallery = [];
    p.galleryImages.forEach(img => {
      if (!img) return;
      if (seen.has(img)) {
        duplicateCount++;
        return;
      }
      seen.add(img);
      cleanGallery.push(img);
    });
    p.galleryImages = cleanGallery;
  }
});

fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
console.log(`Saved updated perfumes.json. Total items: ${perfumes.length}, duplicate occurrences resolved: ${duplicateCount}`);
