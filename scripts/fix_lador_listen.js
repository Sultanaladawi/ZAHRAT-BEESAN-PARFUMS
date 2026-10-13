const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const { refineCutout } = require('./lib/refine_cutout');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'laverne_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

async function renderPodiumBottle(rawBuf, slug) {
  const normPng = await sharp(rawBuf)
    .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();

  const blob = new Blob([normPng], { type: 'image/png' });
  const cutBlob = await removeBackground(blob);
  const cutBuf = Buffer.from(await cutBlob.arrayBuffer());

  const { data, info } = await sharp(cutBuf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

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

  let baseCutoffY = maxY;
  for (let y = maxY; y >= minY + Math.round(objH * 0.6); y--) {
    if (rowW[y] < maxW * 0.70) {
      baseCutoffY = y - 1;
    } else {
      break;
    }
  }

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

  await sharp(MASTER_BG_PATH)
    .composite([
      { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 13 },
      { input: resized, left, top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(path.join(PUBLIC_IMAGES_DIR, `laverne_${slug}.jpg`));

  console.log(`Saved podium bottle: laverne_${slug}.jpg`);
}

async function renderFramedBottle(rawBuf, slug) {
  const inner = await sharp(rawBuf)
    .resize({ width: 920, height: 920, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer();
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 248, g: 246, b: 240, alpha: 1 } }
  })
    .composite([{ input: inner, gravity: 'center' }])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(path.join(PUBLIC_IMAGES_DIR, `laverne_${slug}.jpg`));
  console.log(`Saved framed bottle: laverne_${slug}.jpg`);
}

async function fixSpecifics() {
  // 1. Fix L'Ador Classic (PdgOKDr) with the complete bottle photo containing cap
  const ladorUrl = 'https://cdn.salla.sa/XzOPD/ZO1VLa6hMWRnT1KifUvusg8aRk5QAOTjqKt5wvhP.jpg';
  const ladorRes = await fetch(ladorUrl);
  const ladorBuf = Buffer.from(await ladorRes.arrayBuffer());
  await renderPodiumBottle(ladorBuf, 'PdgOKDr');

  // 2. Fix Listen (DGOgbBW) with the full flacon on marble plinth photo
  const listenUrl = 'https://cdn.salla.sa/XzOPD/mSoTXLs1nfDw7pr3ZcqtTs6VNHntTjUETryZtQNU.jpg';
  const listenRes = await fetch(listenUrl);
  const listenBuf = Buffer.from(await listenRes.arrayBuffer());
  await renderFramedBottle(listenBuf, 'DGOgbBW');

  console.log('Finished fixing Lador Classic and Listen!');
}

fixSpecifics().catch(console.error);
