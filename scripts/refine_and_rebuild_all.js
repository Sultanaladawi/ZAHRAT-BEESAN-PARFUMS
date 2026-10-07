const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const perfumesFile = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
const products = JSON.parse(fs.readFileSync(perfumesFile, 'utf8'));

async function refineProduct(p) {
  let inPath;
  if (p.id === 'purple-rose') {
    inPath = path.join(__dirname, 'purple_rose_clean.png');
  } else {
    inPath = path.join(__dirname, `imgly_${p.id}.png`);
  }

  const { data, info } = await sharp(inPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Find approximate center column
  let sumX = 0, count = 0;
  for (let y = Math.round(h * 0.2); y < Math.round(h * 0.8); y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 100) {
        sumX += x;
        count++;
      }
    }
  }
  const centerX = count > 0 ? Math.round(sumX / count) : 500;

  // Clear any residual studio drop shadows:
  // 1. Far left/right edges
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a === 0) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      // Studio drop shadow is neutral gray (diff <= 6)
      if (diff <= 6) {
        // Shadow on the left of bottle
        if (x < centerX - 40 && min >= 90) {
          data[idx + 3] = 0;
        }
        // Shadow near edges
        if ((x < centerX - 120 || x > centerX + 180) && min >= 70) {
          data[idx + 3] = 0;
        }
        // Shadow underneath the glass base
        if (y > h * 0.88 && min >= 110) {
          data[idx + 3] = 0;
        }
      }

      // Very faint compression noise
      if (a < 35 && (x < centerX - 100 || x > centerX + 180)) {
        data[idx + 3] = 0;
      }
    }
  }

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();

  const trimmed = await sharp(cleaned).trim().toBuffer({ resolveWithObject: true });
  const spotlessPath = path.join(__dirname, `spotless_${p.id}.png`);
  fs.writeFileSync(spotlessPath, trimmed.data);

  // Save spotless cutout as original_<id>.png
  const outOriginalPng = path.join(__dirname, '..', 'public', 'images', `original_${p.id}.png`);
  fs.writeFileSync(outOriginalPng, trimmed.data);

  // Target heights
  const isSlender = ['liana', 'nowara', 'moudhi'].includes(p.id);
  const targetH = isSlender ? 525 : 505;

  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  // Realistic contact shadow
  const shadowW = bW + 50;
  const shadowH = 30;
  const shadowSvg = `
  <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.5" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.42}" ry="8" fill="#1b1209" opacity="0.65" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.28}" ry="4" fill="#080503" opacity="0.9" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const outJpg = path.join(__dirname, '..', 'public', 'images', `ghalati_${p.id}.jpg`);

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 25), top: baseContactY - 14 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(outJpg);

  if (p.id === 'purple-rose') {
    fs.copyFileSync(outJpg, path.join(__dirname, '..', 'public', 'images', 'ghalati_purple_rose.jpg'));
    fs.copyFileSync(outJpg, path.join(__dirname, '..', 'public', 'images', 'template_with_perfume.jpg'));
  }

  console.log(`✓ [${p.id}] W=${bW}, H=${bH}, placed at left=${left}, top=${top} -> ${outJpg}`);
}

async function run() {
  for (const p of products) {
    await refineProduct(p);
  }
  console.log('Done refining all 10 products!');
}

run().catch(console.error);
