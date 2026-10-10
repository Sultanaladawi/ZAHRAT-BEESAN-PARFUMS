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

function detectCategoryType(name = '', desc = '') {
  const text = `${name} ${desc}`;
  if (/باقة|مجموعة|بكج|صندوق|عرض|ثلاثية|ثنائية|تشكيلة/i.test(name)) return 'bundle';
  if (/تولة|زيت عطري|مسك.*15\s*مل/i.test(text)) return 'oil';
  if (/بخور|معمول|معطر جو|دخون|مبثوث|لبان/i.test(name)) return 'bakhoor';
  return 'perfume';
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
    const masterList = getMasterCatalog();
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
          if (!knownIds.has(sid) && sid !== '1180808215') {
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
        const idSlug = `ghalati-${sid}`;
        const livePrice = Number(typeof live.price === 'object' ? live.price?.amount : live.price) || 95;
        const liveRegRaw = Number(typeof live.regular_price === 'object' ? live.regular_price?.amount : live.regular_price) || livePrice;
        const liveReg = Math.round(liveRegRaw);
        const liveAvail = live.is_available !== false && live.status !== 'out' && !live.is_out_of_stock;
        const liveStatus = live.status || (liveAvail ? 'sale' : 'out');
        const cleanDesc = (live.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const catType = detectCategoryType(live.name, cleanDesc);
        const rawImg = live.image?.url || '';
        const origImgUrl = rawImg.replace(/\/[a-f0-9-]+-\d+x[\d.]+-/, '/');
        const genImage = await generateAutoProductImage(idSlug, rawImg, catType);

        const baseJod = Math.round(livePrice / 5.29);
        const finalJod = baseJod + 12;
        const origJod = liveReg > livePrice ? (Math.round(liveReg / 5.29) + 12) : finalJod;

        newBuiltItems.push({
          id: idSlug,
          sallaId: sid,
          title: live.name,
          titleEn: live.name,
          brand: 'Ghalati',
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
          specs: catType === 'bundle' ? 'مجموعة فاخرة • Eau de Parfum' : 'Eau de Parfum • 100ml',
          specsEn: catType === 'bundle' ? 'Luxury Bundle • Eau de Parfum' : 'Eau de Parfum • 100ml',
          categoryType: catType
        });
        changesDetected = true;
      }

      const combinedMaster = [...newBuiltItems, ...masterList];

      for (const item of combinedMaster) {
        const sallaId = String(item.sallaId || ((item.url || '').match(/\/p(\d+)/) || [])[1] || '');
        const live = liveById.get(sallaId);

        // If product was deleted from Ghalati's store, exclude it from our store automatically
        if (!live) {
          changesDetected = true;
          continue;
        }

        const p = { ...item, sallaId };
        const livePrice = Number(typeof live.price === 'object' ? live.price?.amount : live.price) || p.sarPrice;
        const liveRegRaw = Number(typeof live.regular_price === 'object' ? live.regular_price?.amount : live.regular_price) || livePrice;
        const liveReg = Math.round(liveRegRaw);
        const liveAvail = live.is_available !== false && live.status !== 'out' && !live.is_out_of_stock;
        const liveStatus = live.status || (liveAvail ? 'sale' : 'out');
        const livePromo = live.promotion_title || '';

        if (
          p.sarPrice !== livePrice ||
          p.origSarPrice !== liveReg ||
          p.isAvailable !== liveAvail ||
          p.status !== liveStatus ||
          p.promotionTitle !== livePromo
        ) {
          changesDetected = true;
        }

        p.sarPrice = livePrice;
        p.origSarPrice = liveReg;
        p.baseJod = Math.round(livePrice / 5.29);
        p.finalJod = p.baseJod + 12;
        p.origJod = liveReg > livePrice ? (Math.round(liveReg / 5.29) + 12) : p.finalJod;
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
