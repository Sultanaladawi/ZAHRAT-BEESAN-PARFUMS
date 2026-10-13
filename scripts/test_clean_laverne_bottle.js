const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const { refineCutout } = require('./lib/refine_cutout');
const fs = require('fs');
const path = require('path');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'laverne_master_bg.jpg');
const artDir = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592';

async function cleanAndComposite(imagePath, outName) {
  const buf = fs.readFileSync(imagePath);
  const normPng = await sharp(buf).resize({ width: 1000, height: 1000, fit: 'inside' }).png().toBuffer();
  const blob = new Blob([normPng], { type: 'image/png' });
  const cut = Buffer.from(await (await removeBackground(blob)).arrayBuffer());
  const { data, info } = await sharp(cut).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // 1. Find vertical centerline of cap/spray nozzle in top 15%..30%
  let capMinX = w, capMaxX = 0;
  for (let y = Math.round(h * 0.12); y < Math.round(h * 0.32); y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 180) {
        if (x < capMinX) capMinX = x;
        if (x > capMaxX) capMaxX = x;
      }
    }
  }
  const capCenterX = (capMaxX > capMinX) ? Math.round((capMinX + capMaxX) / 2) : Math.round(w / 2);

  // 2. Scan right side of bottle for width at each row y
  // In Laverne studio photography, the light is from top-right, so the right side is 100% clean and shadow-free!
  let maxRightY = 0;
  for (let y = 0; y < h; y++) {
    let rX = -1;
    for (let x = w - 1; x >= capCenterX; x--) {
      if (data[(y * w + x) * 4 + 3] > 160) {
        rX = x;
        break;
      }
    }
    if (rX > capCenterX) {
      const halfW = rX - capCenterX;
      if (y > maxRightY) maxRightY = y;
      // Slice off any leftward shadow that extends beyond halfW + 4 px
      const minAllowedLeftX = capCenterX - halfW - 3;
      for (let x = 0; x < minAllowedLeftX; x++) {
        data[(y * w + x) * 4 + 3] = 0;
      }
    } else {
      // Row is above cap or below bottle base on right -> clear left side too!
      for (let x = 0; x < w; x++) {
        data[(y * w + x) * 4 + 3] = 0;
      }
    }
  }

  // 3. Clear any floor shadow below maxRightY
  for (let y = maxRightY + 2; y < h; y++) {
    for (let x = 0; x < w; x++) {
      data[(y * w + x) * 4 + 3] = 0;
    }
  }

  const cleaned0 = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const refined = await refineCutout(cleaned0, { erode: 1, feather: 0.8 });
  const trimmed = await sharp(refined).trim().toBuffer({ resolveWithObject: true });

  // 4. Scale bottle to majestic luxury height (530px - 550px)
  const targetH = 540;
  const bH = targetH;
  const bW = Math.round(trimmed.info.width * targetH / trimmed.info.height);
  const resized = await sharp(trimmed.data)
    .resize(bW, bH, { kernel: 'lanczos3' })
    .toBuffer();

  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 44;
  const shadowH = 26;
  const shadowSvg = `
  <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.44}" ry="7" fill="#1b1209" opacity="0.65" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.28}" ry="3.5" fill="#080503" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const outPath = path.join(artDir, outName);
  await sharp(MASTER_BG_PATH)
    .composite([
      { input: shadowBuf, left: Math.round(left - 22), top: baseContactY - 12 },
      { input: resized, left, top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(outPath);

  console.log(`Saved ${outName} successfully!`);
}

async function run() {
  await cleanAndComposite(
    'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\raw_blue_laverne.jpg',
    'clean_blue_laverne_showcase.jpg'
  );
}

run().catch(console.error);
