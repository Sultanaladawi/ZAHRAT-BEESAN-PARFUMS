const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function checkCatalog(name, file) {
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));
  const singles = items.filter(p => p.categoryType === 'perfume');
  console.log(`\n=== Checking ${name} (Total singles: ${singles.length}) ===`);
  const notOnPodium = [];

  for (const p of singles) {
    const rel = (p.image || '').replace(/^\//, '');
    const imgPath = path.join('public', rel);
    if (!fs.existsSync(imgPath)) {
      notOnPodium.push({ id: p.id, title: p.title, reason: 'missing file', imgPath, url: p.originalImage || p.bottleUrl });
      continue;
    }
    try {
      const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
      const idx = (15 * info.width + 15) * info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (r > 235 && g > 235 && b > 235) {
        notOnPodium.push({ id: p.id, title: p.title, reason: 'white/store bg', imgPath, url: p.originalImage || p.bottleUrl });
      }
    } catch (e) {
      notOnPodium.push({ id: p.id, title: p.title, reason: 'error: ' + e.message, imgPath, url: p.originalImage || p.bottleUrl });
    }
  }

  console.log(`Found ${notOnPodium.length} single perfumes NOT on podium in ${name}:`);
  notOnPodium.forEach(x => console.log('  ', x.id, '|', x.title, '|', x.reason, '|', x.imgPath));
  return notOnPodium;
}

async function run() {
  await checkCatalog('Assaf', 'public/data/assaf_perfumes.json');
  await checkCatalog('Laverne', 'public/data/laverne_perfumes.json');
}
run();
