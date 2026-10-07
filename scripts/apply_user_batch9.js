const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const perfumesJsonPath = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');

const items = [
  { id: 'silk-essence', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791312604977.png', targetH: 515 },
  { id: 'amber-oud', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791312657304.png', targetH: 515 },
  { id: 'cartage-noble', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791312717201.png', targetH: 510 },
  { id: 'honest', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791312894159.png', targetH: 515 },
  { id: 'rasayil-haneen', path: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791314005294.png', targetH: 540 }
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

  // Ensure rasayil-haneen is in perfumes.json
  const perfumes = JSON.parse(fs.readFileSync(perfumesJsonPath, 'utf8'));
  const existsHaneen = perfumes.find(p => p.id === 'rasayil-haneen');
  if (!existsHaneen) {
    const wuddIdx = perfumes.findIndex(p => p.id === 'rasayil-wudd');
    const haneenProduct = {
      id: 'rasayil-haneen',
      title: 'عطر رسائل حنين',
      titleEn: 'Rasayil Haneen Eau De Parfum',
      brand: 'دار غلاتي (Ghalati)',
      sarPrice: 95,
      baseJod: 18,
      finalJod: 30,
      url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D8%B3%D8%A7%D8%A6%D9%84-%D8%AD%D9%86%D9%8A%D9%86/p204859123',
      bottleUrl: 'https://cdn.salla.sa/Dqvgy/36e5830d-6cb9-4153-8b85-c1bc6df6fab4-1000x1000-ePLIem4e83On0kDlykE9Qh9b33qeZogYnwCEBAY1.png',
      overview: 'تحفة شرقية كلاسيكية بقارورة كريستالية شفافة وشعلة ذهبية تعبر عن أسمى مشاعر الحنين والدفء مع توليفة ملكية من دهن العود والزعفران والمسك الملكي.',
      opening: 'زعفران أحمر، هيل هندي، ونفحات ورد ندي',
      heart: 'عود فاخر، ياسمين، وباتشولي',
      base: 'عنبر دافئ، مسك ملكي، وفانيليا غنية',
      prominent: 'الزعفران، دهن العود، والمسك الملكي',
      specs: {
        origin: 'المملكة العربية السعودية',
        category: 'للجنسين',
        size: '100 مل',
        type: 'عطر شرقي دافئ ملكي'
      },
      overviewEn: 'A classic royal oriental masterpiece in a clear crystal gold-flame bottle, expressing deep feelings of yearning with notes of royal oud, saffron, amber, and musk.',
      openingEn: 'Red Saffron, Indian Cardamom, Fresh Dewy Rose',
      heartEn: 'Precious Oud, Jasmine, Patchouli',
      baseEn: 'Warm Amber, Royal Musk, Rich Vanilla',
      prominentEn: 'Saffron, Precious Oud, Royal Musk',
      specsEn: {
        origin: 'Kingdom of Saudi Arabia',
        category: 'Unisex',
        size: '100 ml',
        type: 'Warm Royal Oriental Eau De Parfum'
      },
      image: 'images/ghalati_rasayil-haneen.jpg',
      originalImage: 'images/original_rasayil-haneen.png',
      galleryImages: [],
      categoryType: 'perfume'
    };
    if (wuddIdx !== -1) {
      perfumes.splice(wuddIdx + 1, 0, haneenProduct);
    } else {
      perfumes.unshift(haneenProduct);
    }
    fs.writeFileSync(perfumesJsonPath, JSON.stringify(perfumes, null, 2), 'utf8');
    console.log(`✓ Added rasayil-haneen to perfumes.json (Total products: ${perfumes.length})`);
  } else {
    existsHaneen.image = 'images/ghalati_rasayil-haneen.jpg';
    existsHaneen.originalImage = 'images/original_rasayil-haneen.png';
    fs.writeFileSync(perfumesJsonPath, JSON.stringify(perfumes, null, 2), 'utf8');
    console.log(`✓ Updated rasayil-haneen image in perfumes.json`);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
