const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'laverne_perfumes.json');
const ARCHIVE_DATA_PATH = path.join(__dirname, '..', 'data', 'laverne_master_archive.json');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const prods = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));

// Precise item reassignment
const reassignments = {
  'ngXQPYD': { sub: 'gift_set', type: 'gift_set', bottleCount: 2 }, // عرض اليوم - له (عطر + حقيبة + هدايا)
  'jgbDOzR': { sub: 'bundle', type: 'bundle', bottleCount: 2 },     // جِنتل وبلو لافيرن بخور
  'wAdeEly': { sub: 'bundle', type: 'bundle', bottleCount: 2 },     // لادور بخور كلاسيك وكوين روز
  'mZDygDl': { sub: 'bundle', type: 'bundle', bottleCount: 2 },     // لادور بخور ونايت سفاير
};

prods.forEach(item => {
  if (reassignments[item.sallaId]) {
    item.subCategory = reassignments[item.sallaId].sub;
    item.categoryType = reassignments[item.sallaId].type;
    item.bottleCount = reassignments[item.sallaId].bottleCount;
  }
});

// Re-render ngXQPYD (عرض اليوم - له) with luxury studio framing since it is a gift collection
async function renderOfferSet() {
  const item = prods.find(x => x.sallaId === 'ngXQPYD');
  if (item && item.bottleUrl) {
    try {
      const res = await fetch(item.bottleUrl);
      const rawBuf = Buffer.from(await res.arrayBuffer());
      const inner = await sharp(rawBuf)
        .resize({ width: 920, height: 920, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer();
      const outPath = path.join(PUBLIC_IMAGES_DIR, `laverne_ngXQPYD.jpg`);
      await sharp({
        create: { width: 1024, height: 1024, channels: 4, background: { r: 248, g: 246, b: 240, alpha: 1 } }
      })
        .composite([{ input: inner, gravity: 'center' }])
        .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
        .toFile(outPath);
      console.log('Re-rendered framed studio image for ngXQPYD (عرض اليوم - له)');
    } catch (e) {
      console.warn('Failed to re-render ngXQPYD image:', e.message);
    }
  }
}

renderOfferSet().then(() => {
  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(prods, null, 2));
  fs.writeFileSync(ARCHIVE_DATA_PATH, JSON.stringify(prods, null, 2));
  
  const counts = {};
  prods.forEach(p => counts[p.subCategory] = (counts[p.subCategory] || 0) + 1);
  console.log('Updated Laverne Subcategory Breakdown:', counts);
});
