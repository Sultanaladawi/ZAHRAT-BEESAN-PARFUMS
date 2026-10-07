const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function cleanBottleCutout(id, inPath, outPath, cleanFn) {
  const { data, info } = await sharp(inPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  cleanFn(data, w, h);

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();

  const trimmed = await sharp(cleaned).trim().png().toBuffer();
  fs.writeFileSync(outPath, trimmed);
  console.log(`Cleaned and saved ${outPath}`);
}

async function run() {
  // 1. Attraction: remove stray shadow arc on the lower-left and any tiny specs on upper shoulders
  await cleanBottleCutout('attraction', 'scripts/spotless_attraction.png', 'scripts/clean_attraction.png', (data, w, h) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a === 0) continue;
        
        // Lower left stray arc: y > 0.7 * h and x < 0.2 * w
        if (y > h * 0.7 && x < w * 0.22) {
          data[idx + 3] = 0;
        }
        // Top right stray specs outside shoulder: x > 0.88 * w and y < 0.5 * h
        if (x > w * 0.88 && y < h * 0.5) {
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          if (r > 200 && g > 200 && b > 200) {
            data[idx + 3] = 0;
          }
        }
      }
    }
  });

  // 2. Rozana: clean tiny white speck on upper left shoulder (y between 0.25*h and 0.4*h, x < 0.15*w)
  await cleanBottleCutout('rozana', 'scripts/spotless_rozana.png', 'scripts/clean_rozana.png', (data, w, h) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a === 0) continue;

        // Stray speck on left of shoulder
        if (x < w * 0.12 && y > h * 0.2 && y < h * 0.45) {
          data[idx + 3] = 0;
        }
      }
    }
  });

  // 3. Moudhi: clean tiny speck on left neck
  await cleanBottleCutout('moudhi', 'scripts/spotless_moudhi.png', 'scripts/clean_moudhi.png', (data, w, h) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a === 0) continue;

        // Stray speck on left of neck (x < 0.15*w, y between 0.18*h and 0.28*h)
        if (x < w * 0.15 && y > h * 0.18 && y < h * 0.28) {
          data[idx + 3] = 0;
        }
      }
    }
  });

  // 4. Purple Rose: check if any speck on top right shoulder
  await cleanBottleCutout('purple-rose', 'scripts/spotless_purple-rose.png', 'scripts/clean_purple-rose.png', (data, w, h) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a === 0) continue;

        // Stray speck on top right outside shoulder
        if (x > w * 0.9 && y > h * 0.2 && y < h * 0.35) {
          data[idx + 3] = 0;
        }
      }
    }
  });
}

run().catch(console.error);
