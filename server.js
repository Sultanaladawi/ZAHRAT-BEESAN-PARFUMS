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

app.use(compression());
app.use(express.json());

// ── Live Direct Sync & Auto-Discovery Engine with Official Ghalati Store (Salla API) ──
let cachedCatalog = null;
let lastSyncTime = 0;
let isSyncing = false;
const SYNC_TTL_MS = 60 * 1000; // Refresh live data every 60 seconds

function getMasterCatalog() {
  try {
    if (fs.existsSync(ARCHIVE_PATH)) {
      return JSON.parse(fs.readFileSync(ARCHIVE_PATH, 'utf8'));
    }
    const current = JSON.parse(fs.readFileSync(PERFUMES_PATH, 'utf8'));
    const dataDir = path.dirname(ARCHIVE_PATH);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(ARCHIVE_PATH, JSON.stringify(current, null, 2), 'utf8');
    return current;
  } catch (err) {
    console.error('Error reading master catalog:', err.message);
    return [];
  }
}

const EXCLUDED_SALLA_IDS = new Set([
  '1180808215' // Duplicate old Liana
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
  // Mini sets (15ml / 30ml / discovery / Heritage Collection / Al-Tarikh) are treated as a single perfume (+12 JOD)
  if (/مجموعة التراث|باقة التاريخ|15\s*مل|15\s*ml|30\s*مل|30\s*ml|ميني|ديسكفري|عينات/i.test(text)) return 1;
  if (/عطرين|عطران|ثنائية|لك ولها|2\s*×|قطعتين/i.test(text)) return 2;
  if (/ثلاث|3\s*عطور|3\s*×|باقة|بكج|العرض/i.test(text)) return 3;
  return 1;
}

function getBottleCount(item) {
  if (item && Number(item.bottleCount) >= 1) return Number(item.bottleCount);
  return inferBottleCount(item?.title || '', item?.overview || '', item?.categoryType || 'perfume');
}

function getDeliveryFeeJod(item) {
  if (item && Number(item.feeJod) > 0) return Number(item.feeJod);
  const id = item?.id || '';
  const text = `${item?.title || ''} ${item?.overview || ''}`;
  if (id === 'package-air-fresheners' || /بكج معطرات|معطرات الجو/i.test(item?.title || '')) return 20;
  if (id === 'bundle-heritage-collection' || id === 'bundle-altarikh' || /مجموعة التراث|باقة التاريخ|15\s*مل|15\s*ml|30\s*مل|30\s*ml|ميني|ديسكفري/i.test(text)) return 12;
  const count = getBottleCount(item);
  if (count === 3) return 30;
  if (count === 2) return 24;
  return 12;
}

async function generateAutoProductImage(idSlug, rawImgUrl, categoryType) {
  const relImg = `images/ghalati_${idSlug}.jpg`;
  const absImg = path.join(__dirname, 'public', 'images', `ghalati_${idSlug}.jpg`);
  if (fs.existsSync(absImg)) return relImg;
  if (!sharp || !rawImgUrl) return rawImgUrl || 'images/ghalati_master_bg.jpg';

  try {
    const origUrl = rawImgUrl.replace(/\/[a-f0-9-]+-\d+x[\d.]+-/, '/');
    let res = await fetch(origUrl);
    if (!res.ok) res = await fetch(rawImgUrl);
    if (!res.ok) return rawImgUrl;
    const buf = Buffer.from(await res.arrayBuffer());

    if (categoryType === 'bundle') {
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

    if (fs.existsSync(MASTER_BG_PATH)) {
      const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r >= 240 && g >= 240 && b >= 240) data[i + 3] = 0;
      }
      const cleaned = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
      const trimmed = await sharp(cleaned).trim().toBuffer();
      const resized = await sharp(trimmed).resize({ height: 515, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
      const bW = resized.info.width, bH = resized.info.height;
      const left = Math.round((1024 - bW) / 2);
      const baseContactY = 746;
      const top = baseContactY - bH;
      await sharp(MASTER_BG_PATH)
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
    const masterList = getMasterCatalog().filter(p => {
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

    // 1. Discover any brand-new products from Ghalati's latest releases & homepage sliders
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
    } catch (e) {
      // Ignore discovery network hiccup
    }

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

    // If Salla API responded with data, sync prices, availability, auto-add new products, and filter out deleted products
    if (liveById.size > 0) {
      const syncedCatalog = [];
      let changesDetected = false;

      // Auto-build newly discovered products from Ghalati
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
        const genImage = await generateAutoProductImage(idSlug, rawImg, catType);

        const baseJod = Math.round(livePrice / 5.29);
        const finalJod = baseJod + feeJod;
        const origJod = liveReg > livePrice ? (Math.round(liveReg / 5.29) + feeJod) : finalJod;

        newBuiltItems.push({
          id: idSlug,
          sallaId: sid,
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

        // If product was deleted from Ghalati's store, exclude it from our store automatically
        if (!live) {
          changesDetected = true;
          continue;
        }

        const p = { ...item, sallaId };
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
    console.error('Live sync warning (using local fallback):', err.message);
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

// Live Catalog API Endpoint
app.get('/api/catalog', async (req, res) => {
  const force = req.query.force === '1';
  const data = await syncWithGhalatiStore(force);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.json(data);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    store: 'زهرة بيسان للعطور | Zahrat Beesan Parfums',
    version: '0.3.0-live-auto-discovery',
    lastSync: lastSyncTime ? new Date(lastSyncTime).toISOString() : null,
    totalActiveProducts: cachedCatalog ? cachedCatalog.length : null
  });
});

// Background auto-sync every 2 minutes
setInterval(() => {
  syncWithGhalatiStore(true).catch(() => {});
}, 2 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`✨ Zahrat Beesan Parfums running at: http://localhost:${PORT}`);
  syncWithGhalatiStore(true).then(list => {
    console.log(`🔄 Initial Live Ghalati Sync Complete: ${list.length} active products.`);
  });
});
