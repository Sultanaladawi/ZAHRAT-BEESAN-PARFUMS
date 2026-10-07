const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const publicImagesDir = path.join(__dirname, '..', 'public', 'images');

const items = [
  { id: 'ambitious', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791309839372.png', targetH: 515 },
  { id: 'sublime-woods', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791309909022.png', targetH: 515 },
  { id: 'perfume-1985', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791309951755.png', targetH: 505 },
  { id: 'absolute-musk', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791310007290.png', targetH: 505 },
  { id: 'sublime-flowers', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791310054219.png', targetH: 515 }
];

async function run() {
  for (const item of items) {
    console.log(`Processing ${item.id}...`);
    const trimmed = await sharp(item.path).trim().toBuffer({ resolveWithObject: true });

    // Save as pristine original_<id>.png
    const origPngPath = path.join(publicImagesDir, `original_${item.id}.png`);
    fs.writeFileSync(origPngPath, trimmed.data);

    const resized = await sharp(trimmed.data)
      .resize({ height: item.targetH, kernel: 'lanczos3' })
      .toBuffer({ resolveWithObject: true });

    const bW = resized.info.width;
    const bH = resized.info.height;
    const left = Math.round((1024 - bW) / 2);
    const baseContactY = 746;
    const top = baseContactY - bH;

    const shadowW = bW + 40;
    const shadowSvg = Buffer.from(`
      <svg width="${shadowW}" height="26" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.0" /></filter>
          <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>
        <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.40}" ry="6" fill="#1b1209" opacity="0.60" filter="url(#f1)" />
        <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.25}" ry="3" fill="#080503" opacity="0.85" filter="url(#f2)" />
      </svg>
    `);
    const shadowBuf = await sharp(shadowSvg).png().toBuffer();

    const outJpg = path.join(publicImagesDir, `ghalati_${item.id}.jpg`);
    await sharp(masterBgPath)
      .composite([
        { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 11 },
        { input: resized.data, left: left, top: top }
      ])
      .jpeg({ quality: 96 })
      .toFile(outJpg);

    console.log(`✓ Successfully updated ${outJpg} (${bW}x${bH})`);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
