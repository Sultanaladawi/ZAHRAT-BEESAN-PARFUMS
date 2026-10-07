const sharp = require('sharp');
const fs = require('fs');

async function processHeroic() {
  const inputPng = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791370775267.png';
  
  // 1. Trim transparent borders
  const trimmed = await sharp(inputPng)
    .trim()
    .toBuffer({ resolveWithObject: true });

  fs.writeFileSync('public/images/original_heroic.png', trimmed.data);
  console.log('Saved trimmed original_heroic.png, size:', trimmed.info.width, 'x', trimmed.info.height);

  // 2. Resize for podium composite (height 515)
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
    .toFile('public/images/ghalati_heroic.jpg');

  console.log('Successfully composited and saved public/images/ghalati_heroic.jpg');

  // 3. Update perfumes.json
  const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
  const pHeroic = perfumes.find(p => p.id === 'heroic');
  if (pHeroic) {
    pHeroic.image = 'images/ghalati_heroic.jpg';
    pHeroic.originalImage = 'images/original_heroic.png';
    pHeroic.boxImage = 'images/box_heroic.png';
    pHeroic.fragranticaCard = 'images/card_heroic.jpg';
  }
  fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
  console.log('Updated perfumes.json for heroic');
}

processHeroic().catch(err => console.error(err));
