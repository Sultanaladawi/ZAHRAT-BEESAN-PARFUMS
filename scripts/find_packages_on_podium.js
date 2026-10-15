const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const catalogs = [
  { name: 'Assaf', file: 'public/data/assaf_perfumes.json' },
  { name: 'Thunayan', file: 'public/data/thnyan_perfumes.json' },
  { name: 'Ghalati', file: 'public/data/perfumes.json' },
  { name: 'Al-Rehab', file: 'public/data/alrehab_perfumes.json' },
  { name: 'Rasasi', file: 'public/data/rasasi_perfumes.json' },
  { name: 'Laverne', file: 'public/data/laverne_perfumes.json' },
  { name: 'Deraah', file: 'public/data/deraah_perfumes.json' }
];

async function checkPackagesOnPodium() {
  for (const cat of catalogs) {
    if (!fs.existsSync(cat.file)) continue;
    const items = JSON.parse(fs.readFileSync(cat.file, 'utf8'));
    const bundles = items.filter(p => {
      const t = (p.title || '') + ' ' + (p.specs?.type || '');
      return p.categoryType === 'bundle' || p.categoryType === 'gift_set' || /مجموعة|باكج|بكج|طقم|باقة|عرض|صندوق|بوكس|ساعة|نظارة|بودرة|باودر|set|bundle/i.test(t);
    });

    const onPodium = [];
    for (const b of bundles) {
      const rel = (b.image || '').replace(/^\//, '');
      const imgPath = path.join('public', rel);
      if (!fs.existsSync(imgPath)) continue;
      try {
        const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
        const idx = (15 * info.width + 15) * info.channels;
        const isWhite = data[idx] > 235 && data[idx+1] > 235 && data[idx+2] > 235;
        if (!isWhite) {
          onPodium.push({ id: b.id, title: b.title, imgPath, orig: b.originalImage || b.bottleUrl });
        }
      } catch (e) {}
    }
    console.log(`=== ${cat.name} ===`);
    console.log(`Total bundles/sets: ${bundles.length}`);
    console.log(`Bundles STILL ON PODIUM: ${onPodium.length}`);
    onPodium.forEach(x => console.log('  ', x.id, '|', x.title, '|', x.imgPath));
  }
}

checkPackagesOnPodium().catch(console.error);
