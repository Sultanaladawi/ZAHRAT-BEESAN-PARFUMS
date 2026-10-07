const sharp = require('sharp');
const path = require('path');

async function testConnectedComponent() {
  const { data, info } = await sharp('./scripts/test_oil_cutout.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Studio shadow removal outside the flacon body
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] === 0) continue;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      // In the oil flacon, the flacon is inside x: [0.38 * w, 0.62 * w]
      if ((x < w * 0.38 || x > w * 0.62) && diff <= 25) {
        data[idx + 3] = 0;
      }
      if (y > h * 0.72 && diff <= 15) {
        data[idx + 3] = 0;
      }
    }
  }

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(cleaned).trim().png().toBuffer();
  
  const masterBgPath = path.join('public', 'images', 'ghalati_master_bg.jpg');
  const resized = await sharp(trimmed).resize({ height: 440, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 60;
  const shadowSvg = `
  <svg width="${shadowW}" height="30" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.8" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.40}" ry="7.5" fill="#18110b" opacity="0.62" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.26}" ry="3.8" fill="#080503" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 30), top: baseContactY - 15 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile('./scripts/test_oil_flawless.jpg');
  console.log('Saved ./scripts/test_oil_flawless.jpg');
}

testConnectedComponent().catch(console.error);
