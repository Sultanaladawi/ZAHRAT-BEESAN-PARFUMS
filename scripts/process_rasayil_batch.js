const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');

async function processRasayil() {
  console.log('--- Processing Rasayil Batch ---');

  // 1. Rasayil Haneen Box (closed white box)
  await sharp('scripts/ORL-00005469-2.jpg')
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_rasayil-haneen.jpg'));
  console.log('✓ Saved box_rasayil-haneen.jpg (1200x1200)');

  // 2. Rasayil Haneen Presentation (open white box showing podium)
  await sharp('scripts/ORL-00005469-3.jpg')
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_rasayil-haneen_presentation.jpg'));
  console.log('✓ Saved box_rasayil-haneen_presentation.jpg (1200x1200)');

  // 3. Rasayil Shawq Box (closed black box)
  await sharp('scripts/ORL-00005451-2.jpg')
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_rasayil-shawq.jpg'));
  console.log('✓ Saved box_rasayil-shawq.jpg (1200x1200)');

  // 4. Rasayil Shawq Presentation (open black box showing podium)
  await sharp('scripts/ORL-00005451-3.jpg')
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_rasayil-shawq_presentation.jpg'));
  console.log('✓ Saved box_rasayil-shawq_presentation.jpg (1200x1200)');

  // 5. Pyramid Card for Rasayil Haneen
  const haneenSvg = `
<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14110e"/>
      <stop offset="50%" stop-color="#241e17"/>
      <stop offset="100%" stop-color="#0f0c09"/>
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
  <text x="500" y="210" font-size="24" fill="#ffffff" text-anchor="middle" font-family="sans-serif">عطر رسائل حنين (Rasayil Haneen)</text>
  
  <line x1="200" y1="240" x2="800" y2="240" stroke="#d4af37" stroke-width="1" opacity="0.4"/>

  <!-- Top -->
  <rect x="100" y="270" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="315" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">الافتتاحية • TOP NOTES</text>
  <text x="500" y="375" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">البرغموت الإيطالي المنعش والنفحات الحمضية الحيوية</text>

  <!-- Heart -->
  <rect x="100" y="460" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="505" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قلب العطر • HEART NOTES</text>
  <text x="500" y="565" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">زهر البرتقال النضر وعبير الياسمين والزهور البيضاء</text>

  <!-- Base -->
  <rect x="100" y="650" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="695" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قاعدة العطر • BASE NOTES</text>
  <text x="500" y="755" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">التفاح الأخضر المنعش وأوراق الباتشولي الدافئة</text>

  <!-- Footer -->
  <rect x="100" y="840" width="800" height="90" fill="#ffffff" fill-opacity="0.02" stroke="#d4af37" stroke-width="0.5" stroke-opacity="0.15" rx="8"/>
  <text x="500" y="875" font-size="18" fill="#d4af37" text-anchor="middle" font-family="sans-serif">الروائح البارزة: البرغموت، زهر البرتقال، التفاح، والباتشولي</text>
  <text x="500" y="905" font-size="16" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">طابع العطر: عطر فرنسي منعش وأنيق للجنسين • Eau De Parfum</text>
</svg>
  `.trim();

  await sharp(Buffer.from(haneenSvg))
    .jpeg({ quality: 95 })
    .toFile(path.join(publicImagesDir, 'pyramid_rasayil-haneen.jpg'));
  console.log('✓ Saved pyramid_rasayil-haneen.jpg');

  // 6. Pyramid Card for Rasayil Shawq
  const shawqSvg = `
<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#140f0c"/>
      <stop offset="50%" stop-color="#261811"/>
      <stop offset="100%" stop-color="#100b08"/>
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
  <text x="500" y="210" font-size="24" fill="#ffffff" text-anchor="middle" font-family="sans-serif">عطر رسائل شوق (Rasayil Shawq)</text>
  
  <line x1="200" y1="240" x2="800" y2="240" stroke="#d4af37" stroke-width="1" opacity="0.4"/>

  <!-- Top -->
  <rect x="100" y="270" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="315" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">الافتتاحية • TOP NOTES</text>
  <text x="500" y="375" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">الخوخ المخملي، الكراميل الغني، والفراولة البرية</text>

  <!-- Heart -->
  <rect x="100" y="460" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="505" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قلب العطر • HEART NOTES</text>
  <text x="500" y="565" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">الزعفران النبيل، العنبر الدافئ، والورد الفاتن</text>

  <!-- Base -->
  <rect x="100" y="650" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="695" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قاعدة العطر • BASE NOTES</text>
  <text x="500" y="755" font-size="22" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">الباتشولي الإندونيسي والجلد الفاخر (الروائح الجلدية)</text>

  <!-- Footer -->
  <rect x="100" y="840" width="800" height="90" fill="#ffffff" fill-opacity="0.02" stroke="#d4af37" stroke-width="0.5" stroke-opacity="0.15" rx="8"/>
  <text x="500" y="875" font-size="18" fill="#d4af37" text-anchor="middle" font-family="sans-serif">الروائح البارزة: الكراميل، الخوخ، الزعفران، والجلد الفاخر</text>
  <text x="500" y="905" font-size="16" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">طابع العطر: شرقي جلدي فاخر للجنسين • Eau De Parfum</text>
</svg>
  `.trim();

  await sharp(Buffer.from(shawqSvg))
    .jpeg({ quality: 95 })
    .toFile(path.join(publicImagesDir, 'pyramid_rasayil-shawq.jpg'));
  console.log('✓ Saved pyramid_rasayil-shawq.jpg');

  // 7. Update perfumes.json
  const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

  // Rasayil Haneen
  const haneen = perfumes.find(p => p.id === 'rasayil-haneen');
  if (haneen) {
    haneen.boxImage = 'images/box_rasayil-haneen.jpg';
    haneen.fragranticaCard = 'images/pyramid_rasayil-haneen.jpg';
    haneen.galleryImages = ['images/box_rasayil-haneen_presentation.jpg'];
    haneen.overview = "رسائل حنين عطر منعش يتحدى الجاذبية فتراقصها نسمة هواء محملة بعبير الازهار والياسمين لخلق أثر عطري رائع يذهب بحواسك بعيداً إلى عالم مليء بالجمال وفرحاً منعشاً للروح.";
    haneen.opening = "برغموت ونفحات حمضية منعشة";
    haneen.heart = "زهر البرتقال وعبير الياسمين والزهور";
    haneen.base = "التفاح الأخضر والباتشولي";
    haneen.prominent = "البرغموت وزهر البرتقال والتفاح والباتشولي";
    console.log('✓ Updated rasayil-haneen in catalog');
  }

  // Rasayil Shawq
  const shawq = perfumes.find(p => p.id === 'rasayil-shawq');
  if (shawq) {
    shawq.boxImage = 'images/box_rasayil-shawq.jpg';
    shawq.fragranticaCard = 'images/pyramid_rasayil-shawq.jpg';
    shawq.galleryImages = ['images/box_rasayil-shawq_presentation.jpg'];
    shawq.overview = "عطر رسائل شوق: رحلة عاطفية تنبض بالمشاعر. يأخذك عطر رسائل شوق في رحلة مدهشة من الأحاسيس العميقة والمشاعر الصادقة، يتميز بمزيج ساحر من الفواكه، الكراميل، والزهور الفاتنة مع قاعدة دافئة من الجلد والباتشولي.";
    shawq.opening = "خوخ وكراميل وفراولة برية";
    shawq.heart = "زعفران وعنبر وورد فاتن";
    shawq.base = "باتشولي وجلد فاخر (ليذر)";
    shawq.prominent = "الكراميل والخوخ والزعفران والجلد الفاخر";
    console.log('✓ Updated rasayil-shawq in catalog');
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

processRasayil().catch(console.error);
