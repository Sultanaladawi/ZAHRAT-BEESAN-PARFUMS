const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'deraah_perfumes.json');
const MASTER_ARCHIVE_PATH = path.join(__dirname, '..', 'data', 'deraah_master_archive.json');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

async function processOfficialStorePhoto(rawBuf, outPath) {
  const img = sharp(rawBuf);
  const meta = await img.metadata();
  
  // Create square 1024x1024 clean white studio canvas
  const fitted = await sharp(rawBuf)
    .resize(920, 920, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((1024 - fitted.info.width) / 2);
  const top = Math.round((1024 - fitted.info.height) / 2);

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: '#ffffff'
    }
  })
    .composite([{ input: fitted.data, left, top }])
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function revertPackagesAndMists() {
  const catalog = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));
  const targetIds = [
    'deraah-10111101762030-1001', // معطر شعر برايفت 30 مل
    'deraah-10111101752150-1001', // معطر جسم وشعر 5.5.5 من برايفت
    'deraah-10111021751150-1002', // معطر جسم وشعر سيرين من مايوس
    'deraah-10111041752150-1002', // معطر جسم وشعر دريم النسائي
    'deraah-10111031022000-1536', // جلامور كوليكشن نسائى
    'deraah-10111061751150-1001'  // معطر جسم وشعر فيجن من جنجل
  ];

  console.log(`Reverting ${targetIds.length} Deraah packages/mists off podiums...`);

  for (const item of catalog) {
    if (targetIds.includes(item.id)) {
      const match = (item.image || '').match(/deraah-(\d+)\.jpg/);
      if (!match) continue;
      const num = match[1];
      const outPath = path.join(PUBLIC_IMAGES_DIR, `deraah_deraah-${num}.jpg`);
      const rawUrl = item.originalImage || item.bottleUrl || item.galleryImages?.[0];

      if (item.title.includes('كوليكشن')) {
        item.categoryType = 'bundle';
      } else {
        item.categoryType = 'bakhoor'; // Groups with mists/fresheners/home
      }

      console.log(`[deraah-${num}] Reverting: ${item.title}...`);
      try {
        const res = await fetch(rawUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await processOfficialStorePhoto(buf, outPath);
        console.log(`  -> SUCCESS: ${outPath}`);
      } catch (err) {
        console.error(`  -> ERROR for ${item.title}:`, err.message);
      }
    }
  }

  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  if (fs.existsSync(MASTER_ARCHIVE_PATH)) {
    fs.writeFileSync(MASTER_ARCHIVE_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  }
  console.log('Done reverting packages and mists!');
}

revertPackagesAndMists().catch(console.error);
