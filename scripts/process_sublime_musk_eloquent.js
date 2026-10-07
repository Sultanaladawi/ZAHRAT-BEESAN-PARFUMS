const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const uploadDir = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded';

async function processAll() {
  console.log('--- Processing Sublime Woods, Absolute Musk & Eloquent ---');

  // 1. Sublime Woods Box (media_1791368984293.png - 750x750 alpha)
  const sublimeBoxSrc = path.join(uploadDir, 'media_1791368984293.png');
  await sharp(sublimeBoxSrc)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_sublime-woods.jpg'));
  console.log('✓ Saved box_sublime-woods.jpg (750x750)');

  // 2. Absolute Musk Box (ORL-00005457-2.jpg - 1200x1200)
  await sharp('scripts/ORL-00005457-2.jpg')
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_absolute-musk.jpg'));
  console.log('✓ Saved box_absolute-musk.jpg (1200x1200)');

  // 3. Absolute Musk Box Detail (ORL-00005457-4.jpg - 1200x1200)
  await sharp('scripts/ORL-00005457-4.jpg')
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_absolute-musk_detail.jpg'));
  console.log('✓ Saved box_absolute-musk_detail.jpg (1200x1200)');

  // 4. Eloquent Fragrantica Card (media_1791369219320.jpg - 1024x1024)
  const eloCardSrc = path.join(uploadDir, 'media_1791369219320.jpg');
  await sharp(eloCardSrc)
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'card_eloquent.jpg'));
  console.log('✓ Saved card_eloquent.jpg (1024x1024)');

  // 5. Pyramid Card for Absolute Musk
  const muskSvg = `
<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#121316"/>
      <stop offset="50%" stop-color="#1c1e24"/>
      <stop offset="100%" stop-color="#0f1013"/>
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
  <text x="500" y="210" font-size="24" fill="#ffffff" text-anchor="middle" font-family="sans-serif">عطر ابسيليوت مسك (Absolute Musk)</text>
  
  <line x1="200" y1="240" x2="800" y2="240" stroke="#d4af37" stroke-width="1" opacity="0.4"/>

  <!-- Top -->
  <rect x="100" y="270" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="315" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">الافتتاحية • TOP NOTES</text>
  <text x="500" y="375" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">البرغموت الإيطالي المنعش والكمثرى المقرمشة النضرة</text>

  <!-- Heart -->
  <rect x="100" y="460" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="505" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قلب العطر • HEART NOTES</text>
  <text x="500" y="565" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">الياسمين الأبيض الفاتن، زهور السوسن (الآيريس)، واليلانغ يلانغ</text>

  <!-- Base -->
  <rect x="100" y="650" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="695" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قاعدة العطر • BASE NOTES</text>
  <text x="500" y="755" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">المسك الأبيض الصافي النقي، العنبر الدافئ، والأخشاب العطرية</text>

  <!-- Footer -->
  <rect x="100" y="840" width="800" height="90" fill="#ffffff" fill-opacity="0.02" stroke="#d4af37" stroke-width="0.5" stroke-opacity="0.15" rx="8"/>
  <text x="500" y="875" font-size="18" fill="#d4af37" text-anchor="middle" font-family="sans-serif">الروائح البارزة: المسك الأبيض، السوسن البودري، والكمثرى النضرة</text>
  <text x="500" y="905" font-size="16" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">طابع العطر: مسكي زهري فاخر للجنسين • Eau De Parfum</text>
</svg>
  `.trim();

  await sharp(Buffer.from(muskSvg))
    .jpeg({ quality: 95 })
    .toFile(path.join(publicImagesDir, 'pyramid_absolute-musk.jpg'));
  console.log('✓ Saved pyramid_absolute-musk.jpg');

  // 6. Update perfumes.json
  const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

  // Sublime Woods
  const sw = perfumes.find(p => p.id === 'sublime-woods');
  if (sw) {
    sw.boxImage = 'images/box_sublime-woods.jpg';
    console.log('✓ Updated sublime-woods boxImage');
  }

  // Absolute Musk
  const am = perfumes.find(p => p.id === 'absolute-musk');
  if (am) {
    am.boxImage = 'images/box_absolute-musk.jpg';
    am.fragranticaCard = 'images/pyramid_absolute-musk.jpg';
    am.galleryImages = ['images/box_absolute-musk_detail.jpg'];
    am.opening = "البرغموت والكمثرى النضرة";
    am.heart = "ياسمين وأزهار السوسن (الآيريس) واليلانغ يلانغ";
    am.base = "المسك الأبيض الصافي والعنبر والأخشاب";
    am.prominent = "المسك الأبيض والسوسن والكمثرى";
    console.log('✓ Updated absolute-musk in catalog');
  }

  // Eloquent
  const elo = perfumes.find(p => p.id === 'eloquent');
  if (elo) {
    elo.fragranticaCard = 'images/card_eloquent.jpg';
    console.log('✓ Updated eloquent fragranticaCard');
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
