const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { removeBackground } = require('@imgly/background-removal-node');

async function testOil() {
  const buf = fs.readFileSync('./scripts/sample_oil.png');
  const blob = new Blob([buf], { type: 'image/png' });
  const outBlob = await removeBackground(blob);
  const outBuf = Buffer.from(await outBlob.arrayBuffer());
  await sharp(outBuf).png().toFile('./scripts/test_oil_cutout.png');
  console.log('Cutout saved');

  const masterBgPath = path.join('public', 'images', 'ghalati_master_bg.jpg');
  const flaconBuf = await sharp('./scripts/test_oil_cutout.png').trim().png().toBuffer();
  const resized = await sharp(flaconBuf).resize({ height: 440, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 60;
  const shadowSvg = `
  <svg width="${shadowW}" height="30" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.8" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.40}" ry="7.5" fill="#18110b" opacity="0.62" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.26}" ry="3.8" fill="#080503" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 30), top: baseContactY - 15 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile('./scripts/test_oil_podium.jpg');
  console.log('Saved ./scripts/test_oil_podium.jpg');
}

testOil().catch(console.error);
