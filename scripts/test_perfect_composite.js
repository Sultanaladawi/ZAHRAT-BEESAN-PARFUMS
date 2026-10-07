const sharp = require('sharp');
const fs = require('fs');

async function testCompositeNowara() {
  const masterBg = 'public/images/ghalati_master_bg.jpg';
  const bottleBuf = fs.readFileSync('scripts/test_clean_nowara.png');
  
  // Clean that bottom left strip as well
  const { data, info } = await sharp(bottleBuf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a === 0) continue;
      const diff = Math.max(r,g,b) - Math.min(r,g,b);
      const min = Math.min(r,g,b);
      if (diff <= 8 && min >= 130 && x < 385) {
        data[idx+3] = 0;
      }
    }
  }

  const cleanBottle = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(cleanBottle).trim().toBuffer({ resolveWithObject: true });
  console.log('Trimmed Nowara:', trimmed.info.width, 'x', trimmed.info.height);

  const targetH = 500;
  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const top = 746 - bH;

  const shadowW = bW + 40;
  const shadowSvg = `
  <svg width="${shadowW}" height="26" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.40}" ry="8" fill="#1c130a" opacity="0.6" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.26}" ry="4" fill="#080503" opacity="0.85" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const outPath = 'scripts/test_final_nowara_showcase.jpg';
  await sharp(masterBg)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: 738 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98 })
    .toFile(outPath);

  console.log('Saved', outPath);
}

testCompositeNowara().catch(console.error);
