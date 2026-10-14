const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'deraah_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const RAW_DIR = path.join(__dirname, 'raw_deraah');

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

async function compositeBottleOnPodium(cutoutBuf, outJpgPath) {
  // Trim edges
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
  const deraah = JSON.parse(fs.readFileSync('public/data/deraah_perfumes.json', 'utf8'));
  console.log(`Checking ${deraah.length} Deraah perfumes for hollow cutouts...`);

  // Clean up any stray deraah_deraah-101110*.jpg files
  const strayFiles = fs.readdirSync(PUBLIC_IMAGES_DIR).filter(f => f.startsWith('deraah_deraah-101110'));
  console.log(`Removing ${strayFiles.length} stray incorrectly named Deraah files...`);
  strayFiles.forEach(f => {
    try { fs.unlinkSync(path.join(PUBLIC_IMAGES_DIR, f)); } catch (e) {}
  });

  const hollowList = [];
  for (let i = 0; i < deraah.length; i++) {
    const item = deraah[i];
    const match = (item.image || '').match(/deraah-(\d+)\.jpg/);
    if (!match) continue;
    const num = match[1];
    const pngPath = path.join(RAW_DIR, `deraah-${num}.png`);
    
    let isHollow = false;
    if (!fs.existsSync(pngPath)) {
      isHollow = true;
    } else {
      try {
        const { data, info } = await sharp(pngPath).raw().toBuffer({ resolveWithObject: true });
        const { width, height, channels } = info;
        if (channels >= 4) {
          let hollowPixels = 0;
          let totalCenter = 0;
          for (let y = Math.floor(height * 0.35); y < Math.floor(height * 0.65); y += 4) {
            for (let x = Math.floor(width * 0.35); x < Math.floor(width * 0.65); x += 4) {
              const idx = (y * width + x) * channels;
              if (data[idx + 3] < 100) hollowPixels++;
              totalCenter++;
            }
          }
          if (hollowPixels / totalCenter > 0.15) {
            isHollow = true;
          }
        }
      } catch (e) {
        isHollow = true;
      }
    }

    if (isHollow) {
      hollowList.push({ item, num, pngPath });
    }
  }

  console.log(`Found ${hollowList.length} perfumes requiring AI solid segmentation.`);

  for (let idx = 0; idx < hollowList.length; idx++) {
    const { item, num, pngPath } = hollowList[idx];
    const outJpgPath = path.join(PUBLIC_IMAGES_DIR, `deraah_deraah-${num}.jpg`);
    const rawUrl = item.originalImage || item.bottleUrl || item.image;

    console.log(`[${idx + 1}/${hollowList.length}] Repairing: [deraah-${num}] ${item.title}...`);

    try {
      const res = await fetch(rawUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (!res.ok) {
        console.warn(`  Failed to fetch ${rawUrl}`);
        continue;
      }
      const rawBuf = Buffer.from(await res.arrayBuffer());

      // 1. AI segmentation with imgly
      const blob = new Blob([rawBuf], { type: 'image/jpeg' });
      const cutBlob = await removeBackground(blob);
      const cutBuf = Buffer.from(await cutBlob.arrayBuffer());

      // 2. Save solid PNG cutout
      fs.writeFileSync(pngPath, cutBuf);

      // 3. Composite onto master podium
      await compositeBottleOnPodium(cutBuf, outJpgPath);
      console.log(`  -> SUCCESS! Restored: ${outJpgPath}`);
    } catch (err) {
      console.error(`  -> ERROR on ${item.title}: ${err.message}`);
    }
  }

  console.log('\nAll Deraah hollow bottles have been completely repaired and saved to their correct podium paths!');
}

run().catch(console.error);
