#!/usr/bin/env node
/**
 * 👑 قصر زهرة بيسان للعطور الملكية — Zahrat Beesan Parfums
 * أداة سحب وأرشفة وتفريغ خلفيات عطور الكتالوج بصيغة PNG شفافة فائقة السرعة
 * High-Speed Node.js Perfumes PNG Catalog Archiver & Background Processor
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120);
}

async function removeBackground(buffer) {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(info.width * info.height * 4);
  const channels = info.channels;

  for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    output[j] = r;
    output[j+1] = g;
    output[j+2] = b;

    // Check if background is pure white or very light neutral
    const isLight = (r > 238 && g > 238 && b > 238 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12);
    if (isLight) {
      const diff = Math.min(r - 238, g - 238, b - 238);
      const alpha = Math.max(0, 255 - diff * 15);
      output[j+3] = alpha > 240 ? 0 : 255 - alpha;
    } else {
      output[j+3] = channels === 4 ? data[i+3] : 255;
    }
  }

  return sharp(output, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toBuffer();
}

async function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function processLocalFolder(folderPath, outputFolder) {
  if (!fs.existsSync(folderPath)) {
    console.log(`❌ المجلد المحلي غير موجود: ${folderPath}`);
    return;
  }
  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

  const files = fs.readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  console.log(`\n📂 بدء معالجة المجلد المحلي: ${folderPath} (${files.length} صورة)`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const srcPath = path.join(folderPath, file);
    const targetName = sanitizeFilename(path.parse(file).name) + '.png';
    const targetPath = path.join(outputFolder, targetName);

    console.log(`  [${i+1}/${files.length}] جاري معالجة: ${file}...`);
    try {
      const buf = fs.readFileSync(srcPath);
      const transparentBuf = await removeBackground(buf);
      fs.writeFileSync(targetPath, transparentBuf);
    } catch (e) {
      console.log(`  ❌ خطأ في معالجة ${file}: ${e.message}`);
    }
  }
  console.log(`\n✅ اكتملت معالجة المجلد المحلي في: ${outputFolder}\n`);
}

async function processCatalog(outputFolder, maxPerBrand = 50) {
  const baseDir = path.join(__dirname, '..');
  const dataDir = path.join(baseDir, 'public', 'data');

  const brandConfigs = [
    { id: 'laverne', nameAr: 'دار لافيرن', file: path.join(dataDir, 'laverne_perfumes.json') },
    { id: 'assaf', nameAr: 'عطور عساف', file: path.join(dataDir, 'assaf_perfumes.json') },
    { id: 'ghalati', nameAr: 'دار غلاتي', file: path.join(dataDir, 'perfumes.json') },
    { id: 'thunayan', nameAr: 'عطور ثنيان', file: path.join(dataDir, 'thnyan_perfumes.json') },
    { id: 'rasasi', nameAr: 'شركة الرصاصي', file: path.join(baseDir, 'data', 'rasasi_master_archive.json') },
    { id: 'al-rehab', nameAr: 'شركة الرحاب', file: path.join(baseDir, 'data', 'alrehab_master_archive.json') },
    { id: 'labonair', nameAr: 'لو بانهور', file: path.join(dataDir, 'lebonheur_perfumes.json') },
  ];

  console.log(`\n👑 زهرة بيسان — بدء أرشفة وتفريغ كتالوج العطور...`);
  console.log(`📁 مجلد الإخراج: ${outputFolder}`);
  console.log(`🎯 الحد الأقصى لكل دار: ${maxPerBrand <= 0 ? 'كافة المنتجات' : maxPerBrand}\n`);

  for (const b of brandConfigs) {
    if (!fs.existsSync(b.file)) {
      console.log(`⚠️ ملف البيانات لـ ${b.nameAr} غير موجود.`);
      continue;
    }

    const items = JSON.parse(fs.readFileSync(b.file, 'utf8'));
    const brandFolder = path.join(outputFolder, sanitizeFilename(b.nameAr));
    if (!fs.existsSync(brandFolder)) fs.mkdirSync(brandFolder, { recursive: true });

    const limit = maxPerBrand <= 0 ? items.length : Math.min(maxPerBrand, items.length);
    console.log(`\n🏛️ دار: ${b.nameAr} | إجمالي المنتجات: ${items.length} | سيتم معالجة: ${limit}`);

    for (let i = 0; i < limit; i++) {
      const item = items[i];
      const title = item.title || item.name || item.nameAr || `perfume_${i+1}`;
      const safeTitle = sanitizeFilename(title);
      const targetPath = path.join(brandFolder, `${safeTitle}.png`);

      if (fs.existsSync(targetPath)) {
        console.log(`  [${i+1}/${limit}] موجود مسبقاً: ${safeTitle}`);
        continue;
      }

      const imgUrl = item.bottleUrl || item.image || item.originalImage;
      if (!imgUrl) continue;

      try {
        let buf;
        if (imgUrl.startsWith('images/') || imgUrl.startsWith('/images/')) {
          const localPath = path.join(baseDir, 'public', imgUrl.replace(/^\//, ''));
          if (fs.existsSync(localPath)) {
            buf = fs.readFileSync(localPath);
          }
        } else if (imgUrl.startsWith('http')) {
          buf = await downloadBuffer(imgUrl);
        }

        if (buf) {
          const transparentBuf = await removeBackground(buf);
          fs.writeFileSync(targetPath, transparentBuf);
          console.log(`  [${i+1}/${limit}] ✅ تم تفريغ وحفظ: ${safeTitle}`);
        }
      } catch (e) {
        console.log(`  [${i+1}/${limit}] ❌ تعذر معالجة ${title}: ${e.message}`);
      }
    }
  }

  console.log(`\n🎉 تم الانتهاء بنجاح من أرشفة الكتالوج في: ${outputFolder}\n`);
}

// CLI args parsing
const args = process.argv.slice(2);
let output = path.join(process.cwd(), 'Perfumes_PNG_Catalog');
let maxPerBrand = 50;
let localFolder = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i+1]) output = args[++i];
  if (args[i] === '--max-per-brand' && args[i+1]) maxPerBrand = parseInt(args[++i], 10);
  if (args[i] === '--local-folder' && args[i+1]) localFolder = args[++i];
}

if (localFolder) {
  processLocalFolder(localFolder, output).catch(console.error);
} else {
  processCatalog(output, maxPerBrand).catch(console.error);
}
