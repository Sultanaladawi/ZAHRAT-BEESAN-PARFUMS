const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const masterBgPath = path.join(publicImagesDir, 'ghalati_master_bg.jpg');

async function processLayanaFlacon() {
  console.log('Processing Layana flacon...');
  const flaconPath = path.join(__dirname, 'temp_perfume_79187.jpg');
  const rawBuf = fs.readFileSync(flaconPath);
  
  console.log('Running AI background removal...');
  const blob = new Blob([rawBuf], { type: 'image/jpeg' });
  const bgBlob = await removeBackground(blob);
  const bgRemovedBuf = Buffer.from(await bgBlob.arrayBuffer());

  // Inspect and remove bottom reflection if any
  const { data, info } = await sharp(bgRemovedBuf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  console.log('Bg removed size:', w, h);

  // In temp_perfume_79187.jpg, let's find the bottom edge of the glass bottle base
  // The glass base ends around row 1530-1540 (where y / h ~ 0.86)
  // Below that is the table reflection
  for (let y = Math.round(h * 0.88); y < h; y++) {
    for (let x = 0; x < w; x++) {
      data[(y * w + x) * 4 + 3] = 0;
    }
  }

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .trim()
    .toBuffer({ resolveWithObject: true });

  const origPng = path.join(publicImagesDir, 'original_layana.png');
  fs.writeFileSync(origPng, cleaned.data);
  console.log(`Saved original_layana.png: ${cleaned.info.width}x${cleaned.info.height}`);

  // Composite onto podium
  const targetH = 515;
  const resized = await sharp(cleaned.data)
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

  const outJpg = path.join(publicImagesDir, 'ghalati_layana.jpg');
  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 11 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96 })
    .toFile(outJpg);

  console.log(`✓ Pristine ghalati_layana.jpg saved`);
}

processLayanaFlacon().catch(console.error);
