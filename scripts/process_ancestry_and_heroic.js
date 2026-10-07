const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const masterBgPath = path.join(publicImagesDir, 'ghalati_master_bg.jpg');

const uploadedImages = {
  ancestry: {
    id: 'ancestry-oud',
    bottlePath: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791362463953.png',
    boxPath: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791362480448.png',
    targetH: 510,
    rx1: 0.38,
    rx2: 0.24
  },
  heroic: {
    id: 'heroic',
    bottlePath: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791362513596.png',
    boxPath: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791362523658.png',
    targetH: 505,
    rx1: 0.40,
    rx2: 0.25
  }
};

async function processItem(item) {
  console.log(`\n========================================`);
  console.log(`Processing ${item.id}...`);

  // 1. Process box image: copy cleanly to public/images/box_<id>.png
  const boxDest = path.join(publicImagesDir, `box_${item.id}.png`);
  console.log(`Copying box image to ${boxDest}...`);
  fs.copyFileSync(item.boxPath, boxDest);

  // 2. Remove background from flacon image
  console.log(`Running background removal on flacon...`);
  const rawBuf = fs.readFileSync(item.bottlePath);
  const blob = new Blob([rawBuf], { type: 'image/png' });
  const bgBlob = await removeBackground(blob);
  const bgRemovedBuf = Buffer.from(await bgBlob.arrayBuffer());

  // 3. Clean any edge haze and trim
  const trimmed = await sharp(bgRemovedBuf).trim().toBuffer({ resolveWithObject: true });
  const origPngPath = path.join(publicImagesDir, `original_${item.id}.png`);
  fs.writeFileSync(origPngPath, trimmed.data);
  console.log(`Saved pristine flacon: ${origPngPath} (${trimmed.info.width}x${trimmed.info.height})`);

  // 4. Resize flacon for pedestal
  const resized = await sharp(trimmed.data)
    .resize({ height: item.targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  // 5. Generate luxury natural pedestal shadow
  const shadowW = bW + 40;
  const shadowSvg = `
  <svg width="${shadowW}" height="26" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.0" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * item.rx1}" ry="6" fill="#1b1209" opacity="0.60" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * item.rx2}" ry="3" fill="#080503" opacity="0.85" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  // 6. Ground onto royal podium template
  const outJpg = path.join(publicImagesDir, `ghalati_${item.id}.jpg`);
  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 11 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 95 })
    .toFile(outJpg);

  console.log(`✓ Master pedestal composite saved: ${outJpg}`);
}

async function run() {
  await processItem(uploadedImages.ancestry);
  await processItem(uploadedImages.heroic);

  // Also generate pyramid card for Ancestry Oud
  const ancestryCardSvg = `
  <svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f0c08"/>
        <stop offset="50%" stop-color="#18130d"/>
        <stop offset="100%" stop-color="#0a0805"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#d4af37"/>
        <stop offset="50%" stop-color="#fff3c4"/>
        <stop offset="100%" stop-color="#aa820a"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="1000" height="1000" fill="url(#bg)"/>
    <rect x="25" y="25" width="950" height="950" fill="none" stroke="#d4af37" stroke-width="1.5" opacity="0.3" rx="12"/>
    <rect x="35" y="35" width="930" height="930" fill="none" stroke="#d4af37" stroke-width="0.75" opacity="0.15" rx="8"/>

    <!-- Header -->
    <text x="500" y="110" font-size="20" fill="#d4af37" letter-spacing="4" text-anchor="middle" font-family="sans-serif">ZAHRAT BEESAN PARFUMS</text>
    <text x="500" y="165" font-size="34" font-weight="bold" fill="url(#gold)" text-anchor="middle" font-family="sans-serif">الهرم العطري • FRAGRANCE PYRAMID</text>
    <text x="500" y="210" font-size="24" fill="#ffffff" text-anchor="middle" font-family="sans-serif">عطر انسيستري عود (Ancestry Oud 200ml)</text>
    
    <line x1="200" y1="240" x2="800" y2="240" stroke="#d4af37" stroke-width="1" opacity="0.4"/>

    <!-- Top Notes -->
    <rect x="100" y="270" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
    <text x="500" y="315" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">الافتتاحية • TOP NOTES</text>
    <text x="500" y="375" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">إكليل الجبل العطري (Rosemary)</text>

    <!-- Heart Notes -->
    <rect x="100" y="460" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
    <text x="500" y="505" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قلب العطر • HEART NOTES</text>
    <text x="500" y="565" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">الزعفران النبيل الفاخر (Noble Saffron)</text>

    <!-- Base Notes -->
    <rect x="100" y="650" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
    <text x="500" y="695" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قاعدة العطر • BASE NOTES</text>
    <text x="500" y="755" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">العود الفاخر، العنبر الخشبي (Rich Oud &amp; Woody Amber)</text>

    <!-- Footer Prominent & Perfumer -->
    <rect x="100" y="840" width="800" height="90" fill="#ffffff" fill-opacity="0.02" stroke="#d4af37" stroke-width="0.5" stroke-opacity="0.15" rx="8"/>
    <text x="500" y="875" font-size="18" fill="#d4af37" text-anchor="middle" font-family="sans-serif">الروائح البارزة: العود الفاخر، الزعفران، إكليل الجبل</text>
    <text x="500" y="905" font-size="16" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">المجموعة الملكية الخاصة - الحجم الفاخر: 200 مل</text>
  </svg>
  `;

  const ancestryCardPath = path.join(publicImagesDir, 'pyramid_ancestry-oud.jpg');
  await sharp(Buffer.from(ancestryCardSvg))
    .jpeg({ quality: 95 })
    .toFile(ancestryCardPath);
  console.log(`✓ Generated pyramid card: ${ancestryCardPath}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
