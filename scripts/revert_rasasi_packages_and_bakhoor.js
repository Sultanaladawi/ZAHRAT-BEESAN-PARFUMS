const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const PUBLIC_JSON = path.join(PUBLIC_DIR, 'data', 'rasasi_perfumes.json');
const ARCHIVE_JSON = path.join(__dirname, '..', 'data', 'rasasi_master_archive.json');

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
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function run() {
  const rasasi = JSON.parse(fs.readFileSync(PUBLIC_JSON, 'utf8'));
  const rasasiArchive = JSON.parse(fs.readFileSync(ARCHIVE_JSON, 'utf8'));

  const targets = rasasi.filter(p => {
    const t = (p.title || '') + ' ' + (p.specs?.type || '');
    return /هدية|هدايا|بوكس|طقم|بكج|باكج|بخور|معمول|مبثوث|دخون|فواحة|معطر للمنزل/i.test(t);
  });

  console.log(`Found ${targets.length} Rasasi bakhoor and package items to revert from podium...`);

  let successCount = 0;
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    const sId = p.id.replace('rasasi-', '');
    const outPath = path.join(IMAGES_DIR, `rasasi_${sId}.jpg`);
    const rawUrl = p.originalImage || p.bottleUrl;

    if (!rawUrl) {
      console.warn(`[!] No URL for ${p.id}: ${p.title}`);
      continue;
    }

    try {
      await downloadAndFrameStudio(rawUrl, outPath);
      successCount++;
      console.log(`[${i + 1}/${targets.length}] Restored clean store photo for: ${p.title}`);
    } catch (err) {
      console.error(`[!] Failed for ${p.id} (${p.title}): ${err.message}`);
    }
  }

  // Ensure categoryType for rasasi-507018865 is bakhoor
  [rasasi, rasasiArchive].forEach(list => {
    const it = list.find(x => x.id === 'rasasi-507018865');
    if (it) {
      it.categoryType = 'bakhoor';
      if (it.specs) it.specs.type = 'دخون وعود فاخر';
    }
  });

  fs.writeFileSync(PUBLIC_JSON, JSON.stringify(rasasi, null, 2), 'utf8');
  fs.writeFileSync(ARCHIVE_JSON, JSON.stringify(rasasiArchive, null, 2), 'utf8');

  console.log(`\nSuccessfully restored ${successCount} Rasasi bakhoor and package items to clean official store photos!`);
}

run().catch(console.error);
