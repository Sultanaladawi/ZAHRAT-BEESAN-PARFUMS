const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function fix() {
  const file = path.join(__dirname, '..', 'public', 'images', 'original_layana.png');
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  for (let y = 1250; y < h; y++) {
    for (let x = 0; x < w; x++) {
      data[(y * w + x) * 4 + 3] = 0;
    }
  }
  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().trim().toBuffer({ resolveWithObject: true });
  fs.writeFileSync(file, cleaned.data);
  console.log('Updated original_layana.png:', cleaned.info.width, cleaned.info.height);

  const targetH = 515;
  const resized = await sharp(cleaned.data).resize({ height: targetH, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
  const bW = resized.info.width, bH = resized.info.height;
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
  await sharp(path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg'))
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 11 },
      { input: resized.data, left, top }
    ])
    .jpeg({ quality: 96 })
    .toFile(path.join(__dirname, '..', 'public', 'images', 'ghalati_layana.jpg'));
  console.log('Updated ghalati_layana.jpg successfully');
}

fix().catch(console.error);
