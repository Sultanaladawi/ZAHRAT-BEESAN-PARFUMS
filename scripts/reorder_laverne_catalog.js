const fs = require('fs');
const path = require('path');

const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'laverne_perfumes.json');
const ARCHIVE_DATA_PATH = path.join(__dirname, '..', 'data', 'laverne_master_archive.json');

const FLAGSHIP_EDPS = [
  'بلو لافيرن سبورت',
  'بلو لافيرن بخور',
  'بلو لافيرن إلكسير',
  'بلو لافيرن',
  'توباكو',
  'كوبن توباكو',
  'كينق توباكو',
  'مس لافيرن',
  'مس لافيرن بلوم',
  'مس لافيرن روز',
  'مس لافيرن بيوتي',
  'مس لافيرن اكستريم',
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

function isBodyCare(title) {
  const t = title.toLowerCase();
  return t.includes('يدين') || t.includes('استحمام') || t.includes('إستحمام') || t.includes('جل') || t.includes('شاور') || t.includes('لوشن') || t.includes('كريم') || t.includes('دفيوزر') || t.includes('بودي اويل') || t.includes('بودي أويل') || t.includes('زيت للجسم');
}

function isMist(p) {
  const t = p.title.toLowerCase();
  return p.categoryType === 'hair_mist' || t.includes('شعر') || t.includes('هير مست') || t.includes('رذاذ') || t.includes('بودي مست') || t.includes('عطر الجسم');
}

function isAccessory(title) {
  const t = title.toLowerCase();
  return t.includes('وشاح') || t.includes('شال') || t.includes('كيس') || t.includes('حقيبة') || t.includes('شنطة') || t.includes('قلم') || t.includes('كحل') || t.includes('مسكرا') || t.includes('حواجب') || t.includes('إعادة التعبئة');
}

function getSortRank(p) {
  const title = p.title;
  const isCare = isBodyCare(title);
  const mist = isMist(p);
  const isMini = p.categoryType === 'mini';
  const isBundle = p.categoryType === 'bundle';

  // 1. Flagship Full Perfumes (NOT body care, NOT mists, NOT minis, NOT bundles)
  if (!isCare && !mist && !isMini && !isBundle) {
    for (let i = 0; i < FLAGSHIP_EDPS.length; i++) {
      if (title.startsWith(FLAGSHIP_EDPS[i]) || title.includes(FLAGSHIP_EDPS[i])) {
        return 100 + i;
      }
    }
    // Other full perfumes
    return 300;
  }

  // 2. Luxury Bundles & Gift Collections
  if (isBundle) {
    for (let i = 0; i < FLAGSHIP_EDPS.length; i++) {
      if (title.includes(FLAGSHIP_EDPS[i])) {
        return 400 + i;
      }
    }
    return 600;
  }

  // 3. Hair Mists & Body Mists
  if (mist) {
    return 700;
  }

  // 4. Minis & Discovery travel sizes
  if (isMini) {
    return 800;
  }

  // 5. Body care, shower gels, hand care
  if (isCare) {
    return 900;
  }

  return 1000;
}

function reorder() {
  if (!fs.existsSync(PUBLIC_DATA_PATH)) return;
  let prods = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));

  // Filter out any accessories that remained
  prods = prods.filter(p => !isAccessory(p.title));

  prods.sort((a, b) => getSortRank(a) - getSortRank(b));

  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(prods, null, 2));
  fs.writeFileSync(ARCHIVE_DATA_PATH, JSON.stringify(prods, null, 2));
  console.log(`Reordered ${prods.length} products successfully!`);

  console.log('\nTop 25 products after prestige reordering:');
  prods.slice(0, 25).forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.title} (${p.categoryType}) - ${p.finalJod} JOD`);
  });
}

reorder();
