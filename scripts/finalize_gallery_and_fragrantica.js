const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const assets = JSON.parse(fs.readFileSync('data/fragrantica_verified_assets.json', 'utf8'));

const assetsMap = new Map();
assets.forEach(a => assetsMap.set(a.id, a));

let totalFragranticaLinked = 0;
let totalDuplicatesRemoved = 0;

perfumes.forEach(p => {
  const fItem = assetsMap.get(p.id);

  if (fItem) {
    p.fragranticaUrl = fItem.fUrl;
    p.fragranticaId = fItem.fid;
    if (fItem.cardUrl) p.fragranticaCard = fItem.cardUrl;
    if (fItem.bottleUrl) p.fragranticaBottle = fItem.bottleUrl;
    totalFragranticaLinked++;
  }

  const rawGallery = p.galleryImages || [];
  const initialLength = rawGallery.length;

  // 1. Remove store banner and favicon
  let validUrls = rawGallery.filter(url => {
    if (!url) return false;
    if (url.includes('lsSRUDFXv00bFNJa4GiHjtn4Y9KTDd1SCrksaoPn')) return false;
    if (url.includes('favicon') || url.includes('store-logo')) return false;
    return true;
  });

  // 2. Identify 1000x1000 keys and remove 500x500 duplicates
  const keys1000 = new Set();
  validUrls.forEach(u => {
    const m = u.match(/1000x1000-([a-zA-Z0-9_\-\.]+)/);
    if (m) keys1000.add(m[1]);
  });

  validUrls = validUrls.filter(u => {
    const m500 = u.match(/500x500-([a-zA-Z0-9_\-\.]+)/);
    if (m500 && keys1000.has(m500[1])) {
      return false; // remove duplicate
    }
    return true;
  });

  // 3. Assemble clean gallery
  const finalGallery = [];

  // A. Official Fragrantica Pyramid & Accords Card
  if (p.fragranticaCard && !finalGallery.includes(p.fragranticaCard)) {
    finalGallery.push(p.fragranticaCard);
  }

  // B. Official Fragrantica Studio Flacon
  if (p.fragranticaBottle && !finalGallery.includes(p.fragranticaBottle)) {
    finalGallery.push(p.fragranticaBottle);
  }

  // C. Deduped authentic Salla images
  validUrls.forEach(u => {
    if (!finalGallery.includes(u)) {
      finalGallery.push(u);
    }
  });

  // D. Fallback if empty
  if (finalGallery.length === 0) {
    if (p.bottleUrl && !finalGallery.includes(p.bottleUrl)) {
      finalGallery.push(p.bottleUrl);
    }
    if (p.originalImage && !finalGallery.includes(p.originalImage)) {
      finalGallery.push(p.originalImage);
    }
  }

  p.galleryImages = finalGallery;
  totalDuplicatesRemoved += Math.max(0, initialLength - validUrls.length);
});

fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');

console.log(`Summary:`);
console.log(`- Linked to Fragrantica: ${totalFragranticaLinked} perfumes`);
console.log(`- Redundant duplicate URLs removed: ${totalDuplicatesRemoved}`);
console.log(`- Updated public/data/perfumes.json successfully.`);
