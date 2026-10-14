const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function findEatenBottles() {
  const deraah = JSON.parse(fs.readFileSync('public/data/deraah_perfumes.json', 'utf8'));
  const rawDir = 'scripts/raw_deraah';
  
  const eaten = [];
  for (let i = 0; i < deraah.length; i++) {
    const p = deraah[i];
    const slug = (p.slug || ('deraah-' + (i + 1))).replace(/[^a-zA-Z0-9_-]/g, '_');
    const pngPath = path.join(rawDir, slug + '.png');
    if (!fs.existsSync(pngPath)) continue;

    // Check transparency in the center of the cutout
    const { data, info } = await sharp(pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height;
    
    // Check center vertical strip: between 35% and 75% of height, center 40% of width
    let opaquePixels = 0;
    let totalChecked = 0;
    const startY = Math.floor(h * 0.35);
    const endY = Math.floor(h * 0.75);
    const startX = Math.floor(w * 0.3);
    const endX = Math.floor(w * 0.7);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        totalChecked++;
        const a = data[(y * w + x) * 4 + 3];
        if (a > 40) opaquePixels++;
      }
    }

    const ratio = opaquePixels / totalChecked;
    // If the center body of the bottle is hollow (ratio < 0.35), the bottle body was eaten away!
    if (ratio < 0.35) {
      eaten.push({ index: i, id: p.id, title: p.title, ratio: ratio.toFixed(2), w, h, origUrl: p.originalImage });
    }
  }

  console.log('Total Deraah bottles with hollow/eaten body:', eaten.length);
  eaten.forEach(e => console.log('  - [' + e.id + '] ' + e.title + ' (opaque ratio: ' + e.ratio + ')'));
}
findEatenBottles();
