const sharp = require('sharp');
const path = require('path');

async function testComposite() {
  const bgPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\ghalati_exact_replica_scene_1791220543384.jpg';
  const bottlePath = 'C:\\Users\\ECC\\Documents\\antigravity\\dazzling-carson\\zahrat-beesan-perfumes\\scripts\\purple_rose_clean.png';

  const bottleTrimmed = await sharp(bottlePath).trim().toBuffer({ resolveWithObject: true });

  // In ghalati_exact_replica_scene, the podium top is at y: 746
  // AI bottle was from y: 280 to 746 (height 466, width ~235)
  // Let's test target heights: 490, 510, 530
  for (const targetH of [490, 510, 530]) {
    const resizedBottle = await sharp(bottleTrimmed.data)
      .resize({ height: targetH })
      .toBuffer({ resolveWithObject: true });

    const bW = resizedBottle.info.width;
    const bH = resizedBottle.info.height;
    const left = Math.round((1024 - bW) / 2);
    const top = 746 - bH;

    console.log(`Height ${targetH}: left=${left}, top=${top}, width=${bW}, height=${bH}`);

    // Soft contact shadow on the marble
    const shadowW = bW + 60;
    const shadowH = 30;
    const shadowSvg = `
    <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.42}" ry="10" fill="#1e140a" opacity="0.6" filter="url(#f1)" />
      <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.28}" ry="5" fill="#0a0704" opacity="0.85" filter="url(#f2)" />
    </svg>
    `;
    const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

    const outPath = `C:\\Users\\ECC\\Documents\\antigravity\\dazzling-carson\\zahrat-beesan-perfumes\\scripts\\test_composite_${targetH}.jpg`;

    await sharp(bgPath)
      .composite([
        { input: shadowBuf, left: Math.round(left - 30), top: 736 },
        { input: resizedBottle.data, left: left, top: top }
      ])
      .jpeg({ quality: 98 })
      .toFile(outPath);

    console.log('Saved', outPath);
  }
}

testComposite().catch(console.error);
