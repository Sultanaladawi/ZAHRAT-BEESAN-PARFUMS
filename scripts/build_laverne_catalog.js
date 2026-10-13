const https = require('https');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const { refineCutout } = require('./lib/refine_cutout');

const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'laverne_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'laverne_perfumes.json');
const ARCHIVE_DATA_PATH = path.join(__dirname, '..', 'data', 'laverne_master_archive.json');
const RAW_CACHE_DIR = path.join(__dirname, 'raw_laverne');

if (!fs.existsSync(RAW_CACHE_DIR)) fs.mkdirSync(RAW_CACHE_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(PUBLIC_DATA_PATH))) fs.mkdirSync(path.dirname(PUBLIC_DATA_PATH), { recursive: true });
if (!fs.existsSync(path.dirname(ARCHIVE_DATA_PATH))) fs.mkdirSync(path.dirname(ARCHIVE_DATA_PATH), { recursive: true });

function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 12000
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc === '/' || loc === '/ar' || loc === '/ar/' || loc.endsWith('laverne.com/ar') || loc.endsWith('laverne.com/ar/')) {
          return resolve({ status: res.statusCode, redirectedHome: true, url });
        }
        if (!loc.startsWith('http')) loc = 'https://laverne.com' + loc;
        return fetchUrl(loc).then(resolve);
      }
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => resolve({ status: res.statusCode, html, url }));
    });
    req.on('error', () => resolve({ status: 500, error: true, url }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 408, timeout: true, url });
    });
  });
}

function cleanHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseLaverneProduct(html, url) {
  let product = null;
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim());
      if (data['@graph']) {
        const p = data['@graph'].find(x => x['@type'] === 'Product');
        if (p) product = p;
      } else if (data['@type'] === 'Product') {
        product = data;
      }
    } catch (e) {}
  }

  if (!product) return null;

  const title = (product.name || '').trim();
  if (!title) return null;

  const tLower = title.toLowerCase();

  // Exclude non-perfume makeup, eyeliner, pencils, empty refills, bags
  const isAccessory = tLower.includes('قلم') || 
                      tLower.includes('كحل') || 
                      tLower.includes('مسكرا') || 
                      tLower.includes('حواجب') || 
                      tLower.includes('حقيبة') || 
                      tLower.includes('شنطة') || 
                      tLower.includes('كيس') || 
                      tLower.includes('إعادة التعبئة') || 
                      tLower.includes('ليب قلوس') || 
                      tLower.includes('ملمع');
  if (isAccessory) return null;

  const sku = product.sku || '';
  const slugMatch = url.match(/\/([a-zA-Z0-9]+)$/);
  const slug = slugMatch ? slugMatch[1] : sku || Math.random().toString(36).substring(7);

  // Size detection
  let size = '100 مل';
  const sizeMatch = title.match(/(\d+)\s*(?:مل|ml)/i) || html.match(/(\d+)\s*(?:مل|ml)/i);
  if (sizeMatch) {
    size = `${sizeMatch[1]} مل`;
  }

  // Price extraction
  const sarPrice = parseFloat(product.offers?.price) || 120;
  let origSarPrice = sarPrice;
  const origPriceMatch = html.match(/class=["'][^"']*regular-price[^"']*["'][^>]*>\s*([\d.]+)/i) ||
                         html.match(/<del[^>]*>\s*([\d.]+)\s*(?:ر\.س|SAR)?\s*<\/del>/i);
  if (origPriceMatch) {
    origSarPrice = parseFloat(origPriceMatch[1]) || sarPrice;
  }
  if (origSarPrice <= sarPrice) {
    origSarPrice = Math.round(sarPrice * 1.35);
  }

  const isAvailable = product.offers?.availability?.includes('InStock') || false;

  // Images
  const cdnImages = [...html.matchAll(/https:\/\/cdn\.salla\.sa\/XzOPD\/[a-zA-Z0-9_.-]+\.(?:jpg|png|webp)/gi)]
    .map(m => m[0])
    .filter(u => !u.includes('logo') && !u.includes('favicon') && !u.includes('QY3OnoPikwgHNPynvJjVxXNJJ0q1Tn7m4FbDnMgq'));
  const uniqueImages = [...new Set(cdnImages)];

  let primaryImage = product.image;
  const highResImg = uniqueImages.find(u => u.includes('1000') || u.includes('original'));
  if (highResImg) {
    primaryImage = highResImg;
  } else if (uniqueImages.length > 0) {
    primaryImage = uniqueImages[0];
  }
  const galleryImages = uniqueImages.filter(u => u !== primaryImage).slice(0, 5);

  // Olfactory Notes
  let opening = '';
  let heart = '';
  let base = '';
  const cleanBody = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

  const topM = cleanBody.match(/الافتتاحية:?\s*<\/strong><\/p>\s*<p[^>]*><span[^>]*>([^<]+)<\/span>/i) ||
               cleanBody.match(/الافتتاحية:?\s*(?:<\/strong>)?\s*<span[^>]*>([^<]+)<\/span>/i) ||
               cleanBody.match(/الافتتاحية:?\s*([^\n<]+)/i);
  if (topM) opening = cleanHtml(topM[1]);

  const heartM = cleanBody.match(/القلب:?\s*<\/strong><\/p>\s*<p[^>]*><span[^>]*>([^<]+)<\/span>/i) ||
                 cleanBody.match(/القلب:?\s*(?:<\/strong>)?\s*<span[^>]*>([^<]+)<\/span>/i) ||
                 cleanBody.match(/القلب:?\s*([^\n<]+)/i);
  if (heartM) heart = cleanHtml(heartM[1]);

  const baseM = cleanBody.match(/القاعدة:?\s*<\/strong><\/p>\s*<p[^>]*><span[^>]*>([^<]+)<\/span>/i) ||
                cleanBody.match(/القاعدة:?\s*(?:<\/strong>)?\s*<span[^>]*>([^<]+)<\/span>/i) ||
                cleanBody.match(/القاعدة:?\s*([^\n<]+)/i);
  if (baseM) base = cleanHtml(baseM[1]);

  let prominent = '';
  if (opening && heart && base) {
    const oFirst = opening.split(/[،,]/)[0]?.trim();
    const hFirst = heart.split(/[،,]/)[0]?.trim();
    const bFirst = base.split(/[،,]/)[0]?.trim();
    prominent = [oFirst, hFirst, bFirst].filter(Boolean).join('، ');
  }

  // Classification (Strictly NO bakhoor category: Laverne only has luxury perfumes & sets)
  let categoryType = 'perfume';
  let categoryGender = 'للجنسين';
  const descRaw = cleanBody;
  const numSize = parseInt(size);

  if (tLower.includes('مجموعة') || tLower.includes('بكج') || tLower.includes('بوكس') || tLower.includes('طقم') || tLower.includes('مجموعات') || tLower.includes('كولكشن') || tLower.includes('توزيعات') || tLower.includes('collection') || tLower.includes(' و')) {
    categoryType = 'bundle';
  } else if (tLower.includes('شعر') || tLower.includes('هير مست') || tLower.includes('hair mist')) {
    categoryType = 'hair_mist';
  } else if (tLower.includes('ميني') || (numSize && numSize <= 30)) {
    categoryType = 'mini';
  } else {
    categoryType = 'perfume';
  }

  if (tLower.includes('رجالي') || descRaw.includes('عطر رجالي') || descRaw.includes('للرجال')) {
    categoryGender = 'رجالي';
  } else if (tLower.includes('نسائي') || descRaw.includes('عطر نسائي') || descRaw.includes('للنساء')) {
    categoryGender = 'نسائي';
  }

  // Pricing (JOD)
  const baseJod = Math.round(sarPrice / 5.29);
  const feeJod = categoryType === 'bundle' ? 18 : 12;
  const finalJod = baseJod + feeJod;
  const origJod = Math.round(origSarPrice / 5.29) + feeJod;

  let overview = cleanHtml(product.description || '');
  if (!overview || overview.length < 20) {
    const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    overview = metaDesc ? cleanHtml(metaDesc[1]) : `عطر ${title} الفاخر الأصلي 100% من دار لافيرن للعطور الرسمية.`;
  }

  return {
    id: `laverne-${slug}`,
    sallaId: slug,
    house: 'laverne',
    title,
    titleEn: title,
    brand: 'عطور لافيرن (Laverne)',
    bottleCount: categoryType === 'bundle' ? 2 : 1,
    feeJod,
    sarPrice,
    origSarPrice,
    baseJod,
    finalJod,
    origJod,
    isAvailable,
    status: origSarPrice > sarPrice ? 'sale' : 'normal',
    promotionTitle: 'دار لافيرن الرسمية',
    url,
    bottleUrl: primaryImage,
    image: `images/laverne_${slug}.jpg`,
    originalImage: primaryImage,
    galleryImages,
    overview,
    overviewEn: overview,
    opening: opening || 'مكونات عليا نقية ومنعشة من أرقى مستخلصات لافيرن',
    openingEn: 'Top notes of fresh luxury essences by Laverne',
    heart: heart || 'قلب عطري متناغم وفاخر بنفحات آسرة وفواحة',
    heartEn: 'Rich aromatic heart notes',
    base: base || 'قاعدة دافئة وفاخرة ذات ثبات عالي وأناقة مميزة',
    baseEn: 'Warm long-lasting base of amber, musk and precious woods',
    prominent: prominent || title,
    prominentEn: title,
    specs: {
      origin: 'المملكة العربية السعودية',
      category: categoryGender,
      size,
      type: categoryType === 'hair_mist' ? 'معطر شعر فاخر' :
            categoryType === 'bundle' ? 'مجموعة عطور ملكية فاخرة' :
            categoryType === 'mini' ? 'عطر ميني فاخر' : 'عطر أو دو بارفيوم (Eau de Parfum)',
      perfumer: 'دار لافيرن للعطور (Laverne Perfumes)'
    },
    specsEn: {
      origin: 'Kingdom of Saudi Arabia',
      category: categoryGender === 'رجالي' ? 'Men' : categoryGender === 'نسائي' ? 'Women' : 'Unisex',
      size,
      type: 'Eau de Parfum',
      perfumer: 'House of Laverne'
    },
    categoryType
  };
}

async function renderProductImage(rawBuf, slug, isBundle = false) {
  const outPath = path.join(PUBLIC_IMAGES_DIR, `laverne_${slug}.jpg`);

  // Studio framing for bundles, gift sets, and boxed collections
  if (isBundle) {
    const inner = await sharp(rawBuf)
      .resize({ width: 920, height: 920, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 248, g: 246, b: 240, alpha: 1 }
      }
    })
      .composite([{ input: inner, gravity: 'center' }])
      .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
      .toFile(outPath);
    return;
  }

  // Single bottle: AI background removal + Symmetry shadow slicer + reflection base cutoff + refineCutout
  try {
    const normPng = await sharp(rawBuf)
      .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    const blob = new Blob([normPng], { type: 'image/png' });
    const cutBlob = await removeBackground(blob);
    const cutBuf = Buffer.from(await cutBlob.arrayBuffer());

    const { data, info } = await sharp(cutBuf).raw().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height;

    // 1. Measure solid widths per row
    let maxW = 0;
    const rowW = new Int32Array(h);
    for (let y = 0; y < h; y++) {
      let minX = w, maxX = -1;
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] >= 160) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
      if (maxX >= minX) {
        rowW[y] = maxX - minX;
        if (rowW[y] > maxW) maxW = rowW[y];
      }
    }

    // 2. Measure cap center in top 2%..8%
    let minY = 0, maxY = h - 1;
    while (minY < h && rowW[minY] === 0) minY++;
    while (maxY > 0 && rowW[maxY] === 0) maxY--;
    const objH = maxY - minY;

    let sumCapCenter = 0, capRows = 0;
    const cStart = minY + Math.max(3, Math.round(objH * 0.02));
    const cEnd = minY + Math.max(10, Math.round(objH * 0.08));
    for (let y = cStart; y <= cEnd; y++) {
      let rowL = w, rowR = 0;
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] >= 180) {
          if (x < rowL) rowL = x;
          if (x > rowR) rowR = x;
        }
      }
      if (rowR > rowL + 10) {
        sumCapCenter += (rowL + rowR) / 2;
        capRows++;
      }
    }
    const capCenterX = capRows > 0 ? Math.round(sumCapCenter / capRows) : Math.round(w / 2);

    // 3. Find true base: scan up from maxY until row width is at least 70% of body width
    let baseCutoffY = maxY;
    for (let y = maxY; y >= minY + Math.round(objH * 0.6); y--) {
      if (rowW[y] < maxW * 0.70) {
        baseCutoffY = y - 1;
      } else {
        break;
      }
    }

    // 4. Enforce Right-to-Left symmetry across all rows (erases left wall shadows & floor reflection)
    for (let y = 0; y < h; y++) {
      if (y > baseCutoffY) {
        for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = 0;
        continue;
      }
      let rX = -1;
      for (let x = w - 1; x >= capCenterX; x--) {
        if (data[(y * w + x) * 4 + 3] >= 160) {
          rX = x;
          break;
        }
      }
      if (rX <= capCenterX) {
        for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = 0;
        continue;
      }
      const halfW = rX - capCenterX;
      const symLeftX = capCenterX - halfW - 1;
      for (let x = 0; x < symLeftX; x++) {
        data[(y * w + x) * 4 + 3] = 0;
      }
    }

    // 5. Run refineCutout for defringing and smooth feather
    const cleaned0 = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    const refined = await refineCutout(cleaned0, { erode: 1, feather: 0.8 });
    const trimmed = await sharp(refined).trim().toBuffer({ resolveWithObject: true });

    // 6. Scale bottle to prominent majestic size: height 520px
    const targetH = 520;
    const bH = targetH;
    const bW = Math.round(trimmed.info.width * targetH / trimmed.info.height);
    const resized = await sharp(trimmed.data)
      .resize(bW, bH, { kernel: 'lanczos3' })
      .toBuffer();

    const left = Math.round((1024 - bW) / 2);
    const baseContactY = 746;
    const top = baseContactY - bH;

    // Realistic multi-tier contact shadow
    const shadowW = bW + 40;
    const shadowSvg = `
    <svg width="${shadowW}" height="28" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2" /></filter>
        <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <ellipse cx="${shadowW / 2}" cy="14" rx="${bW * 0.43}" ry="7.5" fill="#1b1209" opacity="0.65" filter="url(#f1)" />
      <ellipse cx="${shadowW / 2}" cy="14" rx="${bW * 0.28}" ry="4" fill="#080503" opacity="0.9" filter="url(#f2)" />
    </svg>
    `;
    const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

    await sharp(MASTER_BG_PATH)
      .composite([
        { input: shadowBuf, left: Math.round(left - 20), top: baseContactY - 13 },
        { input: resized, left, top }
      ])
      .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
      .toFile(outPath);
  } catch (err) {
    console.warn(`Fallback for ${slug}:`, err.message);
    const inner = await sharp(rawBuf)
      .resize({ width: 920, height: 920, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 248, g: 246, b: 240, alpha: 1 }
      }
    })
      .composite([{ input: inner, gravity: 'center' }])
      .jpeg({ quality: 96 })
      .toFile(outPath);
  }
}

const FLAGSHIP_PRIORITY = [
  'بلو لافيرن سبورت',
  'بلو لافيرن بخور',
  'بلو لافيرن إلكسير',
  'بلو لافيرن',
  'توباكو',
  'مس لافيرن',
  'مس لافيرن بلوم',
  'مس لافيرن روز',
  'آي واز هير',
  'فانتوم',
  'فوربدن',
  'لومير',
  'ليدي روز',
  'بيانكونيرو',
  'ليسن',
  'دير',
  'لادور بخور',
  'الليل الأزرق',
  'عنبر رويال',
  'سكار فيس',
  'ذا لاست دانس',
  'لاست تشانس',
  'فيرليس',
  'سمر نايتس',
  'إن لوف',
  'إنتو ذا سي',
  'سوار',
  'روز قاردن',
  'مسك قاردن',
  'اللور قاردن',
  'فايوليت قاردن',
  'تشامبيون',
  'سينس'
];

function getProductScore(p) {
  const t = p.title;
  for (let i = 0; i < FLAGSHIP_PRIORITY.length; i++) {
    if (t.startsWith(FLAGSHIP_PRIORITY[i]) || t.includes(FLAGSHIP_PRIORITY[i])) {
      return i;
    }
  }
  if (p.categoryType === 'perfume') return 1000;
  if (p.categoryType === 'bundle') return 2000;
  if (p.categoryType === 'hair_mist') return 3000;
  if (p.categoryType === 'mini') return 4000;
  return 5000;
}

async function buildCatalog() {
  const activeUrls = JSON.parse(fs.readFileSync('data/laverne_active_urls.json', 'utf8'));
  console.log(`Starting crawl of ${activeUrls.length} Laverne products...`);

  const products = [];
  const BATCH_SIZE = 12;

  for (let i = 0; i < activeUrls.length; i += BATCH_SIZE) {
    const chunk = activeUrls.slice(i, i + BATCH_SIZE);
    const chunkResults = await Promise.all(chunk.map(fetchUrl));

    for (const res of chunkResults) {
      if (res.html && !res.redirectedHome) {
        const prod = parseLaverneProduct(res.html, res.url);
        if (prod) {
          products.push(prod);
        }
      }
    }
    process.stdout.write(`Parsed ${Math.min(i + BATCH_SIZE, activeUrls.length)}/${activeUrls.length} products | Valid: ${products.length}\r`);
  }

  console.log(`\nCrawl complete! Successfully parsed ${products.length} official Laverne perfumes & sets.`);

  // Sort logically with flagships first
  products.sort((a, b) => getProductScore(a) - getProductScore(b));

  // Save Raw Archive & Catalog Data
  fs.writeFileSync(ARCHIVE_DATA_PATH, JSON.stringify(products, null, 2));
  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(products, null, 2));
  console.log(`Saved sorted catalog to ${PUBLIC_DATA_PATH} & archive to ${ARCHIVE_DATA_PATH}`);

  // Now process product images
  console.log(`\nProcessing product images for ${products.length} products...`);
  let renderedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const slug = prod.sallaId;
    const isBundle = prod.categoryType === 'bundle';
    const outPath = path.join(PUBLIC_IMAGES_DIR, `laverne_${slug}.jpg`);

    if (!prod.bottleUrl) continue;

    const cachePath = path.join(RAW_CACHE_DIR, `${slug}.jpg`);
    let rawBuf;
    if (fs.existsSync(cachePath)) {
      rawBuf = fs.readFileSync(cachePath);
    } else {
      try {
        const res = await fetch(prod.bottleUrl);
        if (res.ok) {
          rawBuf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(cachePath, rawBuf);
        }
      } catch (e) {
        console.warn(`Failed to fetch image for ${slug}:`, e.message);
      }
    }

    if (rawBuf) {
      await renderProductImage(rawBuf, slug, isBundle);
      renderedCount++;
      process.stdout.write(`Rendered ${renderedCount}/${products.length} images: ${prod.title}\r`);
    }
  }

  console.log(`\nAll ${renderedCount}/${products.length} images rendered successfully!`);
}

buildCatalog().catch(console.error);
