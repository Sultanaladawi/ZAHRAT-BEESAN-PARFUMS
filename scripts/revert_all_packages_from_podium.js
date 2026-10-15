const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

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

  // Contain cleanly in 1024x1024 on white canvas
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
  const assafPublicPath = path.join(PUBLIC_DIR, 'data', 'assaf_perfumes.json');
  const assafArchivePath = path.join(__dirname, '..', 'data', 'assaf_master_archive.json');
  const ghalatiPath = path.join(PUBLIC_DIR, 'data', 'perfumes.json');
  const lavPath = path.join(PUBLIC_DIR, 'data', 'laverne_perfumes.json');

  const assaf = JSON.parse(fs.readFileSync(assafPublicPath, 'utf8'));
  const assafArchive = JSON.parse(fs.readFileSync(assafArchivePath, 'utf8'));
  const ghalati = JSON.parse(fs.readFileSync(ghalatiPath, 'utf8'));
  const lav = JSON.parse(fs.readFileSync(lavPath, 'utf8'));

  // 1. Assaf 35 remaining bundles
  const assafBundleIds = [
    'assaf-79328031', 'assaf-88128890', 'assaf-814804017', 'assaf-1036243994', 'assaf-1755285826',
    'assaf-780287822', 'assaf-757538292', 'assaf-1492041621', 'assaf-1036673145', 'assaf-2089452030',
    'assaf-1850175256', 'assaf-57443660', 'assaf-1616970094', 'assaf-2056378606', 'assaf-683924030',
    'assaf-1340478300', 'assaf-1887833995', 'assaf-1839061432', 'assaf-1303524915', 'assaf-282780349',
    'assaf-1704407016', 'assaf-769549373', 'assaf-597611948', 'assaf-432203624', 'assaf-1236351736',
    'assaf-949019436', 'assaf-2053607813', 'assaf-227203442', 'assaf-1223143880', 'assaf-2023066823',
    'assaf-2144624115', 'assaf-631445629', 'assaf-1082263421', 'assaf-2103188368', 'assaf-297697690'
  ];

  console.log(`=== Reverting ${assafBundleIds.length} Assaf packages off podium ===`);
  for (const id of assafBundleIds) {
    const p = assaf.find(x => x.id === id);
    if (!p) continue;
    const url = p.originalImage || p.bottleUrl;
    const sId = id.replace('assaf-', '');
    const outPath = path.join(IMAGES_DIR, `assaf_${sId}.jpg`);
    try {
      await downloadAndFrameStudio(url, outPath);
      console.log(`  [OK] Assaf bundle restored: ${p.title}`);
    } catch (e) {
      console.error(`  [!] Error on ${p.title}: ${e.message}`);
    }
  }

  // 2. Ghalati 5 bundles
  const ghalatiBundleIds = [
    'bundle-exceptional-offer', 'bundle-last-hours', 'bundle-fantasy-offer',
    'bundle-summer-pkg', 'bundle-varna-trio'
  ];

  console.log(`\n=== Reverting ${ghalatiBundleIds.length} Ghalati packages off podium ===`);
  for (const id of ghalatiBundleIds) {
    const p = ghalati.find(x => x.id === id);
    if (!p) continue;
    const url = p.bottleUrl || p.originalImage;
    const outPath = path.join(IMAGES_DIR, `ghalati_${id}.jpg`);
    try {
      await downloadAndFrameStudio(url, outPath);
      console.log(`  [OK] Ghalati bundle restored: ${p.title}`);
    } catch (e) {
      console.error(`  [!] Error on ${p.title}: ${e.message}`);
    }
  }

  // 3. Laverne 1 bundle
  const lavBundleIds = ['laverne-xvrmPDz'];
  console.log(`\n=== Reverting Laverne French Bakhoor package off podium ===`);
  for (const id of lavBundleIds) {
    const p = lav.find(x => x.id === id);
    if (!p) continue;
    const url = p.originalImage || p.bottleUrl;
    const sId = id.replace('laverne-', '');
    const outPath = path.join(IMAGES_DIR, `laverne_${sId}.jpg`);
    try {
      await downloadAndFrameStudio(url, outPath);
      console.log(`  [OK] Laverne bundle restored: ${p.title}`);
    } catch (e) {
      console.error(`  [!] Error on ${p.title}: ${e.message}`);
    }
  }

  // 4. Update Assaf categorization for fresheners, diffusers, bakhoor, powders
  const bakhoorAssafIds = new Set([
    'assaf-1793235026', // معطر المفارش هوم 500 مل
    'assaf-1975090272', // فواحة منزلية
    'assaf-1014260708', // عود بخور اروقيت
    'assaf-1822349968', // بخور وايلد كولت
    'assaf-1844930091'  // بخور بيقاسوس
  ]);

  const powderAssafIds = new Set([
    'assaf-1923830727', // ليدي باودر
    'assaf-928196953',  // قاردن باودر اويسيس
    'assaf-1247600206', // فلور باودر بلوم
    'assaf-452992045',  // بيوتي باودر روز
    'assaf-632263589',  // بيوتي باودر بليس
    'assaf-1586713770', // مجموعة بودرة عساف
    'assaf-1142435325'  // مجموعة كريم اليد ليدي
  ]);

  [assaf, assafArchive].forEach(list => {
    list.forEach(p => {
      if (bakhoorAssafIds.has(p.id)) {
        p.categoryType = 'bakhoor';
        if (p.specs) {
          p.specs.type = p.title.includes('معطر') ? 'معطر مفارش وأجواء' : (p.title.includes('فواحة') ? 'فواحة منزلية فاخرة' : 'بخور وعود فاخر');
        }
      }
      if (powderAssafIds.has(p.id)) {
        p.categoryType = 'bundle';
        if (p.specs) {
          p.specs.type = p.title.includes('كريم') ? 'عناية وترطيب' : 'بودرة معطرة للجسم';
        }
      }
    });
  });

  fs.writeFileSync(assafPublicPath, JSON.stringify(assaf, null, 2), 'utf8');
  fs.writeFileSync(assafArchivePath, JSON.stringify(assafArchive, null, 2), 'utf8');

  console.log('\nAll packages successfully removed from podiums into clean store studio photos!');
  console.log('Assaf home freshener, diffuser, and bakhoor items properly moved to bakhoor category!');
}

run().catch(console.error);
