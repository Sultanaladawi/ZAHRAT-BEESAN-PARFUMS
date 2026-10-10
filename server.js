const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5005;

const PERFUMES_PATH = path.join(__dirname, 'public', 'data', 'perfumes.json');
const ARCHIVE_PATH = path.join(__dirname, 'data', 'perfumes_master_archive.json');

app.use(compression());
app.use(express.json());

// ── Live Direct Sync Engine with Official Ghalati Store (Salla API) ──
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

    const allIds = masterList
      .map(p => p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1])
      .filter(Boolean);

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

    // If Salla API responded with data, sync prices, availability, and filter out deleted products
    if (liveById.size > 0) {
      const syncedCatalog = [];
      let changesDetected = false;

      for (const item of masterList) {
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
    version: '0.2.0-live-sync',
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
