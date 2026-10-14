const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'deraah_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'deraah_perfumes.json');
const MASTER_ARCHIVE_PATH = path.join(__dirname, '..', 'data', 'deraah_master_archive.json');
const CACHE_DIR = path.join(__dirname, 'raw_deraah');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

async function processBottleToPodium(rawBuf, slug, isSet = false) {
  const outJpgPath = path.join(PUBLIC_IMAGES_DIR, `deraah_${slug}.jpg`);
  const pngCutoutPath = path.join(CACHE_DIR, `${slug}.png`);

  // Extract transparent PNG bottle (clean white studio keyout)
  const { data, info } = await sharp(rawBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, c = info.channels;

  for (let i = 0; i < data.length; i += c) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 242 && g > 242 && b > 242) {
      data[i + 3] = 0;
    } else if (r > 225 && g > 225 && b > 225) {
      const diff = Math.max(r, g, b) - 225;
      data[i + 3] = Math.max(0, 255 - diff * 8);
    }
  }

  const cleanBottle = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .png()
    .toBuffer({ resolveWithObject: true });

  // Save the transparent PNG for future use or export
  try {
    fs.writeFileSync(pngCutoutPath, cleanBottle.data);
  } catch (e) {}

  // Resize to fit the podium (height ~490 for bottles, ~440 for sets)
  const targetH = isSet ? 440 : 490;
  const resized = await sharp(cleanBottle.data)
    .resize({ height: targetH, fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const podiumContactY = 746;
  const top = podiumContactY - bH;

  // Realistic contact shadow
  const shadowW = Math.round(bW * 1.15);
  const shadowSvg = `
  <svg width="${shadowW}" height="30" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.5" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.8" />
      </filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.42}" ry="9" fill="#1f1810" opacity="0.65" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.28}" ry="4.5" fill="#0a0704" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  // Composite onto Deraah Master Background
  await sharp(MASTER_BG_PATH)
    .composite([
      { input: shadowBuf, left: Math.round(left - (shadowW - bW) / 2), top: podiumContactY - 14 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(outJpgPath);

  return `images/deraah_${slug}.jpg`;
}

async function renderBatch(limit = 0, concurrency = 5) {
  if (!fs.existsSync(PUBLIC_DATA_PATH)) {
    console.error('Deraah perfumes data not found!');
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));
  const totalToProcess = limit > 0 ? Math.min(limit, catalog.length) : catalog.length;
  console.log(`Starting podium rendering for ${totalToProcess} Deraah perfumes (concurrency: ${concurrency})...`);

  let count = 0;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < totalToProcess) {
      const i = currentIndex++;
      const item = catalog[i];
      const slug = (item.slug || `deraah-${i+1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const isSet = item.categoryType === 'bundle' || (item.title || '').includes('طقم');
      const outRelative = `images/deraah_${slug}.jpg`;
      const outFull = path.join(PUBLIC_IMAGES_DIR, `deraah_${slug}.jpg`);

      const rawUrl = (item.originalImage && item.originalImage.startsWith('http'))
        ? item.originalImage
        : ((item.bottleUrl && item.bottleUrl.startsWith('http'))
          ? item.bottleUrl
          : ((item.image && item.image.startsWith('http')) ? item.image : null));

      if (fs.existsSync(outFull)) {
        item.image = outRelative;
        if (rawUrl) {
          item.bottleUrl = rawUrl;
          item.originalImage = rawUrl;
          if (!Array.isArray(item.galleryImages) || item.galleryImages.length === 0) {
            item.galleryImages = [rawUrl];
          }
        }
        count++;
        continue;
      }

      if (!rawUrl) continue;

      try {
        const res = await fetch(rawUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const newImgPath = await processBottleToPodium(buf, slug, isSet);
        item.image = newImgPath;
        item.bottleUrl = rawUrl;
        item.originalImage = rawUrl;
        if (!Array.isArray(item.galleryImages) || item.galleryImages.length === 0) {
          item.galleryImages = [rawUrl];
        } else if (!item.galleryImages.includes(rawUrl)) {
          item.galleryImages.unshift(rawUrl);
        }
        count++;
        console.log(`  ✅ [${count}/${totalToProcess}] Mounted on podium: ${item.title}`);
      } catch (err) {
        console.error(`  ❌ Failed for [${i+1}] ${item.title}:`, err.message);
      }

      if (count % 25 === 0) {
        fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(catalog, null, 2), 'utf8');
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  if (fs.existsSync(MASTER_ARCHIVE_PATH)) {
    fs.writeFileSync(MASTER_ARCHIVE_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  }

  console.log(`\n🎉 Successfully completed mounting ${count}/${totalToProcess} Deraah perfumes onto the luxury template with original store gallery images!`);
}

const args = process.argv.slice(2);
const limit = args[0] ? parseInt(args[0], 10) : 0;
const concurrency = args[1] ? parseInt(args[1], 10) : 6;
renderBatch(limit, concurrency).catch(console.error);
