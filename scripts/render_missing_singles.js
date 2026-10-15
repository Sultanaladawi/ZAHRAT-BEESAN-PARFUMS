const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');

const LAVERNE_BG = path.join(__dirname, '..', 'public', 'images', 'laverne_master_bg.jpg');
const ASSAF_BG = path.join(__dirname, '..', 'public', 'images', 'assaf_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

async function renderBottleOnPodium(rawBuf, bgPath, outPath) {
  // 1. Clean AI Cutout
  const blob = new Blob([rawBuf], { type: 'image/jpeg' });
  const cutBlob = await removeBackground(blob);
  const cutBuf = Buffer.from(await cutBlob.arrayBuffer());

  // 2. Trim around bottle
  const cleanBottle = await sharp(cutBuf).trim().png().toBuffer({ resolveWithObject: true });
  const bW_orig = cleanBottle.info.width;
  const bH_orig = cleanBottle.info.height;
  const aspect = bW_orig / bH_orig;

  let targetW, targetH;
  if (aspect > 1.15) {
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
  const left = Math.round((1024 - bW) / 2);
  const podiumContactY = 746;
  const top = podiumContactY - bH;

  const shadowW = Math.round(bW * 1.12);
  const shadowSvg = `
  <svg width="${shadowW}" height="32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.8" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.42}" ry="9.5" fill="#1b1209" opacity="0.68" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.28}" ry="4.8" fill="#080503" opacity="0.90" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(bgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - (shadowW - bW) / 2), top: podiumContactY - 15 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function run() {
  const lav = JSON.parse(fs.readFileSync('public/data/laverne_perfumes.json', 'utf8'));
  const assaf = JSON.parse(fs.readFileSync('public/data/assaf_perfumes.json', 'utf8'));

  // 1. Laverne missing singles
  const targetLaverne = [
    'laverne-DGOgbBW', // ليسن
    'laverne-oZdXBGY', // ذا ريل باتشولي
    'laverne-EXKzNoQ', // ماجيستك
    'laverne-wARadPK', // قلوري
    'laverne-rRKPBPZ', // اكسبشنال
    'laverne-vAgdGdo', // امبريال
    'laverne-xvnOKOg'  // نايت اندر ذا ستار
  ];

  console.log(`=== Processing ${targetLaverne.length} Laverne single perfumes onto Laverne podium ===`);
  for (const id of targetLaverne) {
    const item = lav.find(p => p.id === id);
    if (!item) { console.warn('Missing Laverne item:', id); continue; }
    const outPath = path.join(PUBLIC_IMAGES_DIR, `laverne_${id.replace('laverne-', '')}.jpg`);
    const rawUrl = item.originalImage || item.bottleUrl;
    console.log(`Processing Laverne: ${item.title}...`);
    try {
      const res = await fetch(rawUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error('Fetch status ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      await renderBottleOnPodium(buf, LAVERNE_BG, outPath);
      console.log(`  -> SUCCESS! Saved to: ${outPath}`);
    } catch (e) {
      console.error(`  -> ERROR on ${item.title}: ${e.message}`);
    }
  }

  // 2. Assaf single perfumes
  const targetAssaf = [
    'assaf-150537914', // فرانكل ايماجنيشن 25 مل
    'assaf-611082214', // مس قريس - 25 مل
    'assaf-304264724', // فرانكل افنتوس 25 مل
    'assaf-2061203365', // أروقيت كوميت 25 مل
    'assaf-547643241', // عطر بينك ليدي 25 مل
    'assaf-1565660433'  // عطر مس أروقيت 25 مل
  ];

  console.log(`\n=== Processing ${targetAssaf.length} Assaf single perfumes onto Assaf podium ===`);
  for (const id of targetAssaf) {
    const item = assaf.find(p => p.id === id);
    if (!item) { console.warn('Missing Assaf item:', id); continue; }
    const sId = id.replace('assaf-', '');
    const outPath = path.join(PUBLIC_IMAGES_DIR, `assaf_${sId}.jpg`);
    const rawUrl = item.originalImage || item.bottleUrl;
    console.log(`Processing Assaf: ${item.title}...`);
    try {
      const res = await fetch(rawUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error('Fetch status ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      await renderBottleOnPodium(buf, ASSAF_BG, outPath);
      console.log(`  -> SUCCESS! Saved to: ${outPath}`);
    } catch (e) {
      console.error(`  -> ERROR on ${item.title}: ${e.message}`);
    }
  }

  // Also ensure categoryType in Assaf for these 6 is 'perfume'
  const archivePath = path.join(__dirname, '..', 'data', 'assaf_master_archive.json');
  const publicPath = path.join(__dirname, '..', 'public', 'data', 'assaf_perfumes.json');
  const assafArchive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));

  [assaf, assafArchive].forEach(list => {
    list.forEach(p => {
      if (targetAssaf.includes(p.id)) {
        p.categoryType = 'perfume';
      }
    });
  });

  fs.writeFileSync(publicPath, JSON.stringify(assaf, null, 2), 'utf8');
  fs.writeFileSync(archivePath, JSON.stringify(assafArchive, null, 2), 'utf8');

  console.log('\nAll single perfumes in Laverne and Assaf have been rendered onto their luxury master podiums!');
}

run().catch(console.error);
