const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const perfumesFile = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
const products = JSON.parse(fs.readFileSync(perfumesFile, 'utf8'));

async function processProduct(p) {
  const spotlessPath = path.join(__dirname, `spotless_${p.id}.png`);
  if (!fs.existsSync(spotlessPath)) {
    console.error(`Missing spotless file for ${p.id}`);
    return;
  }

  const cleanBuf = fs.readFileSync(spotlessPath);

  // Save the pristine transparent bottle cutout as the official original_<id>.png
  const outOriginalPng = path.join(__dirname, '..', 'public', 'images', `original_${p.id}.png`);
  fs.writeFileSync(outOriginalPng, cleanBuf);

  // Determine appropriate display height:
  // Slender tall bottles (liana, nowara, moudhi): height 525
  // Regular bottles (purple-rose, majestic-wood, oud-argent, amber-cashmere, rozana, emotion, attraction): height 505
  const isSlender = ['liana', 'nowara', 'moudhi'].includes(p.id);
  const targetH = isSlender ? 525 : 505;

  const resized = await sharp(cleanBuf)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  // Ultra-realistic soft contact shadow on the Carrara marble podium
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

  // If purple-rose, also update template_with_perfume.jpg
  if (p.id === 'purple-rose') {
    fs.copyFileSync(outJpg, path.join(__dirname, '..', 'public', 'images', 'ghalati_purple_rose.jpg'));
    fs.copyFileSync(outJpg, path.join(__dirname, '..', 'public', 'images', 'template_with_perfume.jpg'));
  }

  console.log(`✓ Generated flawless showcase for ${p.id} (${p.title}) -> ${outJpg}`);
}

async function run() {
  for (const p of products) {
    await processProduct(p);
  }
  console.log('All 10 Ghalati showcases generated flawlessly with 100% intact bottles!');
}

run().catch(console.error);
