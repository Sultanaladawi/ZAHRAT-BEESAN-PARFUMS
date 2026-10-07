const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const masterBgPath = 'public/images/ghalati_master_bg.jpg';

async function scanShadows() {
  const masterRaw = await sharp(masterBgPath).raw().toBuffer({ resolveWithObject: true });
  const mW = masterRaw.info.width;
  const mData = masterRaw.data;

  console.log('Scanning all perfume images for left-side shadow artifacts...\n');

  for (const p of perfumes) {
    if (p.categoryType && p.categoryType !== 'perfume') continue;

    const imgPath = 'public/' + p.image;
    if (!fs.existsSync(imgPath)) continue;

    const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height;

    // Check region x: 280 to 420, y: 350 to 650 (left of bottle on the podium)
    let diffCount = 0;
    let maxDiff = 0;
    for (let y = 350; y < 650; y += 4) {
      for (let x = 280; x < 420; x += 4) {
        const idx = (y * w + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const mr = mData[idx], mg = mData[idx+1], mb = mData[idx+2];

        // Is it significantly darker than master background?
        const delta = (mr - r) + (mg - g) + (mb - b);
        if (delta > 35) {
          diffCount++;
          if (delta > maxDiff) maxDiff = delta;
        }
      }
    }

    if (diffCount > 15) {
      console.log(`⚠️ SHADOW FOUND: ${p.id} (${p.title}) -> diffCount: ${diffCount}, maxDelta: ${maxDiff}`);
    }
  }
}

scanShadows();
