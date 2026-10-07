const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

const perfumesPath = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
const perfumes = JSON.parse(fs.readFileSync(perfumesPath, 'utf8'));
const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const rawDir = path.join(__dirname, 'raw_bottles');

if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

// All 37 perfumes to reprocess
const targetIds = [
  'just-oud', 'perfume-1932', 'mountain-leather', 'perfume-2016', 'ambitious',
  'sublime-woods', 'perfume-1985', 'absolute-musk', 'sublime-flowers', 'eloquent',
  'peach-musk', 'just-amber', 'carmine-soul', 'dama', 'utopia-essence',
  'exotic-wood', 'rose-intense', 'raspberry-musk', 'cherry-musk', 'vintage',
  'iris-musk', 'utopia-gist', 'eternal-passion', 'mont-dor', 'boudoir',
  'first-impression', 'seraj', 'cartage-velours', 'most-wanted', 'cartage-etoile',
  'silk-essence', 'amber-oud', 'cartage-noble', 'honest', 'varna-single',
  'rasayil-shawq', 'serenade'
];

async function reprocessOne(id) {
  const p = perfumes.find(x => x.id === id);
  if (!p) {
    console.log(`Product ${id} not found in perfumes.json`);
    return;
  }

  console.log(`\n========================================`);
  console.log(`Processing ${id} (${p.title})...`);

  const rawFilePath = path.join(rawDir, `${id}.jpg`);
  let rawBuf;

  if (fs.existsSync(rawFilePath) && fs.statSync(rawFilePath).size > 1000) {
    rawBuf = fs.readFileSync(rawFilePath);
  } else {
    console.log(`Downloading raw image from ${p.bottleUrl}...`);
    try {
      const res = await fetch(p.bottleUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      rawBuf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(rawFilePath, rawBuf);
    } catch (e) {
      console.error(`Failed to download image for ${id}:`, e.message);
      return;
    }
  }

  // 1. AI background removal via @imgly Blob
  console.log(`Running AI background removal...`);
  let bgRemovedBuf;
  try {
    const blob = new Blob([rawBuf], { type: 'image/jpeg' });
    const bgBlob = await removeBackground(blob);
    bgRemovedBuf = Buffer.from(await bgBlob.arrayBuffer());
  } catch (e) {
    console.error(`Imgly failed for ${id}:`, e.message);
    return;
  }

  // 2. Clear studio shadow on left flank and bottom
  const { data, info } = await sharp(bgRemovedBuf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Find center column
  let sumX = 0, count = 0;
  for (let y = Math.round(h * 0.35); y < Math.round(h * 0.75); y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 100) {
        sumX += x;
        count++;
      }
    }
  }
  const centerX = count > 0 ? Math.round(sumX / count) : Math.round(w / 2);

  // Measure right border per row
  const rightBounds = new Int32Array(h);
  for (let y = 0; y < h; y++) {
    let rX = -1;
    for (let x = w - 1; x >= centerX; x--) {
      if (data[(y * w + x) * 4 + 3] > 80) {
        rX = x;
        break;
      }
    }
    rightBounds[y] = rX;
  }

  // Clear left shadow based on right symmetry and neutral gray check
  for (let y = 0; y < h; y++) {
    const rX = rightBounds[y];
    const halfWidth = rX > centerX ? (rX - centerX) : 150;
    const maxLeftX = centerX - halfWidth - 2;

    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] === 0) continue;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      // 1. Outside symmetric bottle boundary on left
      if (x < maxLeftX) {
        data[idx + 3] = 0;
        continue;
      }

      // 2. Neutral gray shadow on left flank (diff <= 8, min >= 70)
      if (x < centerX - 35 && diff <= 8 && min >= 70) {
        data[idx + 3] = 0;
        continue;
      }

      // 3. Bottom studio shadow under the bottle base
      if (y > h * 0.90 && diff <= 10 && min >= 90) {
        data[idx + 3] = 0;
        continue;
      }

      // 4. Low alpha haze
      if (data[idx + 3] < 30) {
        data[idx + 3] = 0;
      }
    }
  }

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(cleaned).trim().toBuffer({ resolveWithObject: true });

  fs.writeFileSync(path.join(publicImagesDir, `original_${id}.png`), trimmed.data);

  // 3. Grounding onto master background
  const targetH = ['vintage', 'cartage-velours', 'cartage-etoile', 'cartage-noble'].includes(id) ? 505 : 515;
  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 40;
  const shadowSvg = `
  <svg width="${shadowW}" height="26" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.0" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.40}" ry="6" fill="#1b1209" opacity="0.60" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="13" rx="${bW * 0.25}" ry="3" fill="#080503" opacity="0.85" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const outJpg = path.join(publicImagesDir, `ghalati_${id}.jpg`);
  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 11 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 95 })
    .toFile(outJpg);

  console.log(`✓ Spotless composite saved: ${outJpg}`);
}

async function runAll() {
  console.log(`Reprocessing ${targetIds.length} perfumes for 100% spotless shadow-free presentation...`);
  for (let i = 0; i < targetIds.length; i++) {
    console.log(`[${i+1}/${targetIds.length}]`);
    await reprocessOne(targetIds[i]);
  }
  console.log('\nALL TARGET PERFUMES REPROCESSED TO PERFECTION!');
}

runAll();
