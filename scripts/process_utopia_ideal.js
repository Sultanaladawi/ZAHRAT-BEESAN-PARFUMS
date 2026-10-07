const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const masterBgPath = path.join(publicImagesDir, 'ghalati_master_bg.jpg');

async function processUtopiaIdeal() {
  console.log('Processing Utopia Ideal flacon...');

  // Use the 660x1000 webp or 750x750 png
  const webpPath = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791368385730.webp';
  
  // Trim transparent padding
  const trimmed = await sharp(webpPath)
    .trim()
    .png()
    .toBuffer({ resolveWithObject: true });

  console.log(`Trimmed size: ${trimmed.info.width}x${trimmed.info.height}`);

  const originalPng = path.join(publicImagesDir, 'original_utopia-ideal.png');
  fs.writeFileSync(originalPng, trimmed.data);
  console.log('✓ Saved original_utopia-ideal.png');

  // Composite onto podium
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
  const shadowSvg = `<svg width="${shadowW}" height="26" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.0" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
    </defs>
    <ellipse cx="${Math.round(shadowW / 2)}" cy="13" rx="${Math.round(bW * 0.38)}" ry="6" fill="#1b1209" opacity="0.60" filter="url(#f1)" />
    <ellipse cx="${Math.round(shadowW / 2)}" cy="13" rx="${Math.round(bW * 0.24)}" ry="3" fill="#080503" opacity="0.85" filter="url(#f2)" />
  </svg>`.trim();
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const outJpg = path.join(publicImagesDir, 'ghalati_utopia-ideal.jpg');
  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 11 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96 })
    .toFile(outJpg);

  console.log('✓ Saved ghalati_utopia-ideal.jpg');

  // Generate Pyramid Card
  const pyramidSvg = `
<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0e14"/>
      <stop offset="50%" stop-color="#121824"/>
      <stop offset="100%" stop-color="#080a0f"/>
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
  <text x="500" y="210" font-size="24" fill="#ffffff" text-anchor="middle" font-family="sans-serif">عطر يوتوبيا ايديال (Utopia Ideal)</text>
  
  <line x1="200" y1="240" x2="800" y2="240" stroke="#d4af37" stroke-width="1" opacity="0.4"/>

  <!-- Top Notes -->
  <rect x="100" y="270" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="315" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">الافتتاحية • TOP NOTES</text>
  <text x="500" y="375" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">البرغموت الإيطالي والفلفل الأسود الحار</text>

  <!-- Heart Notes -->
  <rect x="100" y="460" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="505" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قلب العطر • HEART NOTES</text>
  <text x="500" y="565" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">الخزامى (اللافندر) العطري وأوراق الباتشولي</text>

  <!-- Base Notes -->
  <rect x="100" y="650" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="695" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قاعدة العطر • BASE NOTES</text>
  <text x="500" y="755" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">العنبر الفاخر، خشب الأرز النبيل، والمسك الحريري</text>

  <!-- Footer Prominent & Perfumer -->
  <rect x="100" y="840" width="800" height="90" fill="#ffffff" fill-opacity="0.02" stroke="#d4af37" stroke-width="0.5" stroke-opacity="0.15" rx="8"/>
  <text x="500" y="875" font-size="18" fill="#d4af37" text-anchor="middle" font-family="sans-serif">الروائح البارزة: البرغموت، الفلفل، اللافندر، وخشب الأرز</text>
  <text x="500" y="905" font-size="16" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">طابع العطر: خشبي أروماتي فاخر للرجال • Eau De Parfum</text>
</svg>
  `.trim();

  await sharp(Buffer.from(pyramidSvg))
    .jpeg({ quality: 95 })
    .toFile(path.join(publicImagesDir, 'pyramid_utopia-ideal.jpg'));

  console.log('✓ Saved pyramid_utopia-ideal.jpg');

  // Convert notes images for Utopia Platinum & Gist
  await sharp('scripts/raw_utopia_platinum_notes.jpg')
    .jpeg({ quality: 95 })
    .toFile(path.join(publicImagesDir, 'utopia-platinum_notes.jpg'));
  console.log('✓ Saved utopia-platinum_notes.jpg');

  await sharp('scripts/raw_utopia_gist_notes.jpg')
    .jpeg({ quality: 95 })
    .toFile(path.join(publicImagesDir, 'utopia-gist_notes.jpg'));
  console.log('✓ Saved utopia-gist_notes.jpg');
}

processUtopiaIdeal().catch(console.error);
