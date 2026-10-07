const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const uploadDir = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded';

async function processAll() {
  console.log('--- Processing Rasayil Wudd & Mountain Leather ---');

  // 1. Rasayil Wudd Box (closed red box)
  await sharp('scripts/ORL-00005459-2.jpg')
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_rasayil-wudd.jpg'));
  console.log('✓ Saved box_rasayil-wudd.jpg (1200x1200)');

  // 2. Rasayil Wudd Presentation (open red box showing podium)
  await sharp('scripts/ORL-00005459-3.jpg')
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_rasayil-wudd_presentation.jpg'));
  console.log('✓ Saved box_rasayil-wudd_presentation.jpg (1200x1200)');

  // 3. Mountain Leather Box (black & gold official box)
  const mlBoxSrc = path.join(uploadDir, 'media_1791368903433.jpg');
  await sharp(mlBoxSrc)
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_mountain-leather.jpg'));
  console.log('✓ Saved box_mountain-leather.jpg (1000x1000)');

  // 4. Pyramid Card for Rasayil Wudd
  const wuddSvg = `
<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#140b0b"/>
      <stop offset="50%" stop-color="#241212"/>
      <stop offset="100%" stop-color="#100808"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d4af37"/>
      <stop offset="50%" stop-color="#fff3c4"/>
      <stop offset="100%" stop-color="#aa820a"/>
    </linearGradient>
  </defs>

  <rect width="1000" height="1000" fill="url(#bg)"/>
  <rect x="25" y="25" width="950" height="950" fill="none" stroke="#d4af37" stroke-width="1.5" opacity="0.3" rx="12"/>
  <rect x="35" y="35" width="930" height="930" fill="none" stroke="#d4af37" stroke-width="0.75" opacity="0.15" rx="8"/>

  <text x="500" y="110" font-size="20" fill="#d4af37" letter-spacing="4" text-anchor="middle" font-family="sans-serif">ZAHRAT BEESAN PARFUMS</text>
  <text x="500" y="165" font-size="34" font-weight="bold" fill="url(#gold)" text-anchor="middle" font-family="sans-serif">الهرم العطري • FRAGRANCE PYRAMID</text>
  <text x="500" y="210" font-size="24" fill="#ffffff" text-anchor="middle" font-family="sans-serif">عطر رسائل ود (Rasayil Wudd)</text>
  
  <line x1="200" y1="240" x2="800" y2="240" stroke="#d4af37" stroke-width="1" opacity="0.4"/>

  <!-- Top -->
  <rect x="100" y="270" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="315" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">الافتتاحية • TOP NOTES</text>
  <text x="500" y="375" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">التوت البري اللذيذ، البرتقال، وجوز الهند الاستوائي</text>

  <!-- Heart -->
  <rect x="100" y="460" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="505" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قلب العطر • HEART NOTES</text>
  <text x="500" y="565" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">خشب الصندل الدافئ، زهر البرتقال، والزهور البيضاء</text>

  <!-- Base -->
  <rect x="100" y="650" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="695" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قاعدة العطر • BASE NOTES</text>
  <text x="500" y="755" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">العنبر الفاخر، المسك الصافي، العود النبيل، والفانيليا</text>

  <!-- Footer -->
  <rect x="100" y="840" width="800" height="90" fill="#ffffff" fill-opacity="0.02" stroke="#d4af37" stroke-width="0.5" stroke-opacity="0.15" rx="8"/>
  <text x="500" y="875" font-size="18" fill="#d4af37" text-anchor="middle" font-family="sans-serif">الروائح البارزة: التوت، خشب الصندل، العنبر، والعود</text>
  <text x="500" y="905" font-size="16" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">طابع العطر: شرقي فاكهي خشبي فاخر للجنسين • Eau De Parfum</text>
</svg>
  `.trim();

  await sharp(Buffer.from(wuddSvg))
    .jpeg({ quality: 95 })
    .toFile(path.join(publicImagesDir, 'pyramid_rasayil-wudd.jpg'));
  console.log('✓ Saved pyramid_rasayil-wudd.jpg');

  // 5. Pyramid Card for Mountain Leather
  const mlSvg = `
<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141108"/>
      <stop offset="50%" stop-color="#241d0f"/>
      <stop offset="100%" stop-color="#100d06"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d4af37"/>
      <stop offset="50%" stop-color="#fff3c4"/>
      <stop offset="100%" stop-color="#aa820a"/>
    </linearGradient>
  </defs>

  <rect width="1000" height="1000" fill="url(#bg)"/>
  <rect x="25" y="25" width="950" height="950" fill="none" stroke="#d4af37" stroke-width="1.5" opacity="0.3" rx="12"/>
  <rect x="35" y="35" width="930" height="930" fill="none" stroke="#d4af37" stroke-width="0.75" opacity="0.15" rx="8"/>

  <text x="500" y="110" font-size="20" fill="#d4af37" letter-spacing="4" text-anchor="middle" font-family="sans-serif">ZAHRAT BEESAN PARFUMS</text>
  <text x="500" y="165" font-size="34" font-weight="bold" fill="url(#gold)" text-anchor="middle" font-family="sans-serif">الهرم العطري • FRAGRANCE PYRAMID</text>
  <text x="500" y="210" font-size="24" fill="#ffffff" text-anchor="middle" font-family="sans-serif">عطر ماونتن ليذر (Mountain Leather)</text>
  
  <line x1="200" y1="240" x2="800" y2="240" stroke="#d4af37" stroke-width="1" opacity="0.4"/>

  <!-- Top -->
  <rect x="100" y="270" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="315" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">الافتتاحية • TOP NOTES</text>
  <text x="500" y="375" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">أروماتك نضر، التوابل الحارة، والنفحات التابلية المنعشة</text>

  <!-- Heart -->
  <rect x="100" y="460" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="505" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قلب العطر • HEART NOTES</text>
  <text x="500" y="565" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">الجلود الإيطالية الفاخرة (الليذر) والأخشاب النبيلة</text>

  <!-- Base -->
  <rect x="100" y="650" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="695" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قاعدة العطر • BASE NOTES</text>
  <text x="500" y="755" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">العنبر الكهرماني الدافئ وخشب الأرز العطري</text>

  <!-- Footer -->
  <rect x="100" y="840" width="800" height="90" fill="#ffffff" fill-opacity="0.02" stroke="#d4af37" stroke-width="0.5" stroke-opacity="0.15" rx="8"/>
  <text x="500" y="875" font-size="18" fill="#d4af37" text-anchor="middle" font-family="sans-serif">الروائح البارزة: الجلود الفاخرة، العنبر، والتابلي المنعش</text>
  <text x="500" y="905" font-size="16" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">طابع العطر: عطر جلدي أروماتك فخم للجنسين • Eau De Parfum</text>
</svg>
  `.trim();

  await sharp(Buffer.from(mlSvg))
    .jpeg({ quality: 95 })
    .toFile(path.join(publicImagesDir, 'pyramid_mountain-leather.jpg'));
  console.log('✓ Saved pyramid_mountain-leather.jpg');

  // 6. Update perfumes.json
  const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

  // Rasayil Wudd
  const wudd = perfumes.find(p => p.id === 'rasayil-wudd');
  if (wudd) {
    wudd.boxImage = 'images/box_rasayil-wudd.jpg';
    wudd.fragranticaCard = 'images/pyramid_rasayil-wudd.jpg';
    wudd.galleryImages = ['images/box_rasayil-wudd_presentation.jpg'];
    wudd.opening = "التوت البري والبرتقال وجوز الهند";
    wudd.heart = "خشب الصندل وزهرة البرتقال وزهور بيضاء";
    wudd.base = "العنبر والمسك والعود والفانيلا";
    wudd.prominent = "التوت وخشب الصندل والعنبر والعود";
    console.log('✓ Updated rasayil-wudd in catalog');
  }

  // Mountain Leather
  const ml = perfumes.find(p => p.id === 'mountain-leather');
  if (ml) {
    ml.boxImage = 'images/box_mountain-leather.jpg';
    ml.fragranticaCard = 'images/pyramid_mountain-leather.jpg';
    console.log('✓ Updated mountain-leather in catalog');
  }

  // Deduplication check
  perfumes.forEach(p => {
    const seen = new Set();
    if (p.image) seen.add(p.image);
    if (p.boxImage) {
      if (seen.has(p.boxImage)) p.boxImage = null;
      else seen.add(p.boxImage);
    }
    if (p.originalImage) {
      if (seen.has(p.originalImage)) p.originalImage = null;
      else seen.add(p.originalImage);
    }
    if (p.fragranticaCard) {
      if (seen.has(p.fragranticaCard)) p.fragranticaCard = null;
      else seen.add(p.fragranticaCard);
    }
    if (Array.isArray(p.galleryImages)) {
      p.galleryImages = p.galleryImages.filter(img => {
        if (!img || seen.has(img)) return false;
        seen.add(img);
        return true;
      });
    }
  });

  fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
  console.log('✓ Saved perfumes.json successfully!');
}

processAll().catch(console.error);
