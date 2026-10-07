const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

const boxUpdates = {
  'rozana': {
    boxImage: 'images/box_rozana.jpg',
    galleryImages: ['images/rozana_notes.jpg']
  },
  'emotion': {
    boxImage: 'images/box_emotion.jpg'
  },
  'shades': {
    boxImage: 'images/box_shades.jpg'
  },
  'bois-noir': {
    boxImage: 'images/box_bois-noir.jpg'
  },
  'utopia-essence': {
    boxImage: 'images/box_utopia-essence.jpg'
  },
  'dama': {
    boxImage: 'images/box_dama.jpg'
  },
  'exotic-wood': {
    boxImage: 'images/box_exotic-wood.jpg'
  },
  'honest': {
    boxImage: 'images/box_honest.jpg'
  }
};

let updatedCount = 0;
perfumes.forEach(p => {
  if (boxUpdates[p.id]) {
    const upd = boxUpdates[p.id];
    if (upd.boxImage) p.boxImage = upd.boxImage;
    if (upd.galleryImages) {
      p.galleryImages = upd.galleryImages;
    }
    updatedCount++;
    console.log(`✓ Updated ${p.id} (${p.title}): boxImage -> ${p.boxImage}`);
  }

  // Deduplication check
  const seen = new Set();
  if (p.image) seen.add(p.image);
  if (p.boxImage) {
    if (seen.has(p.boxImage)) p.boxImage = null;
    else seen.add(p.boxImage);
  }
  if (p.originalImage) {
    if (seen.has(p.originalImage)) p.originalImage = null;
    else seen.add(p.originalImage);
  }
  if (p.fragranticaCard) {
    if (seen.has(p.fragranticaCard)) p.fragranticaCard = null;
    else seen.add(p.fragranticaCard);
  }
  if (Array.isArray(p.galleryImages)) {
    p.galleryImages = p.galleryImages.filter(img => {
      if (!img || seen.has(img)) return false;
      seen.add(img);
      return true;
    });
  }
});

fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
console.log(`\nUpdated ${updatedCount} perfumes in perfumes.json successfully!`);
