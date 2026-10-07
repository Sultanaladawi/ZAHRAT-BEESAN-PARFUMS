const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function testImgly() {
  console.log('Running imgly on raw_vintage.jpg...');
  const blob = await removeBackground('scripts/raw_vintage.jpg');
  const buffer = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync('scripts/imgly_vintage.png', buffer);
  console.log('Saved scripts/imgly_vintage.png, size:', buffer.length);

  // Now let's check trim and composite
  const trimmed = await sharp(buffer).trim().toBuffer({ resolveWithObject: true });
  console.log('Trimmed size:', trimmed.info.width, 'x', trimmed.info.height);

  const targetH = 515;
  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 50;
  const shadowSvg = `
  <svg width="${shadowW}" height="30" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.5" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.42}" ry="8" fill="#1b1209" opacity="0.65" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.28}" ry="4" fill="#080503" opacity="0.9" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const masterBg = 'public/images/ghalati_master_bg.jpg';
  await sharp(masterBg)
    .composite([
      { input: shadowBuf, left: Math.round(left - 25), top: baseContactY - 14 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 95 })
    .toFile('scripts/test_vintage_imgly_podium.jpg');

  console.log('Saved scripts/test_vintage_imgly_podium.jpg!');
}

testImgly();
