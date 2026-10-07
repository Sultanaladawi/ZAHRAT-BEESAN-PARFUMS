const sharp = require('sharp');
const fs = require('fs');

async function extractUserImages() {
  const fNowara = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791283903282.png';
  const fTrio = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791284015533.png';
  const fMajestic = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791284050478.png';

  // 1. Nowara
  const trimNowara = await sharp(fNowara).trim().png().toBuffer();
  fs.writeFileSync('scripts/user_nowara.png', trimNowara);
  console.log('Saved user_nowara.png');

  // 2. Majestic Woods
  const trimMajestic = await sharp(fMajestic).trim().png().toBuffer();
  fs.writeFileSync('scripts/user_majestic-wood.png', trimMajestic);
  console.log('Saved user_majestic-wood.png');

  // 3. Raslan (x from 340 to 670)
  const raslanBuf = await sharp(fTrio)
    .extract({ left: 340, top: 0, width: 330, height: 682 })
    .trim()
    .png()
    .toBuffer();
  fs.writeFileSync('scripts/user_raslan.png', raslanBuf);
  console.log('Saved user_raslan.png');

  // 4. Amber Cashmere (x from 680 to 1024 -> width = 344)
  const amberBuf = await sharp(fTrio)
    .extract({ left: 680, top: 0, width: 344, height: 682 })
    .trim()
    .png()
    .toBuffer();
  fs.writeFileSync('scripts/user_amber-cashmere.png', amberBuf);
  console.log('Saved user_amber-cashmere.png');
}

extractUserImages().catch(console.error);
