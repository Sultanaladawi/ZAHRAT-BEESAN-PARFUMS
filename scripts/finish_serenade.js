const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function finishSerenade() {
  const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
  const buf = fs.readFileSync('scripts/imgly_serenade.png');

  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Clear studio shadows & noise
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] === 0) continue;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      // Studio drop shadow on left or bottom
      if (diff <= 8 && min >= 70 && (x < w * 0.38 || y > h * 0.88)) {
        data[idx + 3] = 0;
      }
      if (data[idx + 3] < 30) data[idx + 3] = 0;
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

finishSerenade();
