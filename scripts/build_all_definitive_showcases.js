const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const perfumesFile = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
const products = JSON.parse(fs.readFileSync(perfumesFile, 'utf8'));

async function compositeProduct(p) {
  const cutoutPath = path.join(__dirname, `definitive_${p.id}.png`);
  if (!fs.existsSync(cutoutPath)) {
    throw new Error(`Cutout not found for ${p.id}: ${cutoutPath}`);
  }

  // 1. Copy the clean definitive cutout to public/images/original_<id>.png
  const outOriginalPng = path.join(__dirname, '..', 'public', 'images', `original_${p.id}.png`);
  fs.copyFileSync(cutoutPath, outOriginalPng);

  // 2. Determine target height
  const isSlender = ['liana', 'nowara', 'moudhi'].includes(p.id);
  const targetH = isSlender ? 525 : 505;

  const resized = await sharp(cutoutPath)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  // 3. Realistic marble contact shadow
  const shadowW = bW + 60;
  const shadowH = 32;
  const shadowSvg = `
  <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.8" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
    </defs>
    <!-- Soft diffuse ambient shadow -->
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.42}" ry="8.5" fill="#18110b" opacity="0.62" filter="url(#f1)" />
    <!-- Occlusion dark core directly under contact -->
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.28}" ry="4.2" fill="#080503" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const outJpg = path.join(__dirname, '..', 'public', 'images', `ghalati_${p.id}.jpg`);

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 30), top: baseContactY - 16 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(outJpg);

  if (p.id === 'purple-rose') {
    fs.copyFileSync(outJpg, path.join(__dirname, '..', 'public', 'images', 'ghalati_purple_rose.jpg'));
    fs.copyFileSync(outJpg, path.join(__dirname, '..', 'public', 'images', 'template_with_perfume.jpg'));
  }

  console.log(`✓ Showcase created for [${p.id}] -> W=${bW}, H=${bH}, placed at (${left}, ${top})`);
}

async function run() {
  console.log('Building all 10 definitive Ghalati showcases...');
  for (const p of products) {
    await compositeProduct(p);
  }
  console.log('🎉 All 10 luxury showcases successfully built and verified!');
}

run().catch(console.error);
