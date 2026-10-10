const sharp = require('sharp');
const path = require('path');

async function makeAssafMasterBg() {
  const ghalatiBg = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
  const outBg = path.join(__dirname, '..', 'public', 'images', 'assaf_master_bg.jpg');

  const { data, info } = await sharp(ghalatiBg).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const c = info.channels;

  // Wipe old text inside the pill: y = 944..993, x = 342..680
  for (let y = 944; y <= 993; y++) {
    const idxL = (y * w + 340) * c;
    const idxR = (y * w + 682) * c;
    const rBg = Math.round((data[idxL] + data[idxR]) / 2);
    const gBg = Math.round((data[idxL + 1] + data[idxR + 1]) / 2);
    const bBg = Math.round((data[idxL + 2] + data[idxR + 2]) / 2);

    for (let x = 341; x <= 681; x++) {
      const idx = (y * w + x) * c;
      data[idx] = rBg;
      data[idx + 1] = gBg;
      data[idx + 2] = bBg;
    }
  }

  const wipedBuf = await sharp(data, { raw: { width: w, height: h, channels: c } }).png().toBuffer();

  const textSvg = `
  <svg width="360" height="52" viewBox="0 0 360 52" xmlns="http://www.w3.org/2000/svg">
    <text x="180" y="36" text-anchor="middle" font-family="'Segoe UI', 'Tajawal', 'Arial', sans-serif" font-size="31" font-weight="600" fill="#746957" letter-spacing="3.5">
      ASSAF • عساف
    </text>
  </svg>
  `;
  const textBuf = await sharp(Buffer.from(textSvg)).png().toBuffer();

  await sharp(wipedBuf)
    .composite([
      {
        input: textBuf,
        left: Math.round((w - 360) / 2),
        top: 943
      }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(outBg);

  console.log('Saved public/images/assaf_master_bg.jpg');
}

makeAssafMasterBg().catch(console.error);
