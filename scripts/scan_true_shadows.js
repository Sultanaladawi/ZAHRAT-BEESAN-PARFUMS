const sharp = require('sharp');
const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const masterBgPath = 'public/images/ghalati_master_bg.jpg';

async function scanTrueShadows() {
  const masterRaw = await sharp(masterBgPath).raw().toBuffer({ resolveWithObject: true });
  const mData = masterRaw.data;

  console.log('Scanning ONLY the empty background space outside the bottle...\n');

  for (const p of perfumes) {
    if (p.categoryType && p.categoryType !== 'perfume') continue;

    const imgPath = 'public/' + p.image;
    if (!fs.existsSync(imgPath)) continue;

    // Check original png to get bottle width
    const origPath = 'public/' + p.originalImage;
    if (!fs.existsSync(origPath)) continue;

    const origMeta = await sharp(origPath).metadata();
    const aspect = origMeta.width / origMeta.height;
    const bW = Math.round(515 * aspect);
    const bottleLeft = Math.round((1024 - bW) / 2);
    const bottleRight = bottleLeft + bW;

    const { data } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });

    // Check outside bottle on left: from bottleLeft - 100 to bottleLeft - 5
    let leftShadowPixels = 0;
    for (let y = 300; y < 700; y += 3) {
      for (let x = Math.max(100, bottleLeft - 90); x < bottleLeft - 6; x += 3) {
        const idx = (y * 1024 + x) * 4;
        const delta = (mData[idx] - data[idx]) + (mData[idx+1] - data[idx+1]) + (mData[idx+2] - data[idx+2]);
        if (delta > 25) {
          leftShadowPixels++;
        }
      }
    }

    if (leftShadowPixels > 10) {
      console.log(`⚠️ RESIDUAL SHADOW OUTSIDE BOTTLE: ${p.id} -> ${leftShadowPixels} dark pixels on the left!`);
    } else {
      console.log(`✓ Clean: ${p.id}`);
    }
  }
}

scanTrueShadows();
