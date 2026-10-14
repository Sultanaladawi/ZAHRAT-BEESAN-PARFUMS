const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'deraah_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const RAW_DIR = path.join(__dirname, 'raw_deraah');

async function fixHollowBottle(rawBuf, slug) {
  const outJpgPath = path.join(PUBLIC_IMAGES_DIR, `deraah_${slug}.jpg`);
  const pngCutoutPath = path.join(RAW_DIR, `${slug}.png`);

  // 1. Use AI semantic segmentation to remove background while keeping white/clear bottle intact
  const blob = new Blob([rawBuf], { type: 'image/jpeg' });
  const cutBlob = await removeBackground(blob);
  const cutBuf = Buffer.from(await cutBlob.arrayBuffer());

  // 2. Trim around true bottle
  const cleanBottle = await sharp(cutBuf).trim().png().toBuffer({ resolveWithObject: true });
  try {
    fs.writeFileSync(pngCutoutPath, cleanBottle.data);
  } catch (e) {}

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
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.42}" ry="9.5" fill="#1d160e" opacity="0.68" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.28}" ry="4.8" fill="#090603" opacity="0.90" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(MASTER_BG_PATH)
    .composite([
      { input: shadowBuf, left: Math.round(left - (shadowW - bW) / 2), top: podiumContactY - 15 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(outJpgPath);

  return outJpgPath;
}

async function fixAllHollow() {
  const deraah = JSON.parse(fs.readFileSync('public/data/deraah_perfumes.json', 'utf8'));

  const targetSlugs = [
    'deraah-10111021011100-1159',
    'deraah-10111021012075-1439',
    'deraah-10111011011100-1007',
    'deraah-10111051011100-1137',
    'deraah-10111081012090-1038',
    'deraah-10111081012070-1218',
    'deraah-10111011012100-1043',
    'deraah-10111011011100-1156',
    'deraah-10111021013125-1293',
    'deraah-10111081012075-1086',
    'deraah-10111031011100-1251',
    'deraah-10111081012095-1171',
    'deraah-10111091011100-1125',
    'deraah-10111071012085-1389',
    'deraah-10111061011100-1208',
    'deraah-10111061012100-1348',
    'deraah-10111021751150-1002',
    'deraah-10111021011100-1260',
    'deraah-10111091012095-1144',
    'deraah-10111021011150-1159',
    'deraah-10111011011100-1063',
    'deraah-10111061011100-1202',
    'deraah-10111051012075-1196',
    'deraah-10111131011100-1385',
    'deraah-10111061751150-1001'
  ];

  console.log(`Fixing ${targetSlugs.length} hollow Deraah bottles with AI segmentation...`);

  for (let i = 0; i < targetSlugs.length; i++) {
    const slug = targetSlugs[i];
    const item = deraah.find(p => p.id === slug || (p.slug || '').includes(slug));
    if (!item) {
      console.warn(`Could not find item for ${slug}`);
      continue;
    }
    const rawUrl = item.originalImage || item.bottleUrl || item.image;
    console.log(`[${i + 1}/${targetSlugs.length}] Processing AI cutout for: ${item.title}...`);

    try {
      const res = await fetch(rawUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        console.error(`Failed to fetch ${rawUrl}`);
        continue;
      }
      const rawBuf = Buffer.from(await res.arrayBuffer());
      const fixedPath = await fixHollowBottle(rawBuf, slug);
      console.log(`  -> SUCCESS! Restored full bottle on podium: ${fixedPath}`);
    } catch (e) {
      console.error(`  -> ERROR on ${slug}: ${e.message}`);
    }
  }

  console.log('All hollow Deraah bottles repaired successfully!');
}

fixAllHollow().catch(console.error);
