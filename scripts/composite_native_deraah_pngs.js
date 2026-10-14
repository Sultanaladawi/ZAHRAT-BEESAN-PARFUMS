const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'deraah_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const RAW_DIR = path.join(__dirname, 'raw_deraah');

async function compositeBottleOnPodium(cutoutBuf, outJpgPath) {
  const cleanBottle = await sharp(cutoutBuf).trim().png().toBuffer({ resolveWithObject: true });
  const bW_orig = cleanBottle.info.width;
  const bH_orig = cleanBottle.info.height;
  const aspect = bW_orig / bH_orig;

  let targetW, targetH;
  if (aspect > 1.15) {
    targetH = Math.min(410, Math.round(590 / aspect));
    targetW = Math.round(targetH * aspect);
  } else {
    targetH = 490;
    targetW = Math.round(targetH * aspect);
    if (targetW > 420) {
      targetW = 420;
      targetH = Math.round(targetW / aspect);
    }
  }

  const resized = await sharp(cleanBottle.data)
    .resize({ width: targetW, height: targetH, fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const podiumContactY = 746;
  const top = podiumContactY - bH;

  const shadowW = Math.round(bW * 1.12);
  const shadowSvg = `
  <svg width="${shadowW}" height="32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.8" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.42}" ry="9.5" fill="#1d160e" opacity="0.68" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.28}" ry="4.8" fill="#090603" opacity="0.90" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(MASTER_BG_PATH)
    .composite([
      { input: shadowBuf, left: Math.round(left - (shadowW - bW) / 2), top: podiumContactY - 15 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(outJpgPath);
}

async function run() {
  const d = JSON.parse(fs.readFileSync('public/data/deraah_perfumes.json', 'utf8'));
  const pngItems = d.filter(p => (p.originalImage || '').includes('.png'));

  console.log(`Found ${pngItems.length} Deraah perfumes with native transparent PNGs directly from official store.`);

  for (let i = 0; i < pngItems.length; i++) {
    const item = pngItems[i];
    const match = (item.image || '').match(/deraah-(\d+)\.jpg/);
    if (!match) continue;
    const num = match[1];
    const outJpgPath = path.join(PUBLIC_IMAGES_DIR, `deraah_deraah-${num}.jpg`);
    const pngPath = path.join(RAW_DIR, `deraah-${num}.png`);

    try {
      const res = await fetch(item.originalImage, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());

      // Save the native crisp PNG
      fs.writeFileSync(pngPath, buf);

      // Composite onto podium
      await compositeBottleOnPodium(buf, outJpgPath);
      console.log(`[${i + 1}/${pngItems.length}] Successfully rendered native PNG for: ${item.title}`);
    } catch (e) {
      console.error(`Error on ${item.title}: ${e.message}`);
    }
  }

  console.log('All native Deraah PNGs composited onto podium with 100% flawless bottle bodies!');
}

run().catch(console.error);
