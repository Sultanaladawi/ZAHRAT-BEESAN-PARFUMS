const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const perfumesFile = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
const products = JSON.parse(fs.readFileSync(perfumesFile, 'utf8'));

// Advanced clean bottle extractor with multi-stage shadow removal
async function extractBottle(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const alpha = new Uint8Array(w * h).fill(255);

  function isBackground(x, y) {
    const idx = (y * w + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // White / near white
    if (r >= 235 && g >= 235 && b >= 235) return true;

    // Neutral gray drop shadow
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    if (diff <= 18 && min >= 80) return true;
    if (diff <= 26 && min >= 130) return true;
    if (x < 365 && diff <= 32 && min >= 120) return true;

    return false;
  }

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h * 2);
  let qHead = 0, qTail = 0;

  function push(x, y) {
    const idx = y * w + x;
    if (!visited[idx]) {
      visited[idx] = 1;
      queue[qTail++] = x;
      queue[qTail++] = y;
    }
  }

  for (let x = 0; x < w; x++) {
    if (isBackground(x, 0)) push(x, 0);
    if (isBackground(x, h - 1)) push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    if (isBackground(0, y)) push(0, y);
    if (isBackground(w - 1, y)) push(w - 1, y);
  }

  while (qHead < qTail) {
    const x = queue[qHead++];
    const y = queue[qHead++];
    const idx = y * w + x;
    alpha[idx] = 0;

    const neighbors = [
      [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = ny * w + nx;
        if (!visited[nIdx] && isBackground(nx, ny)) {
          visited[nIdx] = 1;
          queue[qTail++] = nx;
          queue[qTail++] = ny;
        }
      }
    }
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = data[i * 4];
    rgba[i * 4 + 1] = data[i * 4 + 1];
    rgba[i * 4 + 2] = data[i * 4 + 2];
    rgba[i * 4 + 3] = alpha[i];
  }

  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

async function processProduct(prod) {
  const outJpg = path.join(__dirname, '..', 'public', 'images', `ghalati_${prod.id}.jpg`);
  const outOriginalPng = path.join(__dirname, '..', 'public', 'images', `original_${prod.id}.png`);

  console.log(`Processing: ${prod.id} (${prod.title}) ...`);
  const res = await fetch(prod.bottleUrl);
  const rawBuf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outOriginalPng, rawBuf);

  // Extract clean transparent bottle
  const cleanBuf = await extractBottle(rawBuf);
  const trimmed = await sharp(cleanBuf).trim().toBuffer({ resolveWithObject: true });

  const targetH = 510;
  const resizedBottle = await sharp(trimmed.data)
    .resize({ height: targetH })
    .toBuffer({ resolveWithObject: true });

  const bW = resizedBottle.info.width;
  const bH = resizedBottle.info.height;
  const left = Math.round((1024 - bW) / 2);
  const top = 746 - bH;

  // Soft contact shadow on marble podium
  const shadowW = bW + 60;
  const shadowSvg = `
  <svg width="${shadowW}" height="30" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.42}" ry="10" fill="#1e140a" opacity="0.6" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.28}" ry="5" fill="#0a0704" opacity="0.85" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 30), top: 736 },
      { input: resizedBottle.data, left: left, top: top }
    ])
    .jpeg({ quality: 97 })
    .toFile(outJpg);

  // If this is purple-rose, also update template_with_perfume.jpg
  if (prod.id === 'purple-rose') {
    fs.copyFileSync(outJpg, path.join(__dirname, '..', 'public', 'images', 'ghalati_purple_rose.jpg'));
    fs.copyFileSync(outJpg, path.join(__dirname, '..', 'public', 'images', 'template_with_perfume.jpg'));
  }

  console.log(`Saved master image for ${prod.id}: ${outJpg}`);
}

async function run() {
  for (const p of products) {
    try {
      await processProduct(p);
    } catch(e) {
      console.error(`Failed ${p.id}:`, e);
    }
  }
  console.log('All 10 products successfully composited!');
}

run().catch(console.error);
