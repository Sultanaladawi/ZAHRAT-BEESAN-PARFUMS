const fs = require('fs');

const scraped = JSON.parse(fs.readFileSync('data/live_scraped_ghalati.json', 'utf8'));
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

// Fix rasayil-haneen in scraped
const haneenEntry = scraped.find(s => s.id === 'rasayil-haneen');
if (haneenEntry) {
  haneenEntry.success = true;
  haneenEntry.url = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D8%B3%D8%A7%D8%A6%D9%84-%D8%AD%D9%86%D9%8A%D9%86/p1089182563';
  haneenEntry.parsed = {
    overview: "رسائل حنين عطر منعش يتحدى الجاذبية فتراقصها نسمة هواء محملة بعبير الازهار و الياسمين لخلق أثر عطري رائع التي تذهب بحواسك بعيدا إلى عالم مليء بالجمال وفرحا منعشا للروح .",
    opening: "البرغموت",
    heart: "البرتقال",
    base: "الباتشولي والتفاح",
    prominent: "البرغموت والبرتقال",
    perfumer: "فريق البحث والتطوير بغلاتي",
    origin: "المملكة العربية السعودية",
    category: "للجنسين",
    size: "100 مل",
    type: "عطر",
    fullText: "رسائل حنين عطر منعش يتحدى الجاذبية فتراقصها نسمة هواء محملة بعبير الازهار و الياسمين لخلق أثر عطري رائع التي تذهب بحواسك بعيدا إلى عالم مليء بالجمال وفرحا منعشا للروح . مكونات عطر رسائل حنين : الافتتاحية : البرغموت القلب : البرتقال القاعدة : الباتشولي و التفاح الروائح البارزة : البرغموت و البرتقال"
  };
}

// Special handlings for Carthage trio
const cartageVelours = scraped.find(s => s.id === 'cartage-velours');
if (cartageVelours && cartageVelours.parsed) {
  cartageVelours.parsed.overview = "CARTHAGE VELOURS || الفخامة والاحتفال في زجاجة. في قلب الاحتفال، حيث تتناغم الأصوات كأوركسترا من الفرح، يحمل طاقة الاحتفال كلها مع التوت الأحمر والورد التركي والمسك الفاخر.";
  cartageVelours.parsed.opening = "كوكتيل شمبانيا فواحة، التوت الأحمر، الكرز الأسود، والخوخ";
  cartageVelours.parsed.heart = "الورد التركي، الفاوانيا، والبنفسج";
  cartageVelours.parsed.base = "خشب الكشمير الناعم والمسك الراقي";
  cartageVelours.parsed.prominent = "كوكتيل الشمبانيا، التوت الأحمر، الورد التركي، خشب الكشمير، والمسك";
  cartageVelours.parsed.perfumer = "BELMAS THEO (ثيو بيلماس)";
}

const cartageEtoile = scraped.find(s => s.id === 'cartage-etoile');
if (cartageEtoile && cartageEtoile.parsed) {
  cartageEtoile.parsed.overview = "CARTHAGE ETOILE || لمسة شاعرية تحت سماء النجوم. عطر صُمم ليعبر عن شعور يشبهك، يحمل نفحات من الفانيليا الحالمة والمارشملو الناعم مع عبير الورد والبخور الفاخر.";
  cartageEtoile.parsed.opening = "المارشملو الناعم ونفحات الفانيليا الحالمة";
  cartageEtoile.parsed.heart = "عبير الورد الراقي والبخور";
  cartageEtoile.parsed.base = "الأخشاب الأنيقة، العنبر، والفانيليا";
  cartageEtoile.parsed.prominent = "المارشملو، البخور، الورد، العنبر، الفانيليا";
  cartageEtoile.parsed.perfumer = "Gael Montero (جايل مونتيرو)";
}

const cartageNoble = scraped.find(s => s.id === 'cartage-noble');
if (cartageNoble && cartageNoble.parsed) {
  cartageNoble.parsed.overview = "CARTHAGE NOBLE || عبق الفخامة والكلاسيكية. بين أضواء الشفق وظلال أشجار الياسمين، يحمل بين طياته عبقاً يعبر عن حضور مهيب وشخصية فريدة مع الورد القرطاجي والزعفران الإسباني.";
  cartageNoble.parsed.opening = "الزعفران الإسباني والبندق";
  cartageNoble.parsed.heart = "الورد القرطاجي، أشجار الياسمين واللبان البخوري";
  cartageNoble.parsed.base = "الفانيليا، العنبر والأخشاب";
  cartageNoble.parsed.prominent = "البندق، الروز، الزعفران، الفانيليا، اللبان البخوري";
  cartageNoble.parsed.perfumer = "فريق البحث والتطوير بغلاتي";
}

// Robust Notes Extractor for any page text
function extractFragrancePyramid(fullText) {
  if (!fullText) return {};

  let opening = '', heart = '', base = '', prominent = '', perfumer = '';

  const opM = fullText.match(/(?:الافتتاحية|قمة العطر|مقدمة العطر|المقدمة)\s*[:：]?\s*([^:]+?)(?=(?:القلب|قلب العطر|القاعدة|قاعدة العطر|الروائح البارزة|مواصفات|بلد المنشأ|العطار|---|$))/i);
  if (opM) opening = opM[1].replace(/[.\s]+$/, '').trim();

  const heM = fullText.match(/(?:القلب|قلب العطر)\s*[:：]?\s*([^:]+?)(?=(?:القاعدة|قاعدة العطر|الروائح البارزة|مواصفات|بلد المنشأ|العطار|---|$))/i);
  if (heM) heart = heM[1].replace(/[.\s]+$/, '').trim();

  const baM = fullText.match(/(?:القاعدة|قاعدة العطر)\s*[:：]?\s*([^:]+?)(?=(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة|مواصفات|بلد المنشأ|العطار|لماذا تختار|سعر|تسوق|---|$))/i);
  if (baM) base = baM[1].replace(/[.\s]+$/, '').trim();

  const prM = fullText.match(/(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة|المكونات البارزة|المكونـات الظاهـرة)\s*[:：]?\s*([^:]+?)(?=(?:مواصفات|بلد المنشأ|الفئة|الحجم|النوع|العطار|لماذا تختار|الخط العطري|متى تستخدم|سعر|تسوق|---|$))/i);
  if (prM) prominent = prM[1].replace(/[.\s]+$/, '').trim();

  const perM = fullText.match(/(?:العطار|الأنف العطري)\s*[:：]?\s*([^:]+?)(?=(?:مواصفات|بلد المنشأ|الفئة|الحجم|النوع|سعر|تسوق|لماذا تختار|---|$))/i);
  if (perM) perfumer = perM[1].replace(/[.\s]+$/, '').trim();

  return { opening, heart, base, prominent, perfumer };
}

// Translations mapping
const DICT = [
  [/فراولة/g, 'Strawberry'],
  [/تفاح أخضر/g, 'Green Apple'],
  [/تفاح/g, 'Apple'],
  [/قرفة/g, 'Cinnamon'],
  [/ريحان/g, 'Basil'],
  [/برتقال/g, 'Orange'],
  [/برغموت/g, 'Bergamot'],
  [/زنبق الوادي/g, 'Lily of the Valley'],
  [/يلانغ يلانغ|يلانج يلانج/g, 'Ylang-Ylang'],
  [/ورد تركي/g, 'Turkish Rose'],
  [/ورد قرطاجي/g, 'Carthaginian Rose'],
  [/ورد طائفي/g, 'Taif Rose'],
  [/ورد فواح/g, 'Fragrant Rose'],
  [/ورد/g, 'Rose'],
  [/قهوة/g, 'Coffee'],
  [/ياسمين راقي/g, 'Noble Jasmine'],
  [/ياسمين/g, 'Jasmine'],
  [/عنبر دافئ/g, 'Warm Amber'],
  [/عنبر جاف/g, 'Dry Amber'],
  [/عنبر/g, 'Amber'],
  [/خشب الصندل الأسترالي/g, 'Australian Sandalwood'],
  [/خشب الصندل/g, 'Sandalwood'],
  [/صندل كريمي/g, 'Creamy Sandalwood'],
  [/صندل/g, 'Sandalwood'],
  [/فانيليا مدغشقر/g, 'Madagascar Vanilla'],
  [/فانيليا/g, 'Vanilla'],
  [/فانيلا/g, 'Vanilla'],
  [/خشب الأرز الدافئ/g, 'Warm Cedarwood'],
  [/خشب الأرز/g, 'Cedarwood'],
  [/خشب الارز/g, 'Cedarwood'],
  [/أرز/g, 'Cedarwood'],
  [/مسك ملكي/g, 'Royal Musk'],
  [/مسك راقي/g, 'Prestige Musk'],
  [/مسك دافئ/g, 'Warm Musk'],
  [/مسك/g, 'Musk'],
  [/تونكا/g, 'Tonka Bean'],
  [/فول التونكا/g, 'Tonka Bean'],
  [/جريب فروت|قريب فروت/g, 'Grapefruit'],
  [/باتشولي/g, 'Patchouli'],
  [/عود وزعفران/g, 'Oud & Saffron'],
  [/عود فاخر/g, 'Royal Oud'],
  [/خشب العود/g, 'Agarwood (Oud)'],
  [/عود/g, 'Oud'],
  [/زعفران إسباني/g, 'Spanish Saffron'],
  [/زعفران فاخر/g, 'Precious Saffron'],
  [/زعفران/g, 'Saffron'],
  [/فلفل أسود/g, 'Black Pepper'],
  [/فلفل وردي/g, 'Pink Pepper'],
  [/فلفل حلو/g, 'Sweet Pimento'],
  [/ليمون/g, 'Lemon'],
  [/مكونات محمصة/g, 'Roasted Accords'],
  [/إبرة الراعي/g, 'Geranium'],
  [/خشب الغاياك/g, 'Guaiac Wood'],
  [/بنفسج/g, 'Violet'],
  [/أوراق البنفسج المصري/g, 'Egyptian Violet Leaves'],
  [/أوراق البنفسج/g, 'Violet Leaves'],
  [/جلد أبيض/g, 'White Leather'],
  [/جلود/g, 'Leather'],
  [/جلد/g, 'Leather'],
  [/نجيل الهند/g, 'Vetiver'],
  [/فتيفر/g, 'Vetiver'],
  [/زبدة السوسن/g, 'Iris Butter'],
  [/زبدة جذور السوسن/g, 'Orris Root Butter'],
  [/سوسن/g, 'Iris'],
  [/كراميل/g, 'Caramel'],
  [/خشب الكشمير/g, 'Cashmere Wood'],
  [/كشميران/g, 'Cashmeran'],
  [/خوخ ناضج/g, 'Ripe Peach'],
  [/خوخ/g, 'Peach'],
  [/توت العليق/g, 'Raspberry'],
  [/توت مثلج/g, 'Iced Berries'],
  [/توتيات حمراء|توت أحمر/g, 'Red Berries'],
  [/توت/g, 'Berries'],
  [/بخور/g, 'Incense'],
  [/شوكولاتة/g, 'Chocolate'],
  [/غزل البنات/g, 'Cotton Candy'],
  [/زهرة تيارا/g, 'Tiare Flower'],
  [/فواكه استوائية/g, 'Tropical Fruits'],
  [/فواكه مثلجة/g, 'Iced Fruits'],
  [/فواكه حمراء/g, 'Red Fruits'],
  [/فواكه/g, 'Fruits'],
  [/أناناس/g, 'Pineapple'],
  [/زهور بيضاء/g, 'White Flowers'],
  [/زهر البرتقال|زهرة البرتقال/g, 'Orange Blossom'],
  [/أخشاب الكشمير/g, 'Cashmere Woods'],
  [/أخشاب/g, 'Precious Woods'],
  [/ماندرين/g, 'Mandarin'],
  [/قرنفل/g, 'Clove'],
  [/غردينيا|قاردينيا/g, 'Gardenia'],
  [/فريق البحث والتطوير بغلاتي/g, 'Ghalati R&D Perfumers'],
  [/صنوبر/g, 'Pine'],
  [/كشمش أسود/g, 'Blackcurrant'],
  [/بخور مريم/g, 'Cyclamen'],
  [/نرجس/g, 'Narcissus'],
  [/بنزوين|جاوي|لبان جاوي/g, 'Benzoin'],
  [/مسك الروم/g, 'Tuberose'],
  [/قشر الزنجبيل/g, 'Ginger Zest'],
  [/زنجبيل/g, 'Ginger'],
  [/امبروكسان/g, 'Ambroxan'],
  [/يوسفي/g, 'Tangerine'],
  [/أوسمانثوس/g, 'Osmanthus'],
  [/أمورتال/g, 'Immortelle'],
  [/الامبريت المكثف/g, 'Intense Ambrette'],
  [/امبريت/g, 'Ambrette'],
  [/ميموزا/g, 'Mimosa'],
  [/لابندوم الاسباني|لابدانوم/g, 'Spanish Labdanum'],
  [/إكليل الجبل/g, 'Rosemary'],
  [/توليفة بحرية نظيفة/g, 'Clean Marine Breeze'],
  [/روائح بحرية/g, 'Marine Notes'],
  [/مائي/g, 'Aquatic Notes'],
  [/عشبي/g, 'Herbal Notes'],
  [/راوند/g, 'Rhubarb'],
  [/فريزيا/g, 'Freesia'],
  [/ألدهيد/g, 'Aldehydes'],
  [/كمثرى/g, 'Pear'],
  [/جوز الهند/g, 'Coconut'],
  [/عرعر/g, 'Juniper'],
  [/طحلب السنديان/g, 'Oakmoss'],
  [/فاكهة الباشن/g, 'Passion Fruit'],
  [/كركم/g, 'Turmeric'],
  [/مارشميلو|مارشملو/g, 'Marshmallow'],
  [/كوكتيل شمبانيا/g, 'Sparkling Champagne Accord'],
  [/كرز أسود/g, 'Black Cherry'],
  [/فاوانيا/g, 'Peony'],
  [/بندق/g, 'Hazelnut'],
  [/لبان بخوري|لبان/g, 'Frankincense'],
  [/سرو/g, 'Cypress'],
  [/بردقوش/g, 'Marjoram'],
  [/عبهر/g, 'Styrax'],
  [/سيبريول/g, 'Cypriol'],
  [/مريمية/g, 'Clary Sage'],
  [/جوزة الطيب/g, 'Nutmeg'],
  [/بيمنتو/g, 'Pimento'],
  [/سبايسي/g, 'Warm Spices'],
  [/توابل حارة/g, 'Spicy Accords'],
  [/توابل/g, 'Spices'],
  [/،/g, ','],
  [/و/g, '& ']
];

function translateNotes(arText) {
  if (!arText) return '';
  let en = arText;
  DICT.forEach(([regex, replacement]) => {
    en = en.replace(regex, replacement);
  });
  en = en.replace(/&amp;/g, '&')
         .replace(/[\u0600-\u06FF]/g, '')
         .replace(/\s*,\s*/g, ', ')
         .replace(/\s*&\s*/g, ', ')
         .replace(/,\s*,+/g, ', ')
         .replace(/^[, ]+|[, ]+$/g, '')
         .trim();
  return en;
}

let updatedCount = 0;

perfumes.forEach(p => {
  const item = scraped.find(s => s.id === p.id);
  const data = item?.parsed;
  if (!data) return;

  // Always update url to live verified URL if different
  if (item.url && item.url.includes('/p')) {
    p.url = item.url;
  }

  // 1. PERFUMES
  if (p.categoryType === 'perfume') {
    // Exact pyramid
    const pyr = extractFragrancePyramid(data.fullText);
    const opening = pyr.opening || data.opening;
    const heart = pyr.heart || data.heart;
    const base = pyr.base || data.base;
    const prominent = pyr.prominent || data.prominent;
    const perfumer = pyr.perfumer || data.perfumer;

    if (data.overview) {
      p.overview = data.overview;
    }
    if (opening) p.opening = opening;
    if (heart) p.heart = heart;
    if (base) p.base = base;
    if (prominent) p.prominent = prominent;

    p.specs = p.specs || {};
    if (data.origin) p.specs.origin = data.origin;
    if (data.category) p.specs.category = data.category;
    if (data.size) p.specs.size = data.size;
    if (data.type) p.specs.type = data.type;
    if (perfumer) p.specs.perfumer = perfumer;

    // English equivalents
    if (p.opening) p.openingEn = translateNotes(p.opening);
    if (p.heart) p.heartEn = translateNotes(p.heart);
    if (p.base) p.baseEn = translateNotes(p.base);
    if (p.prominent) p.prominentEn = translateNotes(p.prominent);

    p.specsEn = p.specsEn || {};
    p.specsEn.origin = 'Kingdom of Saudi Arabia';
    p.specsEn.category = p.specs.category === 'نسائي' ? 'Women' : (p.specs.category === 'رجالي' ? 'Men' : 'Unisex');
    p.specsEn.size = p.specs.size || '100 ml';
    p.specsEn.type = 'Eau De Parfum';
    if (perfumer) p.specsEn.perfumer = perfumer;

    updatedCount++;
  }
  // 2. BUNDLES
  else if (p.categoryType === 'bundle') {
    if (data.overview && data.overview.length > 20 && !data.overview.includes('لا توجد تفاصيل')) {
      p.overview = data.overview;
    }
    // Prominent notes or contents
    if (data.fullText && data.fullText.includes('تحتوي المجموعة على')) {
      const contentsMatch = data.fullText.match(/تحتوي المجموعة على\s*[:：]?\s*([^.]+)/);
      if (contentsMatch) {
        p.prominent = contentsMatch[1].trim();
        p.prominentEn = translateNotes(p.prominent);
      }
    }
    p.specs = p.specs || {};
    p.specs.origin = 'المملكة العربية السعودية';
    p.specs.category = 'للجنسين';
    p.specs.size = 'مجموعة متكاملة فاخرة';
    p.specs.type = 'باقة إهداء فاخرة';

    p.specsEn = p.specsEn || {};
    p.specsEn.origin = 'Kingdom of Saudi Arabia';
    p.specsEn.category = 'Unisex';
    p.specsEn.size = 'Luxury Complete Collection';
    p.specsEn.type = 'Exclusive Gift Set';

    updatedCount++;
  }
  // 3. BAKHOOR
  else if (p.categoryType === 'bakhoor') {
    if (data.overview && data.overview.length > 20 && !data.overview.includes('لا توجد تفاصيل')) {
      p.overview = data.overview;
    }
    p.specs = p.specs || {};
    p.specs.origin = 'المملكة العربية السعودية';
    p.specs.category = 'للجنسين';
    if (data.fullText && data.fullText.includes('45 جرام')) p.specs.size = '45 جرام';
    else if (data.fullText && data.fullText.includes('120 جرام')) p.specs.size = '120 جرام';
    else p.specs.size = p.specs.size || '45 جرام';
    p.specs.type = p.title.includes('معمول') ? 'معمول بخور شرقي فاخر' : 'بخور ملكي فاخر';

    p.specsEn = p.specsEn || {};
    p.specsEn.origin = 'Kingdom of Saudi Arabia';
    p.specsEn.category = 'Unisex';
    p.specsEn.size = p.specs.size;
    p.specsEn.type = p.title.includes('معمول') ? 'Luxury Oriental Mamool' : 'Royal Fragrant Bakhoor';

    updatedCount++;
  }
  // 4. OILS
  else if (p.categoryType === 'oil') {
    // Ensure accurate official specs
    p.specs = p.specs || {};
    p.specs.origin = 'المملكة العربية السعودية';
    p.specs.category = 'للجنسين';
    p.specs.size = '15 مل (تولة كاملة)';
    p.specs.type = 'زيت عطري مركز نقي';

    p.specsEn = p.specsEn || {};
    p.specsEn.origin = 'Kingdom of Saudi Arabia';
    p.specsEn.category = 'Unisex';
    p.specsEn.size = '15 ml (Pure Concentrated Tola)';
    p.specsEn.type = 'Pure Concentrated Perfume Oil';

    updatedCount++;
  }
});

// Save updated catalog
fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
console.log(`Successfully synced and updated ${updatedCount} products in public/data/perfumes.json!`);
