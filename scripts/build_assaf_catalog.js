const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

const RAW_JSON_PATH = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\scratch\\assaf_curated_products.json';
const MASTER_BG_PATH = path.join(__dirname, '..', 'public', 'images', 'assaf_master_bg.jpg');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'assaf_perfumes.json');
const ARCHIVE_DATA_PATH = path.join(__dirname, '..', 'data', 'assaf_master_archive.json');
const RAW_CACHE_DIR = path.join(__dirname, 'raw_assaf');

if (!fs.existsSync(RAW_CACHE_DIR)) fs.mkdirSync(RAW_CACHE_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(PUBLIC_DATA_PATH))) fs.mkdirSync(path.dirname(PUBLIC_DATA_PATH), { recursive: true });
if (!fs.existsSync(path.dirname(ARCHIVE_DATA_PATH))) fs.mkdirSync(path.dirname(ARCHIVE_DATA_PATH), { recursive: true });

// Excluded non-perfume / sunglasses / discontinued / duplicate out-of-stock Salla IDs
const EXCLUDED_ASSAF_IDS = new Set([
  '1855721790', // مجموعة فرحة وطن (includes sunglasses نظارة بنزيما)
  '829997380',  // العرض العالمي (watch + sunglasses)
  '796362785',  // مجموعة أورا مع هدية (includes sunglasses نظارة فرانكل 35)
  '899014836',  // مجموعة ثلاثيه اورا (image includes sunglasses)
  '1691037198', // مجموعة سترايك اورا (image includes sunglasses)
  '1142435325', // مجموعة كريم اليد ليدي (hand creams)
  '1880252117', // فرانكل تشيل (سيتم الغاء العطر)
  '1403084485', // صندوق الديسكفري [out] duplicate of 757538292 [sale]
  '2077147024', // مجموعة فرانكل 25 مل [out] duplicate of 1122310076 [sale]
  '415811600',  // مجموعة فرانكل 25 مل [out] duplicate of 1122310076 [sale]
  '1517236607'  // مجموعة ليدي 25 مل [out] duplicate of 2035627978
]);

// +30 JOD (3+ Full-Size Bottle Bundles)
const FEE_30_IDS = new Set([
  '1715267935', // مجموعة ليدي 100 مل (3 × 100ml)
  '176251001',  // مجموعة هدية ليدي (3 × 100ml + gift set)
  '79328031',   // مليونية اروجيت (5 perfumes)
  '1668518142', // مجموعة أورا أتاك (3 perfumes)
  '1131719368', // مجموعة ديفا ريسك (3 perfumes)
  '88128890',   // مجموعة فرانكل إليت (3 perfumes)
  '814804017',  // مجموعة تريبل امباكت (3 perfumes)
  '1755285826', // مجموعة اروقنت (7 × 100ml)
  '1731158495', // مجموعة سمر أروقيت (4 × 200ml)
  '527229526',  // مجموعة فرانكل هدية الصيف (4 × 200ml)
  '1310869051', // مجموعة العرض الخاصة (3 × 200ml)
  '158079522',  // مجموعة فرانكل مع صندوق عينات (4 × 200ml + samples)
  '2089452030', // مجموعة ال 600 مل النسائية (3 × 200ml)
  '1968936567', // هير قرايس (3 perfumes)
  '2053809509'  // Aura and Risk Collection (4 perfumes)
]);

// +24 JOD (2 Full-Size Bottle Bundles or 1 Full Bottle + 1 Mini Box Set)
const FEE_24_IDS = new Set([
  '369088822',  // مجموعة ريسك (2 × 125ml)
  '2075831998', // سترايك بلاك + مجموعة العهد الجديد (1 bottle + mini set)
  '1436733170', // مجموعة فيرست نايت والعهد الجديد (1 bottle + mini set)
  '1955253099', // مجموعة ريسك + بودرة بيوتي بلوم (2 × 125ml + powder)
  '1502527852', // مجموعة كولد هوك (2 perfumes)
  '1036243994', // مجموعة فرانكل كينق (2 perfumes)
  '615644271',  // مجموعة أروقيت بينك ديفا (2 perfumes)
  '1788666212', // مجموعة بينك باودر (2 perfumes)
  '780287822',  // مجموعة بينك (2 perfumes)
  '1492041621', // كراون ونوبل ٢٠٠ مل (2 × 200ml)
  '1036673145', // مجموعة وايلد وقريس (2 × 200ml)
  '1850175256', // مجموعة أحدث الإصدارات (2 × 200ml)
  '57443660',   // مجموعة بيوند بلاك (2 × 200ml)
  '1616970094', // مجموعة ليدي ساكورا (2 × 100ml + hair mist)
  '2056378606', // مجموعة أورا اتاكس (2 perfumes)
  '683924030'   // مجموعة فرانكل بلو وسيلفر (2 × 200ml)
]);

function getAssafCategoryType(item) {
  const name = item.name || '';
  const catName = item.category?.name || '';
  if (/بخور|عود مروكي|معمول|لبان/i.test(name) || /بخور/i.test(catName)) return 'bakhoor';
  if (
    FEE_30_IDS.has(String(item.id)) ||
    FEE_24_IDS.has(String(item.id)) ||
    /مجموعة|صندوق|بوكس|مليونية|ثلاثيه|ثلاثية|كراون ونوبل|هير قرايس|Collection|كولكشن|ديسكفري|وباودر/i.test(name) ||
    /بوكسات|مجموعات|الإهداء/i.test(catName)
  ) {
    return 'bundle';
  }
  return 'perfume';
}

function getAssafFeeAndBottleCount(item, catType) {
  const sid = String(item.id);
  if (FEE_30_IDS.has(sid)) return { feeJod: 30, bottleCount: 3 };
  if (FEE_24_IDS.has(sid)) return { feeJod: 24, bottleCount: 2 };
  if (catType === 'bundle') {
    const text = `${item.name || ''} ${item.description || ''}`;
    if (/25\s*مل|10\s*مل|عينات|ديسكفري|ميني|بودرة/i.test(text)) {
      return { feeJod: 12, bottleCount: 1 };
    }
    if (/ثلاث|3\s*عطور|4\s*عطور|5\s*عطور|600\s*مل|مليونية/i.test(text)) {
      return { feeJod: 30, bottleCount: 3 };
    }
    if (/عطرين|عطران|ثنائية|2\s*×/i.test(text)) {
      return { feeJod: 24, bottleCount: 2 };
    }
  }
  return { feeJod: 12, bottleCount: 1 };
}

function parseNotesAndSpecs(item, catType) {
  const name = (item.name || '').trim();
  const rawDesc = (item.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  let sizeAr = '200 مل';
  let sizeEn = '200 ml';
  const sizeMatch = `${name} ${rawDesc}`.match(/(200|150|125|100|75|50|25|10)\s*مل/);
  if (catType === 'bundle') {
    if (FEE_30_IDS.has(String(item.id))) {
      sizeAr = 'مجموعة إهداء ملكية فاخرة';
      sizeEn = 'Royal Luxury Gift Set';
    } else if (FEE_24_IDS.has(String(item.id))) {
      sizeAr = 'مجموعة ثنائية فاخرة';
      sizeEn = 'Luxury Duo Set';
    } else if (/25\s*مل/.test(`${name} ${rawDesc}`)) {
      sizeAr = 'مجموعة ميني (25 مل)';
      sizeEn = 'Mini Collection (25 ml)';
    } else if (/10\s*مل|ديسكفري|عينات/.test(`${name} ${rawDesc}`)) {
      sizeAr = 'صندوق ديسكفري / عينات';
      sizeEn = 'Discovery Set';
    } else {
      sizeAr = 'مجموعة عطور فاخرة';
      sizeEn = 'Luxury Perfume Set';
    }
  } else if (catType === 'bakhoor') {
    sizeAr = 'أوقية / صندوق فاخر';
    sizeEn = 'Luxury Bakhoor Box';
  } else if (sizeMatch) {
    sizeAr = `${sizeMatch[1]} مل`;
    sizeEn = `${sizeMatch[1]} ml`;
  }

  let genderAr = 'للجنسين';
  let genderEn = 'Unisex';
  const fullText = `${name} ${rawDesc} ${item.category?.name || ''}`;
  if (/نسائي|للنساء|ليدي|مس ساكورا|بينك|بيلا|فلور|كوين|قريس|ديفا/i.test(fullText) && !/للجنسين/i.test(fullText)) {
    genderAr = 'نسائي';
    genderEn = 'Women';
  } else if (/رجالي|للرجال|كينق|كولت|فرانكل|بيقاسوس|أروقيت/i.test(fullText) && !/نسائي|للنساء/i.test(fullText)) {
    genderAr = 'للجنسين / رجالي';
    genderEn = 'Men / Unisex';
  }

  let opening = 'البرغموت، الفلفل الوردي، ونفحات حمضية منعشة';
  let heart = 'الورد الدمشقي، الياسمين، والأخشاب العطرية';
  let base = 'العنبر الفاخر، المسك، خشب الصندل، والعود';

  const openMatch = rawDesc.match(/(?:الافتتاحية|إفتتاحية العطر|مقدمة العطر|المقدمة|قمة العطر|النفحات الأولى)\s*[:：\-]?\s*(.+?)(?=\s+(?:القلب|قلب العطر|نفحات القلب|القاعدة|قاعدة العطر|النفحات الأخيرة|النفحات الأساسية)|[.!\n]|$)/i);
  const heartMatch = rawDesc.match(/(?:القلب|قلب العطر|نفحات القلب)\s*[:：\-]?\s*(.+?)(?=\s+(?:القاعدة|قاعدة العطر|النفحات الأخيرة|النفحات الأساسية|التقديم|الحجم|تركيبة)|[.!\n]|$)/i);
  const baseMatch = rawDesc.match(/(?:القاعدة|قاعدة العطر|النفحات الأخيرة|النفحات الأساسية)\s*[:：\-]?\s*(.+?)(?=\s+(?:التقديم|الحجم|جنس العطر|مزيج|تركيبة|مستوى|طريقة|ثبات|الخلاصة|الأسئلة|بودرة|ريسك|أورا)|[.!\n]|$)/i);

  if (openMatch && openMatch[1].trim().length >= 3 && openMatch[1].trim().length <= 95) {
    opening = openMatch[1].replace(/[|]/g, '، ').trim();
  }
  if (heartMatch && heartMatch[1].trim().length >= 3 && heartMatch[1].trim().length <= 95) {
    heart = heartMatch[1].replace(/[|]/g, '، ').trim();
  }
  if (baseMatch && baseMatch[1].trim().length >= 3 && baseMatch[1].trim().length <= 95) {
    base = baseMatch[1].replace(/[|]/g, '، ').trim();
  }

  const prominent = `${opening.split(/[،,]/)[0]?.trim() || 'العنبر'}، ${heart.split(/[،,]/)[0]?.trim() || 'الأخشاب'}، ${base.split(/[،,]/)[0]?.trim() || 'المسك'}`;

  return {
    overview: rawDesc || `${name} من عطور عساف الملكية — تركيبة عطرية فاخرة ذات ثبات وفوحان استثنائي.`,
    overviewEn: rawDesc || `${name} by Assaf Perfumes — A high-projection luxury fragrance crafted for lasting distinction.`,
    opening,
    openingEn: opening,
    heart,
    heartEn: heart,
    base,
    baseEn: base,
    prominent,
    prominentEn: prominent,
    specs: {
      origin: 'المملكة العربية السعودية',
      category: genderAr,
      size: sizeAr,
      type: catType === 'bundle' ? 'مجموعة إهداء ملكية' : (catType === 'bakhoor' ? 'بخور وعود فاخر' : 'أو دو بارفيوم (Eau De Parfum)'),
      perfumer: 'دار عطور عساف (Assaf Perfumes)'
    },
    specsEn: {
      origin: 'Kingdom of Saudi Arabia',
      category: genderEn,
      size: sizeEn,
      type: catType === 'bundle' ? 'Luxury Gift Set' : (catType === 'bakhoor' ? 'Royal Bakhoor & Oud' : 'Eau De Parfum'),
      perfumer: 'House of Assaf'
    }
  };
}

function fillInteriorHoles(outData, w, h) {
  const exterior = new Uint8Array(w * h);
  const queue = new Int32Array(w * h * 2);
  let head = 0, tail = 0;

  const push = (px, py) => {
    const pos = py * w + px;
    if (!exterior[pos] && outData[pos * 4 + 3] === 0) {
      exterior[pos] = 1;
      queue[tail++] = px;
      queue[tail++] = py;
    }
  };

  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  while (head < tail) {
    const cx = queue[head++], cy = queue[head++];
    if (cx + 1 < w) push(cx + 1, cy);
    if (cx - 1 >= 0) push(cx - 1, cy);
    if (cy + 1 < h) push(cx, cy + 1);
    if (cy - 1 >= 0) push(cx, cy - 1);
  }

  for (let i = 0; i < w * h; i++) {
    if (!exterior[i]) {
      outData[i * 4 + 3] = 255;
    }
  }
}

async function extractCutoutSpotless(rawBuf, sid, isBundle = false) {
  const pngCachePath = path.join(RAW_CACHE_DIR, `imgly_${sid}.png`);
  let imglyBuf;

  // 1. Convert raw image to PNG and run AI background removal (@imgly)
  const normPng = await sharp(rawBuf)
    .resize({ width: 1100, height: 1100, fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();

  if (fs.existsSync(pngCachePath) && fs.statSync(pngCachePath).size > 1000) {
    imglyBuf = fs.readFileSync(pngCachePath);
  } else {
    const blob = new Blob([normPng], { type: 'image/png' });
    const outBlob = await removeBackground(blob);
    imglyBuf = Buffer.from(await outBlob.arrayBuffer());
    fs.writeFileSync(pngCachePath, imglyBuf);
  }

  const { data: imglyData, info } = await sharp(imglyBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const { data: origData } = await sharp(normPng).resize(w, h, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Always use original un-darkened RGB so light-colored packages & white bottles never turn dark or black!
  const outData = Buffer.from(origData);

  if (!isBundle) {
    // SINGLE BOTTLE / BAKHOOR:
    // Threshold out semi-transparent floor reflections (< 140) and solidify kept pixels to 255
    let minY = h, maxY = 0, minX = w, maxX = 0, keptCount = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = imglyData[idx + 3];
        if (a >= 140) {
          outData[idx + 3] = 255;
          keptCount++;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        } else {
          outData[idx + 3] = 0;
        }
      }
    }

    const objW = maxX - minX;
    const objH = maxY - minY;
    if (objH > 50 && objW <= objH * 0.52) {
      // Measure top of cap (top 1% to 5%) where leftward studio shadow hasn't started
      let sumCapCenter = 0, capRows = 0;
      const cStart = minY + Math.max(2, Math.round(objH * 0.01));
      const cEnd = minY + Math.max(8, Math.round(objH * 0.05));
      for (let y = cStart; y <= cEnd; y++) {
        let rowL = w, rowR = 0;
        for (let x = 0; x < w; x++) {
          if (outData[(y * w + x) * 4 + 3] >= 180) {
            if (x < rowL) rowL = x;
            if (x > rowR) rowR = x;
          }
        }
        if (rowR > rowL + 10) {
          sumCapCenter += (rowL + rowR) / 2;
          capRows++;
        }
      }
      const capCenterX = capRows > 0 ? Math.round(sumCapCenter / capRows) : Math.round((minX + maxX) / 2);

      // Measure bottle body right-half width (across 45%..78% of height)
      let sumBodyHalfW = 0, bodyRows = 0;
      const bStart = minY + Math.round(objH * 0.45);
      const bEnd = minY + Math.round(objH * 0.78);
      for (let y = bStart; y <= bEnd; y++) {
        for (let x = w - 1; x >= capCenterX; x--) {
          if (outData[(y * w + x) * 4 + 3] >= 180) {
            sumBodyHalfW += (x - capCenterX);
            bodyRows++;
            break;
          }
        }
      }
      const avgBodyHalfW = bodyRows > 0 ? (sumBodyHalfW / bodyRows) : 80;

      // Measure lowest point on the right side of capCenterX (excluding narrow bottom V-reflections)
      let rightMaxY = minY;
      for (let y = minY; y < h; y++) {
        let rX = -1;
        for (let x = w - 1; x >= capCenterX + 10; x--) {
          if (outData[(y * w + x) * 4 + 3] >= 180) {
            rX = x;
            break;
          }
        }
        if (rX > capCenterX) {
          const halfW = rX - capCenterX;
          if (y > minY + objH * 0.88 && halfW < avgBodyHalfW * 0.83) {
            break; // Reached narrow bottom V-reflection under glass base
          }
          if (y > rightMaxY) rightMaxY = y;
        }
      }
      if (rightMaxY < minY + objH * 0.7) rightMaxY = maxY;

      // Enforce right-to-left bottle symmetry to slice off any leftward studio shadow
      if (Math.abs(capCenterX - (minX + maxX) / 2) <= objW * 0.16) {
        for (let y = 0; y < h; y++) {
          if (y > rightMaxY) {
            for (let x = 0; x < w; x++) outData[(y * w + x) * 4 + 3] = 0;
            continue;
          }
          let rX = -1;
          for (let x = w - 1; x >= capCenterX; x--) {
            if (outData[(y * w + x) * 4 + 3] >= 180) {
              rX = x;
              break;
            }
          }
          if (rX <= capCenterX) {
            for (let x = 0; x < w; x++) outData[(y * w + x) * 4 + 3] = 0;
            continue;
          }
          const halfW = rX - capCenterX;
          const symLeftX = capCenterX - halfW;
          for (let x = 0; x < symLeftX; x++) {
            outData[(y * w + x) * 4 + 3] = 0;
          }
        }
      }
    }

    // Fill any interior holes (e.g. white labels on bottle)
    fillInteriorHoles(outData, w, h);
  } else {
    // BUNDLE / PACKAGE:
    // Preserve light-colored boxes at 100% solid opacity while removing outer background & bottom floor shadows
    const isWhiteBg = (origData[0] >= 242 && origData[1] >= 242 && origData[2] >= 242);

    let solidMinY = h, solidMaxY = 0, solidMinX = w, solidMaxX = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const a = imglyData[(y * w + x) * 4 + 3];
        if (a >= 210) {
          if (y < solidMinY) solidMinY = y;
          if (y > solidMaxY) solidMaxY = y;
          if (x < solidMinX) solidMinX = x;
          if (x > solidMaxX) solidMaxX = x;
        }
      }
    }
    const solidH = Math.max(1, solidMaxY - solidMinY);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = imglyData[idx + 3];
        const r = origData[idx], g = origData[idx + 1], b = origData[idx + 2];

        // Pure white studio backdrop -> transparent
        if (isWhiteBg && r >= 254 && g >= 254 && b >= 254 && a < 180) {
          outData[idx + 3] = 0;
          continue;
        }

        // Below solid base of package -> cut off floor shadows/reflections
        if (y > solidMaxY + 2) {
          outData[idx + 3] = 0;
          continue;
        }

        const inBottomZone = y > solidMinY + solidH * 0.76;

        // Pink/magenta shadow cast by red/pink bottles onto white floor -> transparent
        if (isWhiteBg && inBottomZone && a < 140 && r >= 215 && b > g) {
          outData[idx + 3] = 0;
          continue;
        }

        const isWarmBox = isWhiteBg && (
          r >= 224 &&
          (!inBottomZone || g >= b) &&
          (r - b) >= 6 &&
          b <= 246 &&
          x >= solidMinX - 10 &&
          x <= solidMaxX + 10 &&
          y >= Math.max(30, solidMinY - 140) &&
          y <= solidMaxY - 4
        );

        if (!isWhiteBg) {
          outData[idx + 3] = (a >= 120 || (!inBottomZone && a >= 70)) ? 255 : 0;
          continue;
        }

        if (inBottomZone && a < 130 && !isWarmBox) {
          outData[idx + 3] = 0;
          continue;
        }

        if (a >= 95 || isWarmBox || (!inBottomZone && a >= 8 && g >= b - 1 && x >= solidMinX - 15 && x <= solidMaxX + 15 && y >= solidMinY - 15)) {
          outData[idx + 3] = 255;
        } else {
          outData[idx + 3] = 0;
        }
      }
    }

    // Fill vertical spans inside white boxes where top and bottom of the box are opaque and interior has a >= 8
    if (isWhiteBg) {
      for (let x = solidMinX; x <= solidMaxX; x++) {
        let topSolid = -1, botSolid = -1;
        for (let y = 0; y < h; y++) {
          if (outData[(y * w + x) * 4 + 3] === 255) {
            if (topSolid === -1) topSolid = y;
            botSolid = y;
          }
        }
        if (topSolid !== -1 && botSolid > topSolid + 40) {
          for (let y = topSolid + 1; y < botSolid; y++) {
            const idx = (y * w + x) * 4;
            if (outData[idx + 3] === 0 && imglyData[idx + 3] >= 8) {
              outData[idx + 3] = 255;
            }
          }
        }
      }
    }

    // Fill any enclosed interior holes inside light-colored boxes/bottles
    fillInteriorHoles(outData, w, h);
  }

  const cleanedPng = await sharp(outData, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(cleanedPng).trim().toBuffer({ resolveWithObject: true });
  return trimmed;
}

async function renderAssafProductImage(rawBuf, sid, outPath, isBundle = false) {
  const trimmed = await extractCutoutSpotless(rawBuf, sid, isBundle);

  const maxW = isBundle ? 650 : 480;
  const maxH = isBundle ? 495 : 515;
  const resized = await sharp(trimmed.data)
    .resize({ width: maxW, height: maxH, fit: 'inside', kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 50;
  const shadowH = 30;
  const shadowSvg = `
  <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.42}" ry="8" fill="#1b1209" opacity="0.65" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.28}" ry="4" fill="#080503" opacity="0.9" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(MASTER_BG_PATH)
    .composite([
      { input: shadowBuf, left: Math.round(left - 25), top: baseContactY - 14 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function buildAll() {
  const rawList = JSON.parse(fs.readFileSync(RAW_JSON_PATH, 'utf8'));
  const seenIds = new Set();

  const cleanRaw = [];
  for (const item of rawList) {
    const sid = String(item.id);
    if (EXCLUDED_ASSAF_IDS.has(sid)) continue;
    if (seenIds.has(sid)) continue;
    seenIds.add(sid);
    cleanRaw.push(item);
  }

  console.log(`Building ${cleanRaw.length} curated Assaf perfumes & gift sets via AI PNG cutout + shadow/hole cleaning...`);
  const catalog = new Array(cleanRaw.length);
  const BATCH_SIZE = 16;

  for (let start = 0; start < cleanRaw.length; start += BATCH_SIZE) {
    const batch = cleanRaw.slice(start, start + BATCH_SIZE);
    await Promise.all(batch.map(async (item, idx) => {
      const i = start + idx;
      const sid = String(item.id);
      const idSlug = `assaf-${sid}`;
      const catType = getAssafCategoryType(item);
      const isBundle = catType === 'bundle';
      const { feeJod, bottleCount } = getAssafFeeAndBottleCount(item, catType);

      const sarPrice = Number(typeof item.price === 'object' ? item.price?.amount : item.price) || 95;
      const regRaw = Number(typeof item.regular_price === 'object' ? item.regular_price?.amount : item.regular_price) || sarPrice;
      const origSarPrice = Math.round(regRaw);
      const baseJod = Math.round(sarPrice / 5.29);
      const finalJod = baseJod + feeJod;
      const origJod = origSarPrice > sarPrice ? (Math.round(origSarPrice / 5.29) + feeJod) : finalJod;

      const isAvailable = item.is_available !== false && item.status !== 'out' && !item.is_out_of_stock;
      const status = item.status || (isAvailable ? 'sale' : 'out');
      const imgUrl = item.original_image || item.image?.url || '';

      const relImage = `images/assaf_${sid}.jpg`;
      const absImage = path.join(PUBLIC_IMAGES_DIR, `assaf_${sid}.jpg`);
      const cacheFile = path.join(RAW_CACHE_DIR, `${sid}.img`);

      try {
        let imgBuf;
        if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 500) {
          imgBuf = fs.readFileSync(cacheFile);
        } else if (imgUrl) {
          const res = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (res.ok) {
            imgBuf = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(cacheFile, imgBuf);
          }
        }

        if (imgBuf) {
          const KEEP_ORIGINAL_PACKAGE_IMAGE_IDS = new Set([
            '369088822', '462253457', '2075831998', '1436733170', '1715267935',
            '1923830727', '176251001', '1014260708', '1822349968', '1955253099',
            '1668518142', '1131719368', '1502527852', '2136754339', '1970190686',
            '1731158495', '2059790339', '2035627978', '527229526', '615644271',
            '1310869051', '612456968', '1844930091', '158079522', '928196953',
            '757538292', '630468184', '1122310076', '1011090491', '1585724817',
            '934263228', '904825037', '1968936567', '2091596128', '2053809509'
          ]);
          if (KEEP_ORIGINAL_PACKAGE_IMAGE_IDS.has(sid)) {
            await sharp(imgBuf)
              .flatten({ background: '#ffffff' })
              .resize({ width: 1024, height: 1024, fit: 'contain', background: '#ffffff', withoutEnlargement: false })
              .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
              .toFile(absImage);
          } else {
            await renderAssafProductImage(imgBuf, sid, absImage, isBundle);
          }
        }
      } catch (e) {
        console.warn(`  [!] Warning rendering image for ${sid} (${item.name}): ${e.message}`);
      }

      const details = parseNotesAndSpecs(item, catType);

      catalog[i] = {
        id: idSlug,
        sallaId: sid,
        house: 'assaf',
        title: (item.name || '').trim(),
        titleEn: (item.name || '').trim(),
        brand: 'عطور عساف (Assaf)',
        bottleCount,
        feeJod,
        sarPrice,
        origSarPrice,
        baseJod,
        finalJod,
        origJod,
        isAvailable,
        status,
        promotionTitle: item.promotion_title || item.subtitle || '',
        url: item.url || `https://3saf.com/ar/p${sid}`,
        bottleUrl: imgUrl,
        image: fs.existsSync(absImage) ? relImage : imgUrl,
        originalImage: imgUrl,
        galleryImages: [],
        ...details,
        categoryType: catType
      };
    }));
    console.log(`  Processed ${Math.min(start + BATCH_SIZE, cleanRaw.length)}/${cleanRaw.length}`);
  }

  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  fs.writeFileSync(ARCHIVE_DATA_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\n✅ Saved ${catalog.length} Assaf products to ${PUBLIC_DATA_PATH}`);
}

buildAll().catch(console.error);
