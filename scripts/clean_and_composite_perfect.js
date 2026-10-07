const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const masterBgPath = path.join(publicImagesDir, 'ghalati_master_bg.jpg');

async function processHeroic() {
  console.log('Processing Heroic...');
  const inputPath = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791362513596.png';
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const out = Buffer.alloc(w * h * 4);

  const centerX = 494;
  const rightBounds = new Int32Array(h);

  for (let y = 0; y < h; y++) {
    let rEdge = -1;
    for (let x = w - 1; x >= centerX; x--) {
      const idx = (y * w + x) * 4;
      if (data[idx] < 248 || data[idx+1] < 248 || data[idx+2] < 248) {
        rEdge = x;
        break;
      }
    }
    rightBounds[y] = rEdge;
  }

  for (let y = 0; y < h; y++) {
    const rEdge = rightBounds[y];
    if (rEdge === -1) continue;

    let minX = centerX - (rEdge - centerX);
    // For bottle body below cap neck (y >= 275), glass left edge is 330
    if (y >= 275 && minX < 330) {
      minX = 330;
    }

    for (let x = 0; x < w; x++) {
      const srcIdx = (y * w + x) * 4;
      const dstIdx = srcIdx;
      const r = data[srcIdx], g = data[srcIdx+1], b = data[srcIdx+2];

      // Outside bottle bounds or in shadow area
      if (x < minX || x > rEdge) {
        out[dstIdx + 3] = 0;
        continue;
      }

      // Cut table shadow/reflection below bottle base
      if (y > 927) {
        out[dstIdx + 3] = 0;
        continue;
      }

      // Cut gray shadow around cap on the left
      if (y < 275 && x < centerX) {
        if ((r - b < 35 && Math.abs(r - g) < 20) || (r > 190 && g > 190 && b > 185 && Math.abs(r - b) < 25)) {
          out[dstIdx + 3] = 0;
          continue;
        }
      }

      // Check pure background white
      if (r >= 248 && g >= 248 && b >= 248) {
        out[dstIdx + 3] = 0;
        continue;
      }

      out[dstIdx] = r;
      out[dstIdx + 1] = g;
      out[dstIdx + 2] = b;

      // Antialiased edge
      if (x === minX || x === rEdge) {
        out[dstIdx + 3] = 160;
      } else {
        out[dstIdx + 3] = 255;
      }
    }
  }

  const trimmed = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .trim()
    .toBuffer({ resolveWithObject: true });

  const origPath = path.join(publicImagesDir, 'original_heroic.png');
  fs.writeFileSync(origPath, trimmed.data);
  console.log(`Saved clean original_heroic.png: ${trimmed.info.width}x${trimmed.info.height}`);

  // Ground on pedestal
  const targetH = 505;
  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 40;
  const shadowSvg = `<svg width="${shadowW}" height="26" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.0" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
    </defs>
    <ellipse cx="${Math.round(shadowW / 2)}" cy="13" rx="${Math.round(bW * 0.40)}" ry="6" fill="#1b1209" opacity="0.60" filter="url(#f1)" />
    <ellipse cx="${Math.round(shadowW / 2)}" cy="13" rx="${Math.round(bW * 0.25)}" ry="3" fill="#080503" opacity="0.85" filter="url(#f2)" />
  </svg>`.trim();
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const outJpg = path.join(publicImagesDir, 'ghalati_heroic.jpg');
  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 11 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96 })
    .toFile(outJpg);

  console.log(`✓ Pristine ghalati_heroic.jpg saved`);
}

async function processAncestry() {
  console.log('\nProcessing Ancestry Oud...');
  const inputPath = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791362463953.png';
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const out = Buffer.alloc(w * h * 4);

  const centerX = 250;
  const rightBounds = new Int32Array(h);

  for (let y = 0; y < h; y++) {
    let rEdge = -1;
    for (let x = w - 1; x >= centerX; x--) {
      const idx = (y * w + x) * 4;
      if (data[idx] < 240 || data[idx+1] < 240 || data[idx+2] < 240) {
        rEdge = x;
        break;
      }
    }
    rightBounds[y] = rEdge;
  }

  for (let y = 0; y < h; y++) {
    const rEdge = rightBounds[y];
    if (rEdge === -1) continue;

    let minX = centerX - (rEdge - centerX);
    // Cylinder body left edge is 166
    if (y >= 120 && minX < 166) {
      minX = 166;
    }

    for (let x = 0; x < w; x++) {
      const srcIdx = (y * w + x) * 4;
      const dstIdx = srcIdx;
      const r = data[srcIdx], g = data[srcIdx+1], b = data[srcIdx+2];

      // Outside bottle horizontal bounds
      if (x < minX || x > rEdge) {
        out[dstIdx + 3] = 0;
        continue;
      }

      // Check bottom cylinder contour - cut out studio floor shadow
      const bottomLimitY = 472 - Math.round(8 * Math.pow(Math.abs(x - centerX) / 84, 2));
      if (y > bottomLimitY) {
        out[dstIdx + 3] = 0;
        continue;
      }

      // Check pure background white
      if (r >= 240 && g >= 240 && b >= 240) {
        out[dstIdx + 3] = 0;
        continue;
      }

      out[dstIdx] = r;
      out[dstIdx + 1] = g;
      out[dstIdx + 2] = b;

      // Antialiased edge
      if (x === minX || x === rEdge) {
        out[dstIdx + 3] = 160;
      } else {
        out[dstIdx + 3] = 255;
      }
    }
  }

  const trimmed = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .trim()
    .toBuffer({ resolveWithObject: true });

  const origPath = path.join(publicImagesDir, 'original_ancestry-oud.png');
  fs.writeFileSync(origPath, trimmed.data);
  console.log(`Saved clean original_ancestry-oud.png: ${trimmed.info.width}x${trimmed.info.height}`);

  // Ground on pedestal
  const targetH = 510;
  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 40;
  const shadowSvg = `<svg width="${shadowW}" height="26" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.0" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
    </defs>
    <ellipse cx="${Math.round(shadowW / 2)}" cy="13" rx="${Math.round(bW * 0.38)}" ry="6" fill="#1b1209" opacity="0.60" filter="url(#f1)" />
    <ellipse cx="${Math.round(shadowW / 2)}" cy="13" rx="${Math.round(bW * 0.24)}" ry="3" fill="#080503" opacity="0.85" filter="url(#f2)" />
  </svg>`.trim();
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const outJpg = path.join(publicImagesDir, 'ghalati_ancestry-oud.jpg');
  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 11 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96 })
    .toFile(outJpg);

  console.log(`✓ Pristine ghalati_ancestry-oud.jpg saved`);
}

async function run() {
  await processHeroic();
  await processAncestry();
  console.log('\nAll done cleanly!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
