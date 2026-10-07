const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const assets = JSON.parse(fs.readFileSync('data/fragrantica_verified_assets.json', 'utf8'));

const assetsMap = new Map();
assets.forEach(a => {
  assetsMap.set(a.id, a);
});

console.log(`Loaded ${perfumes.length} perfumes and ${assets.length} Fragrantica assets.`);

// Clean and reorganize galleryImages
perfumes.forEach(p => {
  const fItem = assetsMap.get(p.id);

  if (fItem) {
    p.fragranticaUrl = fItem.fUrl;
    p.fragranticaId = fItem.fid;
    if (fItem.cardUrl) p.fragranticaCard = fItem.cardUrl;
    if (fItem.bottleUrl) p.fragranticaBottle = fItem.bottleUrl;
  }

  const rawGallery = p.galleryImages || [];
  const cleaned = [];

  // Filter out banner logos
  const validUrls = rawGallery.filter(url => {
    if (!url) return false;
    if (url.includes('lsSRUDFXv00bFNJa4GiHjtn4Y9KTDd1SCrksaoPn')) return false; // store banner logo
    if (url.includes('favicon') || url.includes('store-logo')) return false;
    return true;
  });

  // Identify duplicate 500x500 vs 1000x1000
  // e.g. "ad3f35da-...-500x500-k6OZpnOFUh6arAfm8lVaV44mqTXzgUyHR9TXsgwW.png" vs "...-1000x1000-k6OZpnOFUh6arAfm8lVaV44mqTXzgUyHR9TXsgwW.png"
  const keys1000 = new Set();
  validUrls.forEach(u => {
    const m = u.match(/1000x1000-([a-zA-Z0-9_\-\.]+)/);
    if (m) keys1000.add(m[1]);
  });

  const dedupedSalla = validUrls.filter(u => {
    const m500 = u.match(/500x500-([a-zA-Z0-9_\-\.]+)/);
    if (m500 && keys1000.has(m500[1])) {
      return false; // drop the 500x500 duplicate since 1000x1000 exists!
    }
    return true;
  });

  // Now assemble ordered gallery:
  // 1) Fragrantica Pyramid & Accords Card (if available)
  if (p.fragranticaCard && !cleaned.includes(p.fragranticaCard)) {
    cleaned.push(p.fragranticaCard);
  }

  // 2) Fragrantica Official Studio Bottle (if available)
  if (p.fragranticaBottle && !cleaned.includes(p.fragranticaBottle)) {
    cleaned.push(p.fragranticaBottle);
  }

  // 3) High-res authentic Salla product photos (deduped)
  dedupedSalla.forEach(u => {
    if (!cleaned.includes(u)) {
      cleaned.push(u);
    }
  });

  p.galleryImages = cleaned;
});

// Test inspection on purple-rose and vintage
console.log('\n--- Sample: Purple Rose Gallery ---');
const pr = perfumes.find(x => x.id === 'purple-rose');
console.log('fragranticaUrl:', pr.fragranticaUrl);
console.log('galleryImages:', pr.galleryImages);

console.log('\n--- Sample: Vintage Gallery ---');
const vin = perfumes.find(x => x.id === 'vintage');
console.log('fragranticaUrl:', vin.fragranticaUrl);
console.log('galleryImages:', vin.galleryImages);

console.log('\n--- Sample: Rasayil Haneen Gallery (not on fragrantica) ---');
const han = perfumes.find(x => x.id === 'rasayil-haneen');
console.log('galleryImages:', han.galleryImages);

fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
console.log('\nSuccessfully saved updated perfumes.json with Fragrantica assets and deduplicated galleries!');
