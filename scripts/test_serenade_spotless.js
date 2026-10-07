const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');

async function testSerenade() {
  const p = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8')).find(x => x.id === 'serenade');
  console.log('Downloading serenade image from:', p.bottleUrl);
  const res = await fetch(p.bottleUrl);
  const rawBuf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync('scripts/raw_serenade.jpg', rawBuf);

  console.log('Running imgly background removal...');
  const blob = await removeBackground(rawBuf);
  const buf = Buffer.from(await blob.arrayBuffer());

  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Find centerX from lower bottle body
  let sumX = 0, count = 0;
  for (let y = Math.round(h * 0.4); y < Math.round(h * 0.8); y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 100) {
        sumX += x;
        count++;
      }
    }
  }
  const centerX = count > 0 ? Math.round(sumX / count) : Math.round(w / 2);

  // Measure right border of bottle per row
  const rightBounds = new Int32Array(h);
  for (let y = 0; y < h; y++) {
    let rX = -1;
    for (let x = w - 1; x >= centerX; x--) {
      if (data[(y * w + x) * 4 + 3] > 80) {
        rX = x;
        break;
      }
    }
    rightBounds[y] = rX;
  }

  // Clear left shadow based on right symmetry and neutral gray check
  for (let y = 0; y < h; y++) {
    const rX = rightBounds[y];
    const halfWidth = rX > centerX ? (rX - centerX) : 160;
    const maxLeftX = centerX - halfWidth - 2;

    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] === 0) continue;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      // 1. Outside symmetric bottle boundary on the left
      if (x < maxLeftX) {
        data[idx + 3] = 0;
        continue;
      }

      // 2. Neutral gray shadow on left flank (diff <= 8, min >= 70)
      if (x < centerX - 35 && diff <= 8 && min >= 70) {
        data[idx + 3] = 0;
        continue;
      }

      // 3. Bottom studio shadow under the bottle base
      if (y > h * 0.90 && diff <= 10 && min >= 90) {
        data[idx + 3] = 0;
        continue;
      }

      // 4. Low alpha haze
      if (data[idx + 3] < 30) {
        data[idx + 3] = 0;
      }
    }
  }

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(cleaned).trim().toBuffer({ resolveWithObject: true });

  fs.writeFileSync('public/images/original_serenade.png', trimmed.data);

  const targetH = 515;
  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 40;
  const shadowSvg = `
  <svg width="${shadowW}" height="26" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.0" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.40}" ry="6" fill="#1b1209" opacity="0.60" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.25}" ry="3" fill="#080503" opacity="0.85" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 11 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 95 })
    .toFile('public/images/ghalati_serenade.jpg');

  console.log('Saved spotless public/images/ghalati_serenade.jpg!');
}

testSerenade();
