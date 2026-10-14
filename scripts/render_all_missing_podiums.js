const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const CACHE_DIR = path.join(__dirname, 'raw_universal_cache');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const BG_MAP = {
  assaf: path.join(IMAGES_DIR, 'assaf_master_bg.jpg'),
  thunayan: path.join(IMAGES_DIR, 'thnyan_master_bg.jpg'),
  thnyan: path.join(IMAGES_DIR, 'thnyan_master_bg.jpg'),
  ghalati: path.join(IMAGES_DIR, 'ghalati_master_bg.jpg'),
  rasasi: path.join(IMAGES_DIR, 'rasasi_master_bg.jpg'),
  'al-rehab': path.join(IMAGES_DIR, 'alrehab_master_bg.jpg'),
  alrehab: path.join(IMAGES_DIR, 'alrehab_master_bg.jpg'),
  labonair: path.join(IMAGES_DIR, 'lebonheur_master_bg.jpg'),
  lebonheur: path.join(IMAGES_DIR, 'lebonheur_master_bg.jpg'),
  laverne: path.join(IMAGES_DIR, 'laverne_master_bg.jpg'),
  deraah: path.join(IMAGES_DIR, 'deraah_master_bg.jpg')
};

async function processCutoutToPodium(rawBuf, bgPath, isSet = false) {
  const { data, info } = await sharp(rawBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const total = w * h;

  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let qHead = 0, qTail = 0;

  function isNearWhiteOrHaze(idx) {
    const a = data[idx * 4 + 3];
    if (a < 25) return true;
    const r = data[idx * 4], g = data[idx * 4 + 1], b = data[idx * 4 + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return (min > 185 && (max - min) < 32) || (min > 225);
  }

  // Seed borders
  for (let x = 0; x < w; x++) {
    if (isNearWhiteOrHaze(x)) { isBg[x] = 1; queue[qTail++] = x; }
    const bot = (h - 1) * w + x;
    if (isNearWhiteOrHaze(bot)) { isBg[bot] = 1; queue[qTail++] = bot; }
  }
  for (let y = 1; y < h - 1; y++) {
    const left = y * w;
    if (isNearWhiteOrHaze(left)) { isBg[left] = 1; queue[qTail++] = left; }
    const right = y * w + (w - 1);
    if (isNearWhiteOrHaze(right)) { isBg[right] = 1; queue[qTail++] = right; }
  }

  // BFS flood-fill
  while (qHead < qTail) {
    const p = queue[qHead++];
    const x = p % w, y = (p - x) / w;
    if (x > 0 && !isBg[p - 1] && isNearWhiteOrHaze(p - 1)) { isBg[p - 1] = 1; queue[qTail++] = p - 1; }
    if (x < w - 1 && !isBg[p + 1] && isNearWhiteOrHaze(p + 1)) { isBg[p + 1] = 1; queue[qTail++] = p + 1; }
    if (y > 0 && !isBg[p - w] && isNearWhiteOrHaze(p - w)) { isBg[p - w] = 1; queue[qTail++] = p - w; }
    if (y < h - 1 && !isBg[p + w] && isNearWhiteOrHaze(p + w)) { isBg[p + w] = 1; queue[qTail++] = p + w; }
  }

  const alpha = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    if (isBg[i]) {
      data[i * 4 + 3] = 0;
      alpha[i] = 0;
    } else {
      alpha[i] = data[i * 4 + 3];
    }
  }

  // Connected Component Despeckle
  const compId = new Int32Array(total);
  const compSizes = [0];
  let currentId = 0;

  for (let i = 0; i < total; i++) {
    if (alpha[i] > 20 && compId[i] === 0) {
      currentId++;
      let head = 0, tail = 0;
      queue[tail++] = i;
      compId[i] = currentId;
      let size = 0;
      while (head < tail) {
        const p = queue[head++];
        size++;
        const x = p % w, y = (p - x) / w;
        if (x > 0 && alpha[p - 1] > 20 && compId[p - 1] === 0) { compId[p - 1] = currentId; queue[tail++] = p - 1; }
        if (x < w - 1 && alpha[p + 1] > 20 && compId[p + 1] === 0) { compId[p + 1] = currentId; queue[tail++] = p + 1; }
        if (y > 0 && alpha[p - w] > 20 && compId[p - w] === 0) { compId[p - w] = currentId; queue[tail++] = p - w; }
        if (y < h - 1 && alpha[p + w] > 20 && compId[p + w] === 0) { compId[p + w] = currentId; queue[tail++] = p + w; }
      }
      compSizes[currentId] = size;
    }
  }

  let maxSize = 0;
  for (let c = 1; c <= currentId; c++) {
    if (compSizes[c] > maxSize) maxSize = compSizes[c];
  }

  const minKeep = Math.floor(maxSize * 0.05);
  for (let i = 0; i < total; i++) {
    const cid = compId[i];
    if (cid === 0 || compSizes[cid] < minKeep) {
      data[i * 4 + 3] = 0;
      alpha[i] = 0;
    }
  }

  // 1px boundary erosion
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (alpha[p] === 0) continue;
      if (alpha[p - 1] === 0 || alpha[p + 1] === 0 || alpha[p - w] === 0 || alpha[p + w] === 0) {
        data[p * 4 + 3] = 0;
      }
    }
  }

  const cleanBottle = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .png()
    .toBuffer({ resolveWithObject: true });

  const bW_orig = cleanBottle.info.width;
  const bH_orig = cleanBottle.info.height;
  const aspect = bW_orig / bH_orig;

  let targetW, targetH;
  if (aspect > 1.15 || isSet) {
    targetH = Math.min(410, Math.round(590 / aspect));
    targetW = Math.round(targetH * aspect);
  } else {
    targetH = 490;
    targetW = Math.round(targetH * aspect);
    if (targetW > 440) {
      targetW = 440;
      targetH = Math.round(targetW / aspect);
    }
  }

  const resized = await sharp(cleanBottle.data)
    .resize({ width: targetW, height: targetH, fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2); // Center horizontally
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

  return await sharp(bgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - (shadowW - bW) / 2), top: podiumContactY - 15 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

async function renderCatalogMissing(catalogName, catalogFile, houseKey) {
  const filePath = path.join(PUBLIC_DIR, 'data', catalogFile);
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const bgPath = BG_MAP[houseKey] || BG_MAP.ghalati;

  console.log(`\n========================================`);
  console.log(`Scanning [${catalogName}] (${items.length} items)...`);

  const toRender = [];
  for (let i = 0; i < items.length; i++) {
    const p = items[i];
    const relImg = (p.image || '').split('?')[0].replace(/^\//, '');
    const absImg = path.join(PUBLIC_DIR, relImg);

    let needsRender = false;
    if (!fs.existsSync(absImg)) {
      needsRender = true;
    } else {
      try {
        const { data, info } = await sharp(absImg).raw().toBuffer({ resolveWithObject: true });
        const idx = (15 * info.width + 15) * info.channels;
        if (data[idx] >= 250 && data[idx + 1] >= 250 && data[idx + 2] >= 250) {
          needsRender = true;
        }
      } catch (e) {
        needsRender = true;
      }
    }

    if (needsRender) {
      toRender.push({ index: i, item: p, absImg });
    }
  }

  console.log(`Found ${toRender.push ? toRender.length : 0} items needing podium rendering in ${catalogName}.`);
  if (toRender.length === 0) return;

  const concurrency = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < toRender.length) {
      const { index, item, absImg } = toRender[cursor++];
      const isSet = item.categoryType === 'bundle' || (item.title || '').includes('طقم') || (item.title || '').includes('مجموعة') || (item.title || '').includes('بكج') || (item.title || '').includes('باقة');

      let rawBuf = null;

      // 1. Try local original file if exists
      if (item.originalImage && !item.originalImage.startsWith('http')) {
        const localOrig = path.join(PUBLIC_DIR, item.originalImage.replace(/^\//, ''));
        if (fs.existsSync(localOrig)) {
          rawBuf = fs.readFileSync(localOrig);
        }
      }

      // 2. Try URL
      if (!rawBuf) {
        const url = (item.originalImage && item.originalImage.startsWith('http'))
          ? item.originalImage
          : ((item.bottleUrl && item.bottleUrl.startsWith('http'))
            ? item.bottleUrl
            : (item.galleryImages && item.galleryImages[0] && item.galleryImages[0].startsWith('http') ? item.galleryImages[0] : null));

        if (url) {
          const cacheKey = Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
          const cacheFile = path.join(CACHE_DIR, `${cacheKey}.cache`);
          if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 500) {
            rawBuf = fs.readFileSync(cacheFile);
          } else {
            try {
              const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
              if (res.ok) {
                rawBuf = Buffer.from(await res.arrayBuffer());
                fs.writeFileSync(cacheFile, rawBuf);
              }
            } catch (err) {
              console.warn(`  [!] Fetch failed for ${item.id} (${url}): ${err.message}`);
            }
          }
        }
      }

      if (!rawBuf) {
        console.warn(`  [!] No source buffer found for ${item.id} (${item.title})`);
        continue;
      }

      try {
        const outJpg = await processCutoutToPodium(rawBuf, bgPath, isSet);
        fs.writeFileSync(absImg, outJpg);
        console.log(`  [OK] Rendered podium: [${item.id}] ${item.title}`);
      } catch (err) {
        console.error(`  [ERROR] Render failed for [${item.id}]: ${err.message}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  console.log(`Completed rendering for ${catalogName}.`);
}

async function runAll() {
  await renderCatalogMissing('Assaf', 'assaf_perfumes.json', 'assaf');
  await renderCatalogMissing('Thunayan', 'thnyan_perfumes.json', 'thunayan');
  await renderCatalogMissing('Ghalati', 'perfumes.json', 'ghalati');
  await renderCatalogMissing('Al-Rehab', 'alrehab_perfumes.json', 'alrehab');
  await renderCatalogMissing('Laverne', 'laverne_perfumes.json', 'laverne');
  await renderCatalogMissing('Deraah', 'deraah_perfumes.json', 'deraah');

  console.log('\n========================================');
  console.log('ALL MISSING PODIUMS COMPLETED 100%!');
}

runAll().catch(console.error);
