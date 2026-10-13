const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { refineCutout } = require('./lib/refine_cutout');
const artDir = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592';
const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'laverne_master_bg.jpg');
const { removeBackground } = require('@imgly/background-removal-node');

(async () => {
  const buf = fs.readFileSync(path.join(artDir, 'raw_tobacco.jpg'));
  const normPng = await sharp(buf).resize({ width: 1000, height: 1000, fit: 'inside' }).png().toBuffer();
  const blob = new Blob([normPng], { type: 'image/png' });
  const cut = Buffer.from(await (await removeBackground(blob)).arrayBuffer());
  const { data, info } = await sharp(cut).raw().toBuffer({ resolveWithObject: true });
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

  // 2. Measure cap center
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
  console.log('Original maxY:', maxY, '-> Clean baseCutoffY:', baseCutoffY, '(trimmed', maxY - baseCutoffY, 'rows of reflection)');

  // 4. Symmetry slicer
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

  const cleaned0 = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const refined = await refineCutout(cleaned0, { erode: 1, feather: 0.8 });
  const trimmed = await sharp(refined).trim().toBuffer({ resolveWithObject: true });

  const targetH = 520;
  const bH = targetH;
  const bW = Math.round(trimmed.info.width * targetH / trimmed.info.height);
  const resized = await sharp(trimmed.data).resize(bW, bH, { kernel: 'lanczos3' }).toBuffer();

  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

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

  const outPath = path.join(artDir, 'perfect_tobacco_flawless.jpg');
  await sharp(MASTER_BG_PATH)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 13 },
      { input: resized, left, top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(outPath);

  console.log('Saved perfect_tobacco_flawless.jpg!');
})();
