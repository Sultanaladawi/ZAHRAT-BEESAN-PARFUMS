const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'deraah_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'deraah_perfumes.json');
const MASTER_ARCHIVE_PATH = path.join(__dirname, '..', 'data', 'deraah_master_archive.json');
const CACHE_DIR = path.join(__dirname, 'raw_deraah');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

async function processBottleToPodium(rawBuf, slug, isSet = false) {
  const outJpgPath = path.join(PUBLIC_IMAGES_DIR, `deraah_${slug}.jpg`);
  const pngCutoutPath = path.join(CACHE_DIR, `${slug}.png`);

  const { data, info } = await sharp(rawBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const total = w * h;

  // 1. Exterior Flood-Fill from all 4 borders to remove studio backdrops, gradients, and white halo
  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let qHead = 0, qTail = 0;

  function isNearWhiteOrHaze(idx) {
    const a = data[idx * 4 + 3];
    if (a < 25) return true;
    const r = data[idx * 4], g = data[idx * 4 + 1], b = data[idx * 4 + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // Neutral studio background / off-white / light gray floor shadow (min > 185, low chroma)
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

  // BFS flood-fill outward in
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

  // 2. Connected Component Despeckle: Purge any isolated dust, corner logos, or floor specks
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

  // Keep only components that are at least 6% of the largest object
  const minKeep = Math.floor(maxSize * 0.06);
  for (let i = 0; i < total; i++) {
    const cid = compId[i];
    if (cid === 0 || compSizes[cid] < minKeep) {
      data[i * 4 + 3] = 0;
      alpha[i] = 0;
    }
  }

  // 3. Erode 1px along outer edge to remove any 1px boundary haze
  const eroded = Uint8Array.from(alpha);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (alpha[p] === 0) continue;
      if (alpha[p - 1] === 0 || alpha[p + 1] === 0 || alpha[p - w] === 0 || alpha[p + w] === 0) {
        eroded[p] = 0;
        data[p * 4 + 3] = 0;
      }
    }
  }

  // 4. Exact Trim around true bottle
  const cleanBottle = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .png()
    .toBuffer({ resolveWithObject: true });

  try {
    fs.writeFileSync(pngCutoutPath, cleanBottle.data);
  } catch (e) {}

  const bW_orig = cleanBottle.info.width;
  const bH_orig = cleanBottle.info.height;
  const aspect = bW_orig / bH_orig;

  // 5. Intelligent Sizing:
  // For wide gift boxes/sets (aspect > 1.15): scale to max width 600, height 410
  // For standard vertical perfume bottles: scale to height 490 (max width 420)
  let targetW, targetH;
  if (aspect > 1.15 || isSet) {
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
  const left = Math.round((1024 - bW) / 2); // PERFECT HORIZONTAL CENTERING!
  const podiumContactY = 746;
  const top = podiumContactY - bH;

  // 6. Realistic Contact Shadow Under Base
  const shadowW = Math.round(bW * 1.12);
  const shadowSvg = `
  <svg width="${shadowW}" height="32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.8" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.8" />
      </filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.42}" ry="9.5" fill="#1d160e" opacity="0.68" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.28}" ry="4.8" fill="#090603" opacity="0.90" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  // 7. Composite onto Deraah Master Background
  await sharp(MASTER_BG_PATH)
    .composite([
      { input: shadowBuf, left: Math.round(left - (shadowW - bW) / 2), top: podiumContactY - 15 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(outJpgPath);

  return `images/deraah_${slug}.jpg`;
}

async function renderAllDeraah(concurrency = 8) {
  if (!fs.existsSync(PUBLIC_DATA_PATH)) {
    console.error('Deraah perfumes data not found!');
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));
  const total = catalog.length;
  console.log(`Starting flawless podium rendering for ALL ${total} Deraah perfumes (concurrency: ${concurrency})...`);

  let count = 0;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < total) {
      const i = currentIndex++;
      const item = catalog[i];
      const slug = (item.slug || `deraah-${i+1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const isSet = item.categoryType === 'bundle' || (item.title || '').includes('طقم');

      // The original high-res store picture
      const rawUrl = (item.originalImage && item.originalImage.startsWith('http'))
        ? item.originalImage
        : ((item.bottleUrl && item.bottleUrl.startsWith('http'))
          ? item.bottleUrl
          : ((item.image && item.image.startsWith('http')) ? item.image : null));

      if (!rawUrl) continue;

      try {
        const res = await fetch(rawUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const newImgPath = await processBottleToPodium(buf, slug, isSet);

        // 1st image: our luxury podium template
        item.image = newImgPath;
        // 2nd image: the original store image
        item.bottleUrl = rawUrl;
        item.originalImage = rawUrl;
        item.galleryImages = [rawUrl];

        count++;
        if (count % 10 === 0 || count === total) {
          console.log(`  ✅ [${count}/${total}] Centered & mounted flawlessly: ${item.title}`);
        }
      } catch (err) {
        console.error(`  ❌ Failed for [${i+1}] ${item.title}:`, err.message);
      }

      if (count % 30 === 0) {
        fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(catalog, null, 2), 'utf8');
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  if (fs.existsSync(MASTER_ARCHIVE_PATH)) {
    fs.writeFileSync(MASTER_ARCHIVE_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  }

  console.log(`\n🎉 DONE! All ${count}/${total} Deraah perfumes are now 100% centered, background-free, and mounted on the luxury podium!`);
}

renderAllDeraah(8).catch(console.error);
