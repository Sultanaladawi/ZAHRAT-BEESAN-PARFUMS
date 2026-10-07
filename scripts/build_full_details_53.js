const fs = require('fs');
const path = require('path');

const rawScraped = JSON.parse(fs.readFileSync('data/remaining_53_scraped.json', 'utf8'));

// Slug generator
function slugify(name) {
  const map = {
    'بكج معطرات الجو': 'package-air-fresheners',
    'عطر رسائل شوق': 'rasayil-shawq',
    'عطر جست عود': 'just-oud',
    'عطر 1932': 'perfume-1932',
    'عطر ماونتن ليذر': 'mountain-leather',
    'عطر 2016': 'perfume-2016',
    'عطر امبيشيس': 'ambitious',
    'عطر سبلايم وود': 'sublime-woods',
    'عطر 1985': 'perfume-1985',
    'عطر ابسيليوت مسك': 'absolute-musk',
    'عطر سبلايم فلور': 'sublime-flowers',
    'عطر ايليكوينت': 'eloquent',
    'عطر بيتش مسك': 'peach-musk',
    'عطر جست عنبر': 'just-amber',
    'عطر كارمن سول': 'carmine-soul',
    'عطر داما': 'dama',
    'عطر يوتوبيا ايسينس': 'utopia-essence',
    'عطر ايكسوتك وود': 'exotic-wood',
    'عطر روز انتينس': 'rose-intense',
    'عطر راسبيري مسك': 'raspberry-musk',
    'عطر تشيري مسك': 'cherry-musk',
    'عطر فينتاج': 'vintage',
    'عطر ايريس مسك': 'iris-musk',
    'عطر سيرينيد / SERENADE': 'serenade',
    'عطر سيرينيد': 'serenade',
    'عطر يوتوبيا جيست': 'utopia-gist',
    'عطر اترنال باشن / ETERNAL PASSION': 'eternal-passion',
    'عطر اترنال باشن': 'eternal-passion',
    'عطر مون دو': 'mont-dor',
    'عطر بودوار / BOUDOIR': 'boudoir',
    'عطر بودوار': 'boudoir',
    'عطر فيرست امبريشن / FIRST IMPRESSION': 'first-impression',
    'عطر فيرست امبريشن': 'first-impression',
    'عطر سراج / SERAJ': 'seraj',
    'عطر سراج': 'seraj',
    'عطر قرطاج فيلورز': 'cartage-velours',
    'عطر موست ونتد / MOST WANTED': 'most-wanted',
    'عطر موست ونتد': 'most-wanted',
    'عطر قرطاج ايتوال': 'cartage-etoile',
    'عطر سلك ايسنس / Silk Essence': 'silk-essence',
    'عطر سلك ايسنس': 'silk-essence',
    'عطر عنبر عود': 'amber-oud',
    'صندوق البرقاء': 'sandouq-albarqa',
    'عطر قرطاج نوبل': 'cartage-noble',
    'بكج قرطاج نوبل': 'package-cartage-noble',
    'بكج قرطاج ايتوال': 'package-cartage-etoile',
    'بكج قرطاج فيلورز': 'package-cartage-velours',
    'مجموعة مسك الجسم': 'bundle-body-musk',
    'مجموعة السعادة': 'bundle-al-saada',
    'باقة ديسكفري': 'bundle-discovery',
    'لاكجري ايديشن': 'luxury-edition',
    'فارنا و مون دو': 'bundle-varna-montdor',
    'باقة لك ولها': 'bundle-lak-walaha',
    'باقة مودرن': 'bundle-modern',
    'باقة دراعة': 'bundle-daraa',
    'باقة طويق': 'bundle-tuwaiq',
    'باقة الروشن': 'bundle-rawshan',
    'باقة سدو': 'bundle-sadu',
    'باقة اليمامة': 'bundle-yamama',
    'عطر هونست': 'honest'
  };

  const cleanName = (name || '').trim();
  if (map[cleanName]) return map[cleanName];
  for (const k in map) {
    if (cleanName.includes(k) || k.includes(cleanName)) return map[k];
  }
  return 'ghalati-' + Math.random().toString(36).substring(2, 8);
}

// English title mapping
function getTitleEn(name, slug) {
  const titles = {
    'honest': 'Honest Eau De Parfum',
    'package-air-fresheners': 'Luxury Air Fresheners Trio Package',
    'rasayil-shawq': 'Rasayil Shawq Eau De Parfum',
    'just-oud': 'Just Oud Eau De Parfum',
    'perfume-1932': '1932 Vintage Eau De Parfum',
    'mountain-leather': 'Mountain Leather Eau De Parfum',
    'perfume-2016': '2016 Signature Eau De Parfum',
    'ambitious': 'Ambitious Eau De Parfum',
    'sublime-woods': 'Sublime Woods Eau De Parfum',
    'perfume-1985': '1985 Royal Eau De Parfum',
    'absolute-musk': 'Absolute Musk Eau De Parfum',
    'sublime-flowers': 'Sublime Flowers Eau De Parfum',
    'eloquent': 'Eloquent Eau De Parfum',
    'peach-musk': 'Peach Musk Eau De Parfum',
    'just-amber': 'Just Amber Eau De Parfum',
    'carmine-soul': 'Carmine Soul Eau De Parfum',
    'dama': 'Dama Royal Eau De Parfum',
    'utopia-essence': 'Utopia Essence Eau De Parfum',
    'exotic-wood': 'Exotic Wood Eau De Parfum',
    'rose-intense': 'Rose Intense Eau De Parfum',
    'raspberry-musk': 'Raspberry Musk Eau De Parfum',
    'cherry-musk': 'Cherry Musk Eau De Parfum',
    'vintage': 'Eau De Vintage Prestige',
    'iris-musk': 'Iris Musk Eau De Parfum',
    'serenade': 'Serenade Royal Eau De Parfum',
    'utopia-gist': 'Utopia Gist Eau De Parfum',
    'eternal-passion': 'Eternal Passion Eau De Parfum',
    'mont-dor': 'Mont Dor Royal Eau De Parfum',
    'boudoir': 'Boudoir Royal Eau De Parfum',
    'first-impression': 'First Impression Eau De Parfum',
    'seraj': 'Seraj Royal Eau De Parfum',
    'cartage-velours': 'Cartage Velours Royal Eau De Parfum',
    'most-wanted': 'Most Wanted Royal Eau De Parfum',
    'cartage-etoile': 'Cartage Etoile Royal Eau De Parfum',
    'silk-essence': 'Silk Essence Royal Eau De Parfum',
    'amber-oud': 'Amber Oud Royal Eau De Parfum',
    'sandouq-albarqa': 'Sandouq Al-Barqa Luxury Collection Box',
    'cartage-noble': 'Cartage Noble Royal Eau De Parfum',
    'package-cartage-noble': 'Cartage Noble Luxury Package',
    'package-cartage-etoile': 'Cartage Etoile Luxury Package',
    'package-cartage-velours': 'Cartage Velours Luxury Package',
    'bundle-body-musk': 'Body Musk Collection Bundle',
    'bundle-al-saada': 'Al-Saada Happiness Luxury Bundle',
    'bundle-discovery': 'Discovery Collection Gift Bundle',
    'luxury-edition': 'Luxury Edition Perfume Set',
    'bundle-varna-montdor': 'Varna & Mont Dor Royal Duo Bundle',
    'bundle-lak-walaha': 'For Him & Her Luxury Gift Bundle',
    'bundle-modern': 'Modern Heritage Luxury Diorama Bundle',
    'bundle-daraa': 'Daraa Heritage Luxury Diorama Bundle',
    'bundle-tuwaiq': 'Tuwaiq Heritage Luxury Diorama Bundle',
    'bundle-rawshan': 'Rawshan Heritage Luxury Diorama Bundle',
    'bundle-sadu': 'Sadu Heritage Luxury Diorama Bundle',
    'bundle-yamama': 'Yamama Heritage Luxury Diorama Bundle'
  };
  return titles[slug] || name;
}

async function extractDetails(item) {
  const slug = slugify(item.name);
  const titleEn = getTitleEn(item.name, slug);
  const isBundle = slug.startsWith('bundle-') || slug.startsWith('package-') || slug.includes('sandouq') || slug.includes('edition');

  let text = '';
  try {
    const res = await fetch(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const idx = html.indexOf('id="details_table"');
    if (idx !== -1) {
      text = html.substring(idx, idx + 3500).replace(/<[^>]+>/g, '\n');
    }
  } catch (e) {
    console.error(`Failed to fetch ${item.url}`);
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let overview = '';
  let opening = '';
  let heart = '';
  let base = '';
  let prominent = '';
  let size = isBundle ? 'مجموعة متكاملة' : '100 مل';
  let category = 'للجنسين';
  let type = isBundle ? 'باقة إهداء فاخرة' : 'عطر شرقي فاخر';

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith('الوصف:') || l.startsWith('الوصف :')) {
      overview = l.replace(/^الوصف\s*:\s*/, '').trim() || (lines[i+1] || '');
    }
    if (l.includes('الافتتاحية:') || l.includes('الافتتاحية :')) {
      opening = l.replace(/.*الافتتاحية\s*:\s*/, '').trim() || (lines[i+1] || '');
    }
    if (l.includes('القلب:') || l.includes('القلب :')) {
      heart = l.replace(/.*القلب\s*:\s*/, '').trim() || (lines[i+1] || '');
    }
    if (l.includes('القاعدة:') || l.includes('القاعدة :')) {
      base = l.replace(/.*القاعدة\s*:\s*/, '').trim() || (lines[i+1] || '');
    }
    if (l.includes('الروائح البارزة:') || l.includes('الروائح البارزة :')) {
      prominent = l.replace(/.*الروائح البارزة\s*:\s*/, '').trim() || (lines[i+1] || '');
    }
    if (l.includes('الحجم:')) size = l.replace(/.*الحجم:\s*/, '').trim();
    if (l.includes('الفئة:')) category = l.replace(/.*الفئة:\s*/, '').trim();
    if (l.includes('النوع:')) type = l.replace(/.*النوع:\s*/, '').trim();
  }

  if (!overview) {
    // If no direct overview tag, look for intro paragraph
    const introLines = lines.filter(l => !l.includes('تفاصيل المنتج') && !l.includes('تقييمات') && !l.includes('مكونات') && !l.includes('مواصفات') && !l.includes('الافتتاحية') && !l.includes('القلب') && !l.includes('القاعدة') && l.length > 25);
    if (introLines.length > 0) {
      overview = introLines[0];
    } else {
      overview = `إبداع عطري فاخر من دار غلاتي، يتميز بتركيبة استثنائية ونقاء آسر يمنحك حضوراً ملكياً يدوم طوال اليوم.`;
    }
  }

  // Fallbacks for notes if not separated
  if (!opening && !prominent) {
    prominent = isBundle ? 'نفحات عطرية متناغمة تجمع بين الفخامة والتميز' : 'الأخشاب الثمينة، العنبر الفاخر، والمسك النقي';
  }
  if (!opening) opening = 'افتتاحية متوازنة من الحمضيات المنعشة والتوابل العطرية';
  if (!heart) heart = 'قلب عطري غني بالأزهار الشرقية والنفحات الخشبية النادرة';
  if (!base) base = 'قاعدة عميقة وثابتة من المسك الملكي، العنبر الدافئ وخشب الصندل';
  if (!prominent) prominent = `${opening.split('،')[0]}، ${heart.split('،')[0]}، ${base.split('،')[0]}`;

  return {
    id: slug,
    title: item.name,
    titleEn,
    brand: 'دار غلاتي (Ghalati)',
    categoryType: isBundle ? 'bundle' : 'perfume',
    sarPrice: item.sarPrice,
    baseJod: item.baseJod,
    finalJod: item.finalJod,
    url: item.url,
    bottleUrl: item.originalImage,
    overview,
    opening,
    heart,
    base,
    prominent,
    specs: {
      origin: 'المملكة العربية السعودية',
      category: category.split('،')[0],
      size,
      type
    },
    galleryImages: item.images.slice(0, 4)
  };
}

async function main() {
  const result = [];
  console.log(`Extracting details for ${rawScraped.length} products...`);
  for (let i = 0; i < rawScraped.length; i++) {
    const item = rawScraped[i];
    console.log(`[${i + 1}/${rawScraped.length}] Parsing ${item.name}...`);
    const parsed = await extractDetails(item);
    result.push(parsed);
    await new Promise(r => setTimeout(r, 80));
  }

  fs.writeFileSync('data/full_53_products.json', JSON.stringify(result, null, 2), 'utf8');
  console.log(`Saved full details for ${result.length} products to data/full_53_products.json`);
}

main();
