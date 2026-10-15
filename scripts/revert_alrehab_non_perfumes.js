const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const PUBLIC_JSON = path.join(PUBLIC_DIR, 'data', 'alrehab_perfumes.json');

async function downloadAndFrameStudio(url, outPath) {
  let buf;
  if (url.startsWith('http')) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    buf = Buffer.from(await res.arrayBuffer());
  } else {
    const local = path.join(PUBLIC_DIR, url.replace(/^\//, ''));
    if (!fs.existsSync(local)) throw new Error(`Local file not found: ${local}`);
    buf = fs.readFileSync(local);
  }

  // Clean studio framing in 1024x1024 on white canvas (off the podium)
  await sharp(buf)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function run() {
  const rehab = JSON.parse(fs.readFileSync(PUBLIC_JSON, 'utf8'));

  // Target all non-full-perfumes (bakhoor, maamoul, oils, dehn, minis, bundles, airfresheners, roomsprays)
  const targets = rehab.filter(p => p.subCategory !== 'perfume');

  console.log(`=== Reverting ${targets.length} Al-Rehab non-full-perfume items from podium to clean official store photos ===`);

  const concurrency = 12;
  let cursor = 0;
  let successCount = 0;
  let failCount = 0;

  async function worker(workerId) {
    while (cursor < targets.length) {
      const idx = cursor++;
      const p = targets[idx];
      const sId = String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || p.id.replace('alrehab-', ''));
      const outPath = path.join(IMAGES_DIR, `alrehab_${sId}.jpg`);
      const url = p.originalImage || p.bottleUrl;

      if (!url) {
        console.warn(`[Worker ${workerId}] No URL for ${p.id} (${p.title})`);
        failCount++;
        continue;
      }

      try {
        await downloadAndFrameStudio(url, outPath);
        successCount++;
        if (successCount % 25 === 0 || successCount === targets.length) {
          console.log(`[Progress] ${successCount}/${targets.length} items restored off podium...`);
        }
      } catch (err) {
        console.error(`[Worker ${workerId}] Error on ${p.title} (${url}): ${err.message}`);
        failCount++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log(`\n========================================`);
  console.log(`Completed Al-Rehab image reversion!`);
  console.log(`Successfully restored: ${successCount} items.`);
  console.log(`Failed: ${failCount} items.`);
  console.log(`========================================`);
}

run().catch(console.error);
