const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const { refineCutout } = require('./lib/refine_cutout');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'laverne_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'laverne_perfumes.json');
const RAW_CACHE_DIR = path.join(__dirname, 'raw_laverne');

if (!fs.existsSync(RAW_CACHE_DIR)) fs.mkdirSync(RAW_CACHE_DIR, { recursive: true });

async function renderProductImage(rawBuf, slug, isBundle = false) {
  const outPath = path.join(PUBLIC_IMAGES_DIR, `laverne_${slug}.jpg`);

  // Studio framing for bundles, gift sets, and boxed collections
  if (isBundle) {
    const inner = await sharp(rawBuf)
      .resize({ width: 920, height: 920, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 248, g: 246, b: 240, alpha: 1 }
      }
    })
      .composite([{ input: inner, gravity: 'center' }])
      .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
      .toFile(outPath);
    return;
  }

  // Single bottle: AI background removal + Symmetry shadow slicer + reflection cutoff + refineCutout
  try {
    const normPng = await sharp(rawBuf)
      .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    const blob = new Blob([normPng], { type: 'image/png' });
    const cutBlob = await removeBackground(blob);
    const cutBuf = Buffer.from(await cutBlob.arrayBuffer());

    const { data, info } = await sharp(cutBuf).raw().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height;

    // 1. Measure solid widths per row
    let maxW = 0;
    const rowW = new Int32Array(h);
    for (let y = 0; y < h; y++) {
      let minX = w, maxX = -1;
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] >= 160) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
      if (maxX >= minX) {
        rowW[y] = maxX - minX;
        if (rowW[y] > maxW) maxW = rowW[y];
      }
    }

    if (maxW < 30) throw new Error('Subject width too small');

    // 2. Measure cap center in top 2%..8%
    let minY = 0, maxY = h - 1;
    while (minY < h && rowW[minY] === 0) minY++;
    while (maxY > 0 && rowW[maxY] === 0) maxY--;
    const objH = maxY - minY;

    let sumCapCenter = 0, capRows = 0;
    const cStart = minY + Math.max(3, Math.round(objH * 0.02));
    const cEnd = minY + Math.max(10, Math.round(objH * 0.08));
    for (let y = cStart; y <= cEnd; y++) {
      let rowL = w, rowR = 0;
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] >= 180) {
          if (x < rowL) rowL = x;
          if (x > rowR) rowR = x;
        }
      }
      if (rowR > rowL + 10) {
        sumCapCenter += (rowL + rowR) / 2;
        capRows++;
      }
    }
    const capCenterX = capRows > 0 ? Math.round(sumCapCenter / capRows) : Math.round(w / 2);

    // 3. Find true base: scan up from maxY until row width is at least 70% of body width
    let baseCutoffY = maxY;
    for (let y = maxY; y >= minY + Math.round(objH * 0.6); y--) {
      if (rowW[y] < maxW * 0.70) {
        baseCutoffY = y - 1;
      } else {
        break;
      }
    }

    // 4. Enforce Right-to-Left symmetry across all rows (erases left wall shadows & floor reflection)
    for (let y = 0; y < h; y++) {
      if (y > baseCutoffY) {
        for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = 0;
        continue;
      }
      let rX = -1;
      for (let x = w - 1; x >= capCenterX; x--) {
        if (data[(y * w + x) * 4 + 3] >= 160) {
          rX = x;
          break;
        }
      }
      if (rX <= capCenterX) {
        for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = 0;
        continue;
      }
      const halfW = rX - capCenterX;
      const symLeftX = capCenterX - halfW - 1;
      for (let x = 0; x < symLeftX; x++) {
        data[(y * w + x) * 4 + 3] = 0;
      }
    }

    // 5. Run refineCutout for defringing and smooth feather
    const cleaned0 = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    const refined = await refineCutout(cleaned0, { erode: 1, feather: 0.8 });
    const trimmed = await sharp(refined).trim().toBuffer({ resolveWithObject: true });

    if (!trimmed || !trimmed.info || trimmed.info.height < 20) {
      throw new Error('Trimmed bottle height invalid');
    }

    // 6. Scale bottle to prominent majestic size: height 520px
    const targetH = 520;
    const bH = targetH;
    const bW = Math.round(trimmed.info.width * targetH / trimmed.info.height);
    const resized = await sharp(trimmed.data)
      .resize(bW, bH, { kernel: 'lanczos3' })
      .toBuffer();

    const left = Math.round((1024 - bW) / 2);
    const baseContactY = 746;
    const top = baseContactY - bH;

    // Realistic multi-tier contact shadow
    const shadowW = bW + 40;
    const shadowSvg = `
    <svg width="${shadowW}" height="28" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2" /></filter>
        <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <ellipse cx="${shadowW / 2}" cy="14" rx="${bW * 0.43}" ry="7.5" fill="#1b1209" opacity="0.65" filter="url(#f1)" />
      <ellipse cx="${shadowW / 2}" cy="14" rx="${bW * 0.28}" ry="4" fill="#080503" opacity="0.9" filter="url(#f2)" />
    </svg>
    `;
    const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

    await sharp(MASTER_BG_PATH)
      .composite([
        { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 13 },
        { input: resized, left, top }
      ])
      .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
      .toFile(outPath);
  } catch (err) {
    console.warn(`[Fallback for ${slug} (${err.message})]: using luxury framed container`);
    const inner = await sharp(rawBuf)
      .resize({ width: 920, height: 920, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 248, g: 246, b: 240, alpha: 1 }
      }
    })
      .composite([{ input: inner, gravity: 'center' }])
      .jpeg({ quality: 96 })
      .toFile(outPath);
  }
}

async function run() {
  const prods = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));
  console.log(`Starting image generation for ${prods.length} products...`);

  // Cutoff time: today at 13:00 (1:00 PM)
  const cutOffTime = new Date('2026-10-13T13:05:00').getTime();

  let rendered = 0;
  let skipped = 0;

  for (let i = 0; i < prods.length; i++) {
    const prod = prods[i];
    const slug = prod.sallaId;
    const isBundle = prod.categoryType === 'bundle';
    const outPath = path.join(PUBLIC_IMAGES_DIR, `laverne_${slug}.jpg`);

    if (fs.existsSync(outPath)) {
      const stat = fs.statSync(outPath);
      if (stat.mtimeMs > cutOffTime && stat.size > 20000) {
        skipped++;
        continue;
      }
    }

    if (!prod.bottleUrl) continue;

    const cachePath = path.join(RAW_CACHE_DIR, `${slug}.jpg`);
    let rawBuf;
    if (fs.existsSync(cachePath)) {
      rawBuf = fs.readFileSync(cachePath);
    } else {
      try {
        const res = await fetch(prod.bottleUrl);
        if (res.ok) {
          rawBuf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(cachePath, rawBuf);
        }
      } catch (e) {
        console.warn(`Failed to fetch image for ${slug}:`, e.message);
      }
    }

    if (rawBuf) {
      try {
        await renderProductImage(rawBuf, slug, isBundle);
        rendered++;
        process.stdout.write(`[${i + 1}/${prods.length}] Rendered: ${prod.title}\r`);
      } catch (err) {
        console.error(`Error rendering ${slug} (${prod.title}):`, err.message);
      }
    }
  }

  console.log(`\nComplete! Rendered: ${rendered}, Already Up-to-Date: ${skipped}, Total: ${prods.length}`);
}

run().catch(console.error);
