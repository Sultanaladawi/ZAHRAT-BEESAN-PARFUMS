const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'deraah_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'deraah_perfumes.json');
const MASTER_ARCHIVE_PATH = path.join(__dirname, '..', 'data', 'deraah_master_archive.json');
const RAW_DIR = path.join(__dirname, 'raw_deraah');

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

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

async function processSingleItem(item, num) {
  const pngPath = path.join(RAW_DIR, `deraah-${num}.png`);
  const outJpgPath = path.join(PUBLIC_IMAGES_DIR, `deraah_deraah-${num}.jpg`);
  const rawUrl = item.originalImage || item.bottleUrl || item.galleryImages?.[0];

  if (!rawUrl || !rawUrl.startsWith('http')) {
    console.warn(`  No valid image URL for [deraah-${num}] ${item.title}`);
    return false;
  }

  const res = await fetch(rawUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rawBuf = Buffer.from(await res.arrayBuffer());

  // 1. AI segmentation with imgly
  const blob = new Blob([rawBuf], { type: 'image/jpeg' });
  const cutBlob = await removeBackground(blob);
  const cutBuf = Buffer.from(await cutBlob.arrayBuffer());

  // 2. Save cutout PNG
  fs.writeFileSync(pngPath, cutBuf);

  // 3. Composite onto master podium
  await compositeBottleOnPodium(cutBuf, outJpgPath);
  return true;
}

async function run() {
  const catalog = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));

  // Priority screenshot items
  const screenshotNums = new Set([
    '148', '149', '150', '151',
    '175', '176', '177',
    '189',
    '191', '192', '193', '194', '195', '196', '197', '198',
    '200', '201', '202', '203', '204', '205', '206'
  ]);

  // Packages/mists to skip
  const skipNums = new Set(['45', '199', '243', '246', '259', '339']);

  const targets = [];

  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    const match = (item.image || '').match(/deraah-(\d+)\.jpg/);
    if (!match) continue;
    const num = match[1];

    if (skipNums.has(num)) continue;

    const pngPath = path.join(RAW_DIR, `deraah-${num}.png`);
    let needsFix = screenshotNums.has(num);

    if (!needsFix) {
      if (!fs.existsSync(pngPath)) {
        needsFix = true;
      } else {
        try {
          const meta = await sharp(pngPath).metadata();
          if (meta.height < 340 || meta.width >= 750 || meta.height >= 750) {
            needsFix = true;
          } else {
            // Check hollow center
            const { data, info } = await sharp(pngPath).raw().toBuffer({ resolveWithObject: true });
            let transparentCenter = 0, totalCenter = 0;
            for (let y = Math.floor(info.height * 0.3); y < Math.floor(info.height * 0.7); y += 3) {
              for (let x = Math.floor(info.width * 0.35); x < Math.floor(info.width * 0.65); x += 3) {
                const a = data[(y * info.width + x) * info.channels + 3];
                if (a < 50) transparentCenter++;
                totalCenter++;
              }
            }
            if (totalCenter > 0 && (transparentCenter / totalCenter) > 0.06) {
              needsFix = true;
            }
          }
        } catch (e) {
          needsFix = true;
        }
      }
    }

    if (needsFix) {
      targets.push({ item, num, isPriority: screenshotNums.has(num) });
    }
  }

  // Sort so screenshot items are processed first
  targets.sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));

  console.log(`Identified ${targets.length} Deraah perfumes needing AI reconstruction (Priority: ${screenshotNums.size}).`);

  let successCount = 0;
  let failCount = 0;

  for (let idx = 0; idx < targets.length; idx++) {
    const { item, num, isPriority } = targets[idx];
    const prefix = isPriority ? '⭐ [PRIORITY]' : '  ';
    process.stdout.write(`${prefix} [${idx + 1}/${targets.length}] Rebuilding [deraah-${num}] ${item.title}... `);

    try {
      await processSingleItem(item, num);
      successCount++;
      console.log('✅ OK');
    } catch (err) {
      failCount++;
      console.log(`❌ FAILED: ${err.message}`);
    }

    if ((idx + 1) % 15 === 0) {
      fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(catalog, null, 2), 'utf8');
      if (fs.existsSync(MASTER_ARCHIVE_PATH)) {
        fs.writeFileSync(MASTER_ARCHIVE_PATH, JSON.stringify(catalog, null, 2), 'utf8');
      }
    }
  }

  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  if (fs.existsSync(MASTER_ARCHIVE_PATH)) {
    fs.writeFileSync(MASTER_ARCHIVE_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  }

  console.log(`\n🎉 Completed AI reconstruction! Success: ${successCount}, Failures: ${failCount}`);
}

run().catch(console.error);
