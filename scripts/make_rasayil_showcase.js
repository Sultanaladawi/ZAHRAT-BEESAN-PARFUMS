const sharp = require('sharp');
const fs = require('fs');

async function testRasayil() {
  const masterBg = 'public/images/ghalati_master_bg.jpg';
  const cutout = 'scripts/definitive_rasayil-haneen.png';
  
  // Trim all transparent borders first
  const trimmed = await sharp(cutout).trim().png().toBuffer({ resolveWithObject: true });
  fs.writeFileSync('scripts/definitive_rasayil-haneen_trimmed.png', trimmed.data);
  fs.copyFileSync('scripts/definitive_rasayil-haneen_trimmed.png', 'public/images/original_rasayil-haneen.png');

  const targetH = 540;
  const resized = await sharp(trimmed.data).resize({ height: targetH, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 748;
  const top = baseContactY - bH;

  const shadowW = bW + 60;
  const shadowSvg = `
  <svg width="${shadowW}" height="32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.8" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.42}" ry="8.5" fill="#18110b" opacity="0.62" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.28}" ry="4.2" fill="#080503" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const outJpg = 'public/images/ghalati_rasayil-haneen.jpg';
  await sharp(masterBg)
    .composite([
      { input: shadowBuf, left: Math.round(left - 30), top: baseContactY - 16 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(outJpg);

  fs.copyFileSync(outJpg, 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/ghalati_rasayil-haneen.jpg');
  console.log('Saved ghalati_rasayil-haneen.jpg with trimmed contact');
}

testRasayil().catch(console.error);
