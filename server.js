const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  // Optional fallback if sharp is unavailable in a minimal environment
}

const app = express();
const PORT = process.env.PORT || 5005;

const PERFUMES_PATH = path.join(__dirname, 'public', 'data', 'perfumes.json');
const ARCHIVE_PATH = path.join(__dirname, 'data', 'perfumes_master_archive.json');
const MASTER_BG_PATH = path.join(__dirname, 'public', 'images', 'ghalati_master_bg.jpg');

const ASSAF_PERFUMES_PATH = path.join(__dirname, 'public', 'data', 'assaf_perfumes.json');
const ASSAF_ARCHIVE_PATH = path.join(__dirname, 'data', 'assaf_master_archive.json');
const ASSAF_MASTER_BG_PATH = path.join(__dirname, 'public', 'images', 'assaf_master_bg.jpg');

app.use(compression());
app.use(express.json());

// ── Live Direct Sync & Auto-Discovery Engine with Official Ghalati & Assaf Stores (Salla API) ──
let cachedCatalog = null;
let lastSyncTime = 0;
let isSyncing = false;

let cachedAssafCatalog = null;
let lastAssafSyncTime = 0;
let isSyncingAssaf = false;

const SYNC_TTL_MS = 60 * 1000; // Refresh live data every 60 seconds

function getMasterCatalog(archivePath = ARCHIVE_PATH, publicPath = PERFUMES_PATH) {
  try {
    if (fs.existsSync(archivePath)) {
      return JSON.parse(fs.readFileSync(archivePath, 'utf8'));
    }
    const current = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
    const dataDir = path.dirname(archivePath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(archivePath, JSON.stringify(current, null, 2), 'utf8');
    return current;
  } catch (err) {
    console.error('Error reading master catalog:', err.message);
    return [];
  }
}

const EXCLUDED_SALLA_IDS = new Set([
  '1180808215' // Duplicate old Liana
]);

const EXCLUDED_ASSAF_SALLA_IDS = new Set([
  '1855721790', // مجموعة فرحة وطن (sunglasses)
  '829997380',  // العرض العالمي (watch + sunglasses)
  '796362785',  // مجموعة أورا مع هدية (sunglasses)
  '899014836',  // مجموعة ثلاثيه اورا (sunglasses)
  '1691037198', // مجموعة سترايك اورا (sunglasses)
  '1142435325', // مجموعة كريم اليد ليدي (hand creams)
  '1880252117', // فرانكل تشيل (cancelled)
  '1403084485',
  '2077147024',
  '415811600',
  '1517236607'
]);

const ASSAF_FEE_30_IDS = new Set([
  '1715267935', '176251001', '79328031', '1668518142', '1131719368',
  '88128890', '814804017', '1755285826', '1731158495',
  '527229526', '1310869051', '158079522', '2089452030', '1968936567',
  '2053809509'
]);

const ASSAF_FEE_24_IDS = new Set([
  '369088822', '2075831998', '1436733170', '1955253099', '1502527852',
  '1036243994', '615644271', '1788666212', '780287822', '1492041621',
  '1036673145', '1850175256', '57443660', '1616970094', '2056378606',
  '683924030'
]);

function detectCategoryType(name = '', desc = '') {
  const text = `${name} ${desc}`;
  if (/باقة|مجموعة|بكج|صندوق|عرض|ثلاثية|ثنائية|تشكيلة/i.test(name)) return 'bundle';
  if (/تولة|زيت عطري|مسك.*15\s*مل/i.test(text)) return 'oil';
  if (/بخور|معمول|معطر جو|دخون|مبثوث|لبان/i.test(name)) return 'bakhoor';
  return 'perfume';
}

function inferBottleCount(name = '', desc = '', catType = 'perfume') {
  if (catType !== 'bundle') return 1;
  const text = `${name} ${desc}`;
  if (/باقة التاريخ|15\s*مل|15\s*ml|25\s*مل|25\s*ml|30\s*مل|30\s*ml|10\s*مل|ميني|ديسكفري|عينات/i.test(text)) return 1;
  if (/مجموعة التراث|عطرين|عطران|ثنائية|لك ولها|2\s*×|قطعتين/i.test(text)) return 2;
  if (/ثلاث|3\s*عطور|3\s*×|باقة|بكج|العرض/i.test(text)) return 3;
  return 1;
}

function getBottleCount(item) {
  const sid = String(item?.sallaId || '');
  if (ASSAF_FEE_30_IDS.has(sid)) return 3;
  if (ASSAF_FEE_24_IDS.has(sid)) return 2;
  if (item && Number(item.bottleCount) >= 1) return Number(item.bottleCount);
  return inferBottleCount(item?.title || '', item?.overview || '', item?.categoryType || 'perfume');
}

function getDeliveryFeeJod(item) {
  const sid = String(item?.sallaId || '');
  if (ASSAF_FEE_30_IDS.has(sid)) return 30;
  if (ASSAF_FEE_24_IDS.has(sid)) return 24;
  if (item && Number(item.feeJod) > 0) return Number(item.feeJod);
  const id = item?.id || '';
  const text = `${item?.title || ''} ${item?.overview || ''}`;
  if (id === 'package-air-fresheners' || /بكج معطرات|معطرات الجو/i.test(item?.title || '')) return 20;
  if (id === 'bundle-heritage-collection' || /مجموعة التراث/i.test(text)) return 24;
  if (id === 'bundle-altarikh' || /باقة التاريخ|15\s*مل|15\s*ml|25\s*مل|25\s*ml|30\s*مل|30\s*ml|10\s*مل|ميني|ديسكفري/i.test(text)) return 12;
  const count = getBottleCount(item);
  if (count === 3) return 30;
  if (count === 2) return 24;
  return 12;
}

async function generateAutoProductImage(idSlug, rawImgUrl, categoryType, house = 'ghalati') {
  const prefix = house === 'assaf' ? `assaf_${idSlug.replace(/^assaf-/, '')}` : `ghalati_${idSlug}`;
  const relImg = `images/${prefix}.jpg`;
  const absImg = path.join(__dirname, 'public', 'images', `${prefix}.jpg`);
  if (fs.existsSync(absImg)) return relImg;
  const bgPath = house === 'assaf' ? ASSAF_MASTER_BG_PATH : MASTER_BG_PATH;
  if (!sharp || !rawImgUrl) return rawImgUrl || `images/${house}_master_bg.jpg`;

  try {
    const origUrl = rawImgUrl.replace(/\/[a-f0-9-]+-\d+x[\d.]+-/, '/');
    let res = await fetch(origUrl);
    if (!res.ok) res = await fetch(rawImgUrl);
    if (!res.ok) return rawImgUrl;
    const buf = Buffer.from(await res.arrayBuffer());

    if (categoryType === 'bundle' && house === 'ghalati') {
      const inner = await sharp(buf)
        .resize({ width: 940, height: 940, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer();
      await sharp({
        create: {
          width: 1024,
          height: 1024,
          channels: 4,
          background: { r: 247, g: 245, b: 240, alpha: 1 }
        }
      })
        .composite([{ input: inner, gravity: 'center' }])
        .jpeg({ quality: 95 })
        .toFile(absImg);
      return relImg;
    }

    if (fs.existsSync(bgPath)) {
      const { data, info } = await sharp(buf)
        .resize({ width: 1100, height: 1100, fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r >= 244 && g >= 244 && b >= 244) data[i + 3] = 0;
      }
      const cleaned = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
      const trimmed = await sharp(cleaned).trim().toBuffer();
      const resized = await sharp(trimmed)
        .resize({ width: categoryType === 'bundle' ? 640 : 480, height: categoryType === 'bundle' ? 490 : 515, fit: 'inside', kernel: 'lanczos3' })
        .toBuffer({ resolveWithObject: true });
      const bW = resized.info.width, bH = resized.info.height;
      const left = Math.round((1024 - bW) / 2);
      const baseContactY = 746;
      const top = baseContactY - bH;
      await sharp(bgPath)
        .composite([{ input: resized.data, left, top }])
        .jpeg({ quality: 95 })
        .toFile(absImg);
      return relImg;
    }
  } catch (e) {
    console.warn('Auto image generation fallback:', e.message);
  }
  return rawImgUrl;
}

async function syncWithGhalatiStore(force = false) {
  const now = Date.now();
  if (!force && cachedCatalog && (now - lastSyncTime < SYNC_TTL_MS)) {
    return cachedCatalog;
  }
  if (isSyncing && cachedCatalog) {
    return cachedCatalog;
  }

  isSyncing = true;
  try {
    const masterList = getMasterCatalog(ARCHIVE_PATH, PERFUMES_PATH).filter(p => {
      const sid = String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || '');
      return !EXCLUDED_SALLA_IDS.has(sid);
    });
    if (!masterList.length) {
      isSyncing = false;
      return [];
    }

    const headers = {
      'Origin': 'https://ghalati.com',
      'Referer': 'https://ghalati.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'App-Store-Id': '1939633486',
      'Store-Identifier': '1939633486',
      'Accept': 'application/json, text/plain, */*'
    };

    const knownIds = new Set(
      masterList
        .map(p => String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || ''))
        .filter(Boolean)
    );

    const discoveredNewItems = [];
    try {
      const latestRes = await fetch('https://api.salla.dev/store/v1/products?source=latest&limit=30', { headers });
      if (latestRes.ok) {
        const latestJson = await latestRes.json();
        for (const it of (latestJson.data || [])) {
          const sid = String(it.id);
          if (!knownIds.has(sid) && !EXCLUDED_SALLA_IDS.has(sid)) {
            knownIds.add(sid);
            discoveredNewItems.push(it);
          }
        }
      }
    } catch (e) {}

    const allIds = [...knownIds];
    const chunks = [];
    for (let i = 0; i < allIds.length; i += 20) {
      chunks.push(allIds.slice(i, i + 20));
    }

    const liveById = new Map();
    await Promise.all(
      chunks.map(async (chunk) => {
        const q = 'source=selected&limit=30&' + chunk.map(id => `source_value[]=${id}`).join('&');
        const res = await fetch(`https://api.salla.dev/store/v1/products?${q}`, { headers });
        if (res.ok) {
          const json = await res.json();
          for (const it of (json.data || [])) {
            liveById.set(String(it.id), it);
          }
        }
      })
    );

    if (liveById.size > 0) {
      const syncedCatalog = [];
      let changesDetected = false;

      const newBuiltItems = [];
      for (const rawNew of discoveredNewItems) {
        const live = liveById.get(String(rawNew.id)) || rawNew;
        const sid = String(live.id);
        if (EXCLUDED_SALLA_IDS.has(sid)) continue;
        const idSlug = `ghalati-${sid}`;
        const livePrice = Number(typeof live.price === 'object' ? live.price?.amount : live.price) || 95;
        const liveRegRaw = Number(typeof live.regular_price === 'object' ? live.regular_price?.amount : live.regular_price) || livePrice;
        const liveReg = Math.round(liveRegRaw);
        const liveAvail = live.is_available !== false && live.status !== 'out' && !live.is_out_of_stock;
        const liveStatus = live.status || (liveAvail ? 'sale' : 'out');
        const cleanDesc = (live.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const catType = detectCategoryType(live.name, cleanDesc);
        const bottleCount = inferBottleCount(live.name, cleanDesc, catType);
        const feeJod = getDeliveryFeeJod({ id: idSlug, title: live.name, overview: cleanDesc, categoryType: catType, bottleCount });
        const rawImg = live.image?.url || '';
        const origImgUrl = rawImg.replace(/\/[a-f0-9-]+-\d+x[\d.]+-/, '/');
        const genImage = await generateAutoProductImage(idSlug, rawImg, catType, 'ghalati');

        const baseJod = Math.round(livePrice / 5.29);
        const finalJod = baseJod + feeJod;
        const origJod = liveReg > livePrice ? (Math.round(liveReg / 5.29) + feeJod) : finalJod;

        newBuiltItems.push({
          id: idSlug,
          sallaId: sid,
          house: 'ghalati',
          title: live.name,
          titleEn: live.name,
          brand: 'Ghalati',
          bottleCount,
          feeJod,
          sarPrice: livePrice,
          origSarPrice: liveReg,
          baseJod,
          finalJod,
          origJod,
          isAvailable: liveAvail,
          status: liveStatus,
          promotionTitle: live.promotion_title || '',
          url: live.url || `https://ghalati.com/ar/p${sid}`,
          bottleUrl: origImgUrl || rawImg,
          image: genImage,
          originalImage: origImgUrl || rawImg,
          galleryImages: [genImage],
          overview: cleanDesc || `${live.name} من دار غلاتي للعطور.`,
          overviewEn: cleanDesc || `${live.name} by Ghalati Perfumes.`,
          opening: 'نغمات عطرية فاخرة من دار غلاتي',
          openingEn: 'Luxury opening notes by Ghalati',
          heart: 'قلب عطري غني ومتناغم',
          heartEn: 'Rich harmonious heart notes',
          base: 'قاعدة عطرية أصيلة وثابتة',
          baseEn: 'Long-lasting authentic base notes',
          prominent: 'خلطة غلاتي الملكية الخاصة',
          prominentEn: 'Ghalati Royal Signature Blend',
          specs: {
            size: catType === 'bundle' ? `${bottleCount > 1 ? `${bottleCount} × 100 مل` : 'مجموعة فاخرة'}` : '100 مل',
            category: 'للجنسين',
            origin: 'المملكة العربية السعودية',
            type: catType === 'bundle' ? 'باقة عطور ملكية' : 'عطر أو دو بارفيوم'
          },
          specsEn: {
            size: catType === 'bundle' ? `${bottleCount > 1 ? `${bottleCount} × 100 ml` : 'Luxury Set'}` : '100 ml',
            category: 'Unisex',
            origin: 'Saudi Arabia',
            type: catType === 'bundle' ? 'Royal Perfume Bundle' : 'Eau de Parfum'
          },
          categoryType: catType
        });
        changesDetected = true;
      }

      const combinedMaster = [...newBuiltItems, ...masterList];

      for (const item of combinedMaster) {
        const sallaId = String(item.sallaId || ((item.url || '').match(/\/p(\d+)/) || [])[1] || '');
        if (EXCLUDED_SALLA_IDS.has(sallaId)) continue;
        const live = liveById.get(sallaId);

        if (!live) {
          changesDetected = true;
          continue;
        }

        const p = { ...item, sallaId, house: 'ghalati' };
        const bottleCount = getBottleCount(p);
        const feeJod = getDeliveryFeeJod(p);
        p.bottleCount = bottleCount;
        p.feeJod = feeJod;

        const livePrice = Number(typeof live.price === 'object' ? live.price?.amount : live.price) || p.sarPrice;
        const liveRegRaw = Number(typeof live.regular_price === 'object' ? live.regular_price?.amount : live.regular_price) || livePrice;
        const liveReg = Math.round(liveRegRaw);
        const liveAvail = live.is_available !== false && live.status !== 'out' && !live.is_out_of_stock;
        const liveStatus = live.status || (liveAvail ? 'sale' : 'out');
        const livePromo = live.promotion_title || '';

        const newBaseJod = Math.round(livePrice / 5.29);
        const newFinalJod = newBaseJod + feeJod;
        const newOrigJod = liveReg > livePrice ? (Math.round(liveReg / 5.29) + feeJod) : newFinalJod;

        if (
          p.sarPrice !== livePrice ||
          p.origSarPrice !== liveReg ||
          p.finalJod !== newFinalJod ||
          p.origJod !== newOrigJod ||
          p.isAvailable !== liveAvail ||
          p.status !== liveStatus ||
          p.promotionTitle !== livePromo
        ) {
          changesDetected = true;
        }

        p.sarPrice = livePrice;
        p.origSarPrice = liveReg;
        p.baseJod = newBaseJod;
        p.finalJod = newFinalJod;
        p.origJod = newOrigJod;
        p.isAvailable = liveAvail;
        p.status = liveStatus;
        p.promotionTitle = livePromo;

        syncedCatalog.push(p);
      }

      cachedCatalog = syncedCatalog;
      lastSyncTime = Date.now();

      if (changesDetected) {
        fs.writeFileSync(PERFUMES_PATH, JSON.stringify(syncedCatalog, null, 2), 'utf8');
        if (newBuiltItems.length > 0) {
          fs.writeFileSync(ARCHIVE_PATH, JSON.stringify(syncedCatalog, null, 2), 'utf8');
        }
      }
    } else if (!cachedCatalog) {
      cachedCatalog = JSON.parse(fs.readFileSync(PERFUMES_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Live Ghalati sync warning (using local fallback):', err.message);
    if (!cachedCatalog) {
      try {
        cachedCatalog = JSON.parse(fs.readFileSync(PERFUMES_PATH, 'utf8'));
      } catch (e) {
        cachedCatalog = [];
      }
    }
  } finally {
    isSyncing = false;
  }

  return cachedCatalog;
}

async function syncWithAssafStore(force = false) {
  const now = Date.now();
  if (!force && cachedAssafCatalog && (now - lastAssafSyncTime < SYNC_TTL_MS)) {
    return cachedAssafCatalog;
  }
  if (isSyncingAssaf && cachedAssafCatalog) {
    return cachedAssafCatalog;
  }

  isSyncingAssaf = true;
  try {
    const masterList = getMasterCatalog(ASSAF_ARCHIVE_PATH, ASSAF_PERFUMES_PATH).filter(p => {
      const sid = String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || '');
      return !EXCLUDED_ASSAF_SALLA_IDS.has(sid);
    });
    if (!masterList.length) {
      isSyncingAssaf = false;
      return [];
    }

    const headers = {
      'Origin': 'https://3saf.com',
      'Referer': 'https://3saf.com/ar',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'App-Store-Id': '935113581',
      'Store-Identifier': '935113581',
      'Accept': 'application/json, text/plain, */*'
    };

    const knownIds = new Set(
      masterList
        .map(p => String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || ''))
        .filter(Boolean)
    );

    const allIds = [...knownIds];
    const chunks = [];
    for (let i = 0; i < allIds.length; i += 20) {
      chunks.push(allIds.slice(i, i + 20));
    }

    const liveById = new Map();
    await Promise.all(
      chunks.map(async (chunk) => {
        const q = 'source=selected&limit=30&' + chunk.map(id => `source_value[]=${id}`).join('&');
        const res = await fetch(`https://api.salla.dev/store/v1/products?${q}`, { headers });
        if (res.ok) {
          const json = await res.json();
          for (const it of (json.data || [])) {
            liveById.set(String(it.id), it);
          }
        }
      })
    );

    if (liveById.size > 0) {
      const syncedCatalog = [];
      let changesDetected = false;

      for (const item of masterList) {
        const sallaId = String(item.sallaId || ((item.url || '').match(/\/p(\d+)/) || [])[1] || '');
        if (EXCLUDED_ASSAF_SALLA_IDS.has(sallaId)) continue;
        const live = liveById.get(sallaId);

        if (!live) {
          changesDetected = true;
          continue;
        }

        const p = { ...item, sallaId, house: 'assaf' };
        const bottleCount = getBottleCount(p);
        const feeJod = getDeliveryFeeJod(p);
        p.bottleCount = bottleCount;
        p.feeJod = feeJod;

        const livePrice = Number(typeof live.price === 'object' ? live.price?.amount : live.price) || p.sarPrice;
        const liveRegRaw = Number(typeof live.regular_price === 'object' ? live.regular_price?.amount : live.regular_price) || livePrice;
        const liveReg = Math.round(liveRegRaw);
        const liveAvail = live.is_available !== false && live.status !== 'out' && !live.is_out_of_stock;
        const liveStatus = live.status || (liveAvail ? 'sale' : 'out');
        const livePromo = live.promotion_title || live.subtitle || '';

        const newBaseJod = Math.round(livePrice / 5.29);
        const newFinalJod = newBaseJod + feeJod;
        const newOrigJod = liveReg > livePrice ? (Math.round(liveReg / 5.29) + feeJod) : newFinalJod;

        if (
          p.sarPrice !== livePrice ||
          p.origSarPrice !== liveReg ||
          p.finalJod !== newFinalJod ||
          p.origJod !== newOrigJod ||
          p.isAvailable !== liveAvail ||
          p.status !== liveStatus ||
          p.promotionTitle !== livePromo
        ) {
          changesDetected = true;
        }

        p.sarPrice = livePrice;
        p.origSarPrice = liveReg;
        p.baseJod = newBaseJod;
        p.finalJod = newFinalJod;
        p.origJod = newOrigJod;
        p.isAvailable = liveAvail;
        p.status = liveStatus;
        p.promotionTitle = livePromo;

        syncedCatalog.push(p);
      }

      cachedAssafCatalog = syncedCatalog;
      lastAssafSyncTime = Date.now();

      if (changesDetected) {
        fs.writeFileSync(ASSAF_PERFUMES_PATH, JSON.stringify(syncedCatalog, null, 2), 'utf8');
      }
    } else if (!cachedAssafCatalog) {
      cachedAssafCatalog = JSON.parse(fs.readFileSync(ASSAF_PERFUMES_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Live Assaf sync warning (using local fallback):', err.message);
    if (!cachedAssafCatalog) {
      try {
        cachedAssafCatalog = JSON.parse(fs.readFileSync(ASSAF_PERFUMES_PATH, 'utf8'));
      } catch (e) {
        cachedAssafCatalog = [];
      }
    }
  } finally {
    isSyncingAssaf = false;
  }

  return cachedAssafCatalog;
}

// Live Catalog API Endpoint (supports ?house=ghalati and ?house=assaf)
app.get('/api/catalog', async (req, res) => {
  const force = req.query.force === '1';
  const house = (req.query.house || 'ghalati').toLowerCase();
  const data = house === 'assaf'
    ? await syncWithAssafStore(force)
    : await syncWithGhalatiStore(force);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.json(data);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    store: 'زهرة بيسان للعطور | Zahrat Beesan Parfums',
    version: '0.4.0-multi-house-live-sync',
    lastGhalatiSync: lastSyncTime ? new Date(lastSyncTime).toISOString() : null,
    totalGhalatiProducts: cachedCatalog ? cachedCatalog.length : null,
    lastAssafSync: lastAssafSyncTime ? new Date(lastAssafSyncTime).toISOString() : null,
    totalAssafProducts: cachedAssafCatalog ? cachedAssafCatalog.length : null
  });
});

// Background auto-sync every 2 minutes
setInterval(() => {
  syncWithGhalatiStore(true).catch(() => {});
  syncWithAssafStore(true).catch(() => {});
}, 2 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`✨ Zahrat Beesan Parfums running at: http://localhost:${PORT}`);
  syncWithGhalatiStore(true).then(list => {
    console.log(`🔄 Initial Live Ghalati Sync Complete: ${list.length} active products.`);
  });
  syncWithAssafStore(true).then(list => {
    console.log(`🔄 Initial Live Assaf Sync Complete: ${list.length} active products.`);
  });
});
