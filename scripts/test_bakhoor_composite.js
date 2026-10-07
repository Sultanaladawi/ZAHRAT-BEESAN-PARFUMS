const sharp = require('sharp');
const path = require('path');

async function compositeBakhoor() {
  const masterBgPath = path.join('public', 'images', 'ghalati_master_bg.jpg');
  const jarBuf = await sharp('./scripts/test_wasaef_cutout.png').trim().png().toBuffer();
  const resized = await sharp(jarBuf).resize({ height: 460, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 70;
  const shadowSvg = `
  <svg width="${shadowW}" height="34" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4.2" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="17" rx="${bW * 0.44}" ry="9" fill="#18110b" opacity="0.62" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="17" rx="${bW * 0.30}" ry="4.5" fill="#080503" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 35), top: baseContactY - 17 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile('./scripts/test_wasaef_podium.jpg');
  console.log('Saved ./scripts/test_wasaef_podium.jpg');
}

compositeBakhoor().catch(console.error);
