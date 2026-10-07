const sharp = require('sharp');
const fs = require('fs');

async function processAncestryOud() {
  const inputPng = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791371514466.png';
  
  // 1. Backup old 200ml flacon
  if (fs.existsSync('public/images/original_ancestry-oud.png') && !fs.existsSync('public/images/original_ancestry-oud_200ml.png')) {
    fs.copyFileSync('public/images/original_ancestry-oud.png', 'public/images/original_ancestry-oud_200ml.png');
    console.log('Backed up original 200ml flacon');
  }

  // 2. Trim transparent borders of the new 100ml master flacon
  const trimmed = await sharp(inputPng)
    .trim()
    .toBuffer({ resolveWithObject: true });

  fs.writeFileSync('public/images/original_ancestry-oud.png', trimmed.data);
  console.log('Saved trimmed original_ancestry-oud.png, size:', trimmed.info.width, 'x', trimmed.info.height);

  // 3. Resize for podium composite (height 515)
  const targetH = 515;
  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 60;
  const shadowH = 30;
  const shadowSvg = `
  <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4.0" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.44}" ry="8" fill="#1b1209" opacity="0.65" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.28}" ry="4" fill="#080503" opacity="0.9" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const masterBg = 'public/images/ghalati_master_bg.jpg';
  await sharp(masterBg)
    .composite([
      { input: shadowBuf, left: Math.round(left - 30), top: baseContactY - 14 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 95 })
    .toFile('public/images/ghalati_ancestry-oud.jpg');

  console.log('Successfully composited and saved public/images/ghalati_ancestry-oud.jpg');

  // 4. Update perfumes.json
  const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
  const pAncestry = perfumes.find(p => p.id === 'ancestry-oud');
  if (pAncestry) {
    pAncestry.image = 'images/ghalati_ancestry-oud.jpg';
    pAncestry.originalImage = 'images/original_ancestry-oud.png';
    pAncestry.galleryImages = ['images/original_ancestry-oud_200ml.png'];
    pAncestry.specs.size = '100 مل / 200 مل';
    pAncestry.specsEn.size = '100ml / 200ml';
  }
  fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
  console.log('Updated perfumes.json for ancestry-oud');
}

processAncestryOud().catch(err => console.error(err));
