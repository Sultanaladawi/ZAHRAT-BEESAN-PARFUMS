const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SCRATCH_DIR = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\scratch';
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'assaf_perfumes.json');
const ARCHIVE_DATA_PATH = path.join(__dirname, '..', 'data', 'assaf_master_archive.json');
const RAW_CACHE_DIR = path.join(__dirname, 'raw_assaf');

// All 104 items (35 existing + 69 new) that are packages with boxes/cartons/powders/gifts/lifestyle backgrounds
// and must keep their original website photo (1024x1024)
const KEEP_ORIGINAL_PACKAGE_IMAGE_IDS = new Set([
  // Existing 35 boxed/powder/discovery/bakhoor packages
  '369088822', '462253457', '2075831998', '1436733170', '1715267935',
  '1923830727', '176251001', '1014260708', '1822349968', '1955253099',
  '1668518142', '1131719368', '1502527852', '2136754339', '1970190686',
  '1731158495', '2059790339', '2035627978', '527229526', '615644271',
  '1310869051', '612456968', '1844930091', '158079522', '928196953',
  '757538292', '630468184', '1122310076', '1011090491', '1585724817',
  '934263228', '904825037', '1968936567', '2091596128', '2053809509',

  // New 69 boxed/powder/oud-oil/freshener/gift-offer packages
  '1211284845', '1788666212', '1262651335', '1142435325', '773982900',
  '1724171461', '1793235026', '915316704', '1501922217', '1975090272',
  '1065768549', '1247600206', '452992045', '632263589', '1303524915',
  '282780349', '769549373', '2114896913', '1586713770', '601605710',
  '432203624', '1405768836', '1522550952', '906729359', '1223143880',
  '54426548', '1619470917', '1445648994', '1178408748', '1482561259',
  '2060807308', '697281643', '164909226', '1613000123', '4247661',
  '1328818544', '1478178017', '827283712', '1508819280', '104061367',
  '2135629044', '1855721790', '1691037198', '899014836', '1810909461',
  '1007812804', '1013525767', '1911264232', '1873878326', '507291420',
  '1890240144', '796362785', '2140870208', '1774300134', '1743139439',
  '987466725', '1584169439', '1322025815', '264336229', '739460377',
  '1021444323', '80997452', '27146654', '173946824', '1999852780',
  '1614418890', '1957307526', '1211183980', '1465714971'
]);

// +30 JOD (3+ Full-Size Bottle Bundles)
const FEE_30_IDS = new Set([
  '1715267935', '176251001', '79328031', '1668518142', '1131719368',
  '88128890', '814804017', '1755285826', '1731158495', '527229526',
  '1310869051', '158079522', '2089452030', '1968936567', '2053809509',
  // New 3+ bottle sets
  '1340478300', '282780349', '1704407016', '601605710', '1522550952',
  '1236351736', '949019436', '906729359', '227203442', '1223143880',
  '54426548', '1619470917', '1445648994', '1082263421', '164909226',
  '1613000123', '4247661', '827283712', '1508819280', '2135629044',
  '1855721790', '1691037198', '899014836', '1021444323', '80997452',
  '1999852780', '1614418890', '1957307526', '1211183980'
]);

// +24 JOD (2 Full-Size Bottle Bundles or 1 Full Bottle + Mini Set)
const FEE_24_IDS = new Set([
  '369088822', '2075831998', '1436733170', '1955253099', '1502527852',
  '1036243994', '615644271', '1788666212', '780287822', '1492041621',
  '1036673145', '1850175256', '57443660', '1616970094', '2056378606',
  '683924030',
  // New 2-bottle sets
  '1211284845', '1262651335', '915316704', '1501922217', '1065768549',
  '597611948', '432203624', '1405768836', '1887833995', '2053607813',
  '2023066823', '1178408748', '697281643', '2144624115', '631445629',
  '2103188368', '1478178017', '297697690', '739460377'
]);

function getAssafCategoryType(item) {
  const sid = String(item.id);
  const name = item.name || '';
  const catName = item.category?.name || '';
  // Pure Oud oils (دهن عود طويق / دهن عود عبيه)
  if (sid === '773982900' || sid === '1724171461' || /^دهن عود/i.test(name)) return 'oil';
  // Bakhoor, Oud wood, Home fresheners & Diffusers
  if (sid === '1014260708' || sid === '1822349968' || sid === '1793235026' || sid === '1975090272') return 'bakhoor';
  if ((/بخور|عود مروكي|معمول|لبان|معطر المفارش|فواحة/i.test(name) || /بخور/i.test(catName)) && sid !== '895163030' && sid !== '314554267' && sid !== '601605710') {
    return 'bakhoor';
  }
  if (
    FEE_30_IDS.has(sid) ||
    FEE_24_IDS.has(sid) ||
    KEEP_ORIGINAL_PACKAGE_IMAGE_IDS.has(sid) ||
    /مجموعة|صندوق|بوكس|بكج|مليونية|ثلاثيه|ثلاثية|كراون ونوبل|هير قرايس|Collection|كولكشن|ديسكفري|وباودر|توزيعات|عرض|اجعلها|أربع عطور|ريد بوكس|ليدي سيكريت|ليدي قريس/i.test(name) ||
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
  return { feeJod: 12, bottleCount: 1 };
}

function parseNotesAndSpecs(item, catType) {
  const name = (item.name || '').trim();
  const rawDesc = (item.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  let sizeAr = '200 مل';
  let sizeEn = '200 ml';
  const sizeMatch = `${name} ${item.subtitle || ''} ${rawDesc}`.match(/(500|350|200|150|125|100|75|50|25|10)\s*مل/);
  if (catType === 'oil') {
    sizeAr = 'تولة / إصدار خاص فاخر';
    sizeEn = 'Luxury Pure Oud Oil';
  } else if (catType === 'bundle') {
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
    } else if (/باودر|بودرة/i.test(name)) {
      sizeAr = 'بودرة جسم عطرية فاخرة';
      sizeEn = 'Luxury Perfumed Body Powder';
    } else {
      sizeAr = 'مجموعة عطور وهدايا فاخرة';
      sizeEn = 'Luxury Perfume & Gift Set';
    }
  } else if (catType === 'bakhoor') {
    sizeAr = sizeMatch ? `${sizeMatch[1]} مل` : 'أوقية / صندوق فاخر';
    sizeEn = sizeMatch ? `${sizeMatch[1]} ml` : 'Luxury Bakhoor Box';
  } else if (sizeMatch) {
    sizeAr = `${sizeMatch[1]} مل`;
    sizeEn = `${sizeMatch[1]} ml`;
  }

  let genderAr = 'للجنسين';
  let genderEn = 'Unisex';
  const fullText = `${name} ${rawDesc} ${item.category?.name || ''}`;
  if (/نسائي|للنساء|ليدي|مس ساكورا|بينك|بيلا|فلور|كوين|قريس|ديفا|شارلوت|قيرل|سيدكشن|ايفوريا|إيفوريا/i.test(fullText) && !/للجنسين/i.test(fullText)) {
    genderAr = 'نسائي';
    genderEn = 'Women';
  } else if (/رجالي|للرجال|كينق|كنق|كولت|فرانكل|بيقاسوس|أروقيت/i.test(fullText) && !/نسائي|للنساء/i.test(fullText)) {
    genderAr = 'للجنسين / رجالي';
    genderEn = 'Men / Unisex';
  }

  let opening = 'البرغموت، الفلفل الوردي، ونفحات حمضية منعشة';
  let heart = 'الورد الدمشقي، الياسمين، والأخشاب العطرية';
  let base = 'العنبر الفاخر، المسك، خشب الصندل، والعود';

  const openMatch = rawDesc.match(/(?:الافتتاحية|إفتتاحية العطر|مقدمة العطر|المقدمة|قمة العطر|النفحات الأولى|المكونات العليا|Top notes)\s*[:：\-]?\s*(.+?)(?=\s+(?:القلب|قلب العطر|نفحات القلب|المكونات الوسطى|The heart|القاعدة|قاعدة العطر|النفحات الأخيرة|النفحات الأساسية)|[.!\n]|$)/i);
  const heartMatch = rawDesc.match(/(?:القلب|قلب العطر|نفحات القلب|المكونات الوسطى|The heart of the fragrance is)\s*[:：\-]?\s*(.+?)(?=\s+(?:القاعدة|قاعدة العطر|النفحات الأخيرة|النفحات الأساسية|المكونات الأساسية|The base|التقديم|الحجم|تركيبة)|[.!\n]|$)/i);
  const baseMatch = rawDesc.match(/(?:القاعدة|قاعدة العطر|النفحات الأخيرة|النفحات الأساسية|المكونات الأساسية|The base)\s*[:：\-]?\s*(.+?)(?=\s+(?:التقديم|الحجم|جنس العطر|مزيج|تركيبة|مستوى|طريقة|ثبات|الخلاصة|الأسئلة|بودرة|ريسك|أورا)|[.!\n]|$)/i);

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

  const typeAr = catType === 'oil'
    ? 'دهن عود ملكي نقي'
    : (catType === 'bundle'
      ? 'مجموعة إهداء وعروض ملكية'
      : (catType === 'bakhoor' ? 'بخور ومعطرات فاخرة' : 'أو دو بارفيوم (Eau De Parfum)'));
  const typeEn = catType === 'oil'
    ? 'Pure Royal Oud Oil'
    : (catType === 'bundle'
      ? 'Luxury Gift & Offer Set'
      : (catType === 'bakhoor' ? 'Royal Bakhoor & Home Fragrance' : 'Eau De Parfum'));

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
      type: typeAr,
      perfumer: 'دار عطور عساف (Assaf Perfumes)'
    },
    specsEn: {
      origin: 'Kingdom of Saudi Arabia',
      category: genderEn,
      size: sizeEn,
      type: typeEn,
      perfumer: 'House of Assaf'
    }
  };
}

async function main() {
  // 1. Load existing 139 products from public/data/assaf_perfumes.json
  const existingCatalog = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));
  const existingIds = new Set(existingCatalog.map(p => String(p.sallaId)));

  // 2. Load deep discovered raw map
  const deepRaw = JSON.parse(fs.readFileSync(path.join(SCRATCH_DIR, 'assaf_deep_discovered.json'), 'utf8'));
  const rawMap = new Map(deepRaw.map(p => [String(p.id), p]));

  // 3. Load groupA and groupB new candidates
  const groupA = JSON.parse(fs.readFileSync(path.join(SCRATCH_DIR, 'assaf_new_groupA.json'), 'utf8'));
  const groupB = JSON.parse(fs.readFileSync(path.join(SCRATCH_DIR, 'assaf_new_groupB.json'), 'utf8'));
  const skipIds = new Set([
    '1403084485', '1517236607', '6165769', '2077147024', '415811600',
    '1354027755', '1405771318', '505077860', '1610044117', '829997380'
  ]);

  const newItemsRaw = [...groupA, ...groupB].filter(p => {
    const sid = String(p.id);
    return !existingIds.has(sid) && !skipIds.has(sid);
  });

  // Sort newItemsRaw so in-stock ('sale') items come first!
  newItemsRaw.sort((a, b) => {
    const aSale = a.status === 'sale' ? 0 : 1;
    const bSale = b.status === 'sale' ? 0 : 1;
    return aSale - bSale;
  });

  console.log(`Existing Assaf catalog items: ${existingCatalog.length}`);
  console.log(`New discovered Assaf items to add: ${newItemsRaw.length}`);

  const newCatalogEntries = [];
  for (let i = 0; i < newItemsRaw.length; i++) {
    const item = newItemsRaw[i];
    const sid = String(item.id);
    const idSlug = `assaf-${sid}`;
    const catType = getAssafCategoryType(item);
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
    const rawPngPath = path.join(RAW_CACHE_DIR, `raw_${sid}.png`);

    if (KEEP_ORIGINAL_PACKAGE_IMAGE_IDS.has(sid)) {
      // Save original high-res website image (1024x1024)
      if (fs.existsSync(rawPngPath)) {
        await sharp(rawPngPath)
          .flatten({ background: '#ffffff' })
          .resize({ width: 1024, height: 1024, fit: 'contain', background: '#ffffff', withoutEnlargement: false })
          .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
          .toFile(absImage);
      }
    } else {
      // Template image was already rendered & verified by test_render_43_new_templates.js + fix_3_new_templates.js!
      if (!fs.existsSync(absImage)) {
        console.warn(`WARNING: Template image missing for ${sid}`);
      }
    }

    const details = parseNotesAndSpecs(item, catType);
    newCatalogEntries.push({
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
      promotionTitle: item.promotion_title || item.subtitle || (item.category?.name || ''),
      url: item.url || `https://3saf.com/ar/p${sid}`,
      bottleUrl: imgUrl,
      image: fs.existsSync(absImage) ? relImage : imgUrl,
      originalImage: imgUrl,
      galleryImages: [],
      ...details,
      categoryType: catType
    });
  }

  // Merge: place in-stock ('sale') items from existing + new first, then out-of-stock ('out') items
  const allCombined = [...existingCatalog, ...newCatalogEntries];
  const inStockList = allCombined.filter(p => p.status === 'sale' || p.isAvailable);
  const outOfStockList = allCombined.filter(p => p.status !== 'sale' && !p.isAvailable);
  const finalCatalog = [...inStockList, ...outOfStockList];

  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(finalCatalog, null, 2), 'utf8');
  fs.writeFileSync(ARCHIVE_DATA_PATH, JSON.stringify(finalCatalog, null, 2), 'utf8');

  console.log(`\n✅ Saved ${finalCatalog.length} total Assaf products to ${PUBLIC_DATA_PATH}`);
  console.log(`   - In stock (sale): ${inStockList.length}`);
  console.log(`   - Out of stock / search-only archive (out): ${outOfStockList.length}`);
  console.log(`   - Perfumes: ${finalCatalog.filter(p => p.categoryType === 'perfume').length}`);
  console.log(`   - Bundles & Offers: ${finalCatalog.filter(p => p.categoryType === 'bundle').length}`);
  console.log(`   - Bakhoor & Fresheners: ${finalCatalog.filter(p => p.categoryType === 'bakhoor').length}`);
  console.log(`   - Pure Oud Oils: ${finalCatalog.filter(p => p.categoryType === 'oil').length}`);
}

main().catch(console.error);
