const sharp = require('sharp');
const path = require('path');

async function cleanRajwa() {
  const { data, info } = await sharp('./scripts/test_rajwa_cutout.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] === 0) continue;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const diff = Math.max(r, g, b) - Math.min(r, g, b);
      const bright = (r + g + b) / 3;
      if (x < w * 0.45 && diff <= 12 && bright >= 75) {
        data[idx + 3] = 0;
      }
    }
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile('./scripts/test_rajwa_cleaned.png');

  const masterBgPath = path.join('public', 'images', 'ghalati_master_bg.jpg');
  const jarBuf = await sharp('./scripts/test_rajwa_cleaned.png').trim().png().toBuffer();
  const resized = await sharp(jarBuf).resize({ height: 500, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 70;
  const shadowSvg = `
  <svg width="${shadowW}" height="34" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4.2" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="17" rx="${bW * 0.44}" ry="9" fill="#18110b" opacity="0.62" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="17" rx="${bW * 0.30}" ry="4.5" fill="#080503" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 35), top: baseContactY - 17 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile('./scripts/test_rajwa_perfect.jpg');
  console.log('Saved ./scripts/test_rajwa_perfect.jpg');
}

cleanRajwa().catch(console.error);
