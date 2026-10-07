const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const perfumes = [
  'purple-rose',
  'majestic-wood',
  'oud-argent',
  'amber-cashmere',
  'liana',
  'nowara',
  'moudhi',
  'rozana',
  'emotion',
  'attraction'
];

async function cleanBottle(id) {
  let inPath;
  if (id === 'purple-rose') {
    inPath = path.join(__dirname, 'purple_rose_clean.png');
  } else {
    inPath = path.join(__dirname, `imgly_${id}.png`);
  }

  const { data, info } = await sharp(inPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Find approximate center of the non-transparent pixels
  let sumX = 0, count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 50) {
        sumX += x;
        count++;
      }
    }
  }
  const centerX = count > 0 ? Math.round(sumX / count) : 500;

  // Clean studio shadow (neutral gray to the left of the bottle and below the bottle)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a === 0) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      // Drop shadow on the left side: neutral gray
      if (x < centerX - 60 && diff <= 5 && min >= 110) {
        data[idx + 3] = 0;
      }

      // Drop shadow near far left
      if (x < centerX - 100 && diff <= 8 && min >= 90) {
        data[idx + 3] = 0;
      }
    }
  }

  // Remove faint gray shadow under the glass base (y > 900, diff <= 4, min >= 150)
  for (let y = Math.round(h * 0.88); y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a === 0) continue;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const diff = Math.max(r,g,b) - Math.min(r,g,b);
      const min = Math.min(r,g,b);
      if (diff <= 5 && min >= 140) {
        data[idx + 3] = 0;
      }
    }
  }

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();

  const trimmed = await sharp(cleaned).trim().toBuffer({ resolveWithObject: true });
  const outPath = path.join(__dirname, `spotless_${id}.png`);
  fs.writeFileSync(outPath, trimmed.data);
  console.log(`${id}: trimmed size ${trimmed.info.width} x ${trimmed.info.height}`);
}

async function run() {
  for (const id of perfumes) {
    await cleanBottle(id);
  }
}

run().catch(console.error);
