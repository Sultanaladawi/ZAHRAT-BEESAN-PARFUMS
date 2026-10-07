const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const perfumesFile = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
const rawOilsFile = path.join(__dirname, '..', 'data', 'ghalati_perfume_oils_raw.json');
const rawOils = JSON.parse(fs.readFileSync(rawOilsFile, 'utf8'));

// Slugify helper
function makeSlug(name) {
  const map = {
    'توم فورد عود وود': 'oil-tom-ford-oud-wood',
    'عود سيوفي': 'oil-oud-sayoufi',
    'مسك مبخر': 'oil-musk-mubakhar',
    'علياء': 'oil-alyaa',
    'زهور الربيع': 'oil-zuhour-alrabeea',
    'روزيتا': 'oil-rosetta',
    'مشاعر': 'oil-mashaer',
    'روز فانيلا مونتال': 'oil-rose-vanilla-montale',
    'مهجة': 'oil-muhjah',
    'غالية': 'oil-ghalyah',
    'سكون': 'oil-sukoon',
    'عود فانيلا': 'oil-oud-vanilla',
    'مسك ابيض متسلق': 'oil-musk-abyad-moutsaleq',
    'مخلط نجد الذهبي': 'oil-mukhallat-najd-aldhahabi',
    'ليمون هاسك': 'oil-lemon-hask',
    'روز هارت': 'oil-rose-heart',
    'مسك التوت': 'oil-musk-altoot',
    'بليفير': 'oil-believer',
    'سويت مسك': 'oil-sweet-musk',
    'مسك الرمان': 'oil-musk-alrumman',
    'بنك مسك': 'oil-pink-musk',
    'طيف الامارات': 'oil-tayf-alemarat'
  };
  return map[name.trim()] || `oil-${name.trim().replace(/\s+/g, '-')}`;
}

const oilDetails = {
  'oil-tom-ford-oud-wood': {
    titleEn: 'Tom Ford Oud Wood Perfume Oil (15ml)',
    overview: 'زيت عطري شرقي مستوحى من نوتات خشب العود الأيقونية مع الهيل وخشب الصندل في قارورة مذهبة 15 مل بتركيز زيت عطري نقي وعالي الثبات.',
    opening: 'هيل، فلفل وردي، وأخشاب الورد',
    heart: 'خشب العود النادر، خشب الصندل، ونجيل الهند',
    base: 'حبوب التونكا، فانيليا، وعنبر دافئ',
    prominent: 'خشب العود والهيل وخشب الصندل'
  },
  'oil-oud-sayoufi': {
    titleEn: 'Oud Sayoufi Pure Oil (15ml)',
    overview: 'دهن عود سيوفي معتق ذو طابع خشبي تراثي ثقيل يفوح برائحة الأصالة والهيبة العربية المعتمدة للمجالس والمناسبات.',
    opening: 'دهن عود سيوفي خالص',
    heart: 'أخشاب ثمينة وراتنجات العود العتيقة',
    base: 'مسك خام وعنبر أصيل',
    prominent: 'دهن العود السيوفي المعتق'
  },
  'oil-musk-mubakhar': {
    titleEn: 'Steamed Musk Perfume Oil (15ml)',
    overview: 'توليفة ساحرة تجمع بين نقاء المسك الأبيض ونفحات البخور الملكي المبخر ليمنحك هالة نقية تدوم طوال اليوم.',
    opening: 'مسك أبيض صافي ونفحات بخور ناعمة',
    heart: 'زهور بيضاء وخشب الصندل',
    base: 'عنبر أبيض ومسك بودري',
    prominent: 'المسك الأبيض والبخور المبخر'
  },
  'oil-alyaa': {
    titleEn: 'Alyaa Pure Perfume Oil (15ml)',
    overview: 'زيت عطري نسائي مفعم بالأنوثة والرقة يجمع بين عبير الورود النضرة ولمسات السكر البودري والمسك الصافي.',
    opening: 'ورود جورجية وبرغموت ناعم',
    heart: 'زهور الفاوانيا وياسمين',
    base: 'مسك نقي وفانيليا ناعمة',
    prominent: 'الورود والمسك النقي'
  },
  'oil-zuhour-alrabeea': {
    titleEn: 'Spring Flowers Perfume Oil (15ml)',
    overview: 'باقة من أزهار الربيع المتفتحة ممزوجة بقطرات الندى والمسك، تمنح إحساساً دائماً بالانتعاش والحيوية والبهجة.',
    opening: 'أزهار البنفسج وزنبق الوادي',
    heart: 'ياسمين مائي وفاوانيا',
    base: 'مسك نقي وأخشاب خفيفة',
    prominent: 'أزهار الربيع وزنبق الوادي'
  },
  'oil-rosetta': {
    titleEn: 'Rosetta Pure Perfume Oil (15ml)',
    overview: 'توليفة زهرية ساحرة مستوحاة من رقة الورد الدمشقي مع العنبر ولمسات الفواكه الحلوة.',
    opening: 'ورد دمشقي وكمثرى حلوة',
    heart: 'أزهار بيضاء ومسك الفراولة',
    base: 'عنبر دافئ وخشب الصندل',
    prominent: 'الورد الدمشقي والعنبر'
  },
  'oil-mashaer': {
    titleEn: 'Mashaer Royal Oil (15ml)',
    overview: 'زيت عطري يعبر عن أرقى المشاعر الشرقية بمزيج متوازن بين العود الهادئ والزهور والتوابل العطرية الدافئة.',
    opening: 'زعفران أحمر وهيل',
    heart: 'ورد شرقي وخشب الصندل',
    base: 'عود ناعم ومسك عنبري',
    prominent: 'الزعفران والعود الناعم'
  },
  'oil-rose-vanilla-montale': {
    titleEn: 'Rose Vanilla Montale Style Oil (15ml)',
    overview: 'مزيج فاخر وأيقوني مستوحى من روز فانيلا المشهور، يجمع بين عبير الورد الفواح والفانيليا الكريمية الحلوة مع السكر والمسك.',
    opening: 'ليمون كالأبري وورد سكري',
    heart: 'ورد فرنسي وياسمين',
    base: 'فانيليا مدغشقر، مسك أبيض، وخشب الأرز',
    prominent: 'الورد السكري وفانيليا مدغشقر'
  },
  'oil-muhjah': {
    titleEn: 'Muhjah Pure Perfume Oil (15ml)',
    overview: 'زيت عطري راقي ذو نفحات مريحة تجمع بين اللافندر النقي والمسك والأخشاب العطرية لتهدئة الحواس.',
    opening: 'لافندر نقي وبرغموت',
    heart: 'زهور البابونج وخشب الأرز',
    base: 'مسك هادئ وفانيليا خفيفة',
    prominent: 'اللافندر والمسك الهادئ'
  },
  'oil-ghalyah': {
    titleEn: 'Ghalyah Luxury Perfume Oil (15ml)',
    overview: 'دهن عطري فاخر باسم الدار يعبر عن المكانة الرفيعة بمزيج من الزعفران والعود والعنبر الملكي.',
    opening: 'زعفران ملكي وتوابل شرقية',
    heart: 'عود فاخر وخشب الصندل',
    base: 'عنبر أصيل ومسك خالص',
    prominent: 'الزعفران الملكي ودهن العود'
  },
  'oil-sukoon': {
    titleEn: 'Sukoon Calming Perfume Oil (15ml)',
    overview: 'زيت عطري ينضح بالهدوء والسكينة مع نوتات البودرة والمسك الأبيض والزهور الخفيفة المهدئة للنفس.',
    opening: 'نوتات بودرية ولمسات برغموت خفيفة',
    heart: 'سوسن أبيض وياسمين ناعم',
    base: 'مسك الطهارة وخشب الصندل',
    prominent: 'النوتات البودرية ومسك الطهارة'
  },
  'oil-oud-vanilla': {
    titleEn: 'Oud Vanilla Perfume Oil (15ml)',
    overview: 'تزاوج ساحر بين دفء خشب العود الشرقي وحلاوة الفانيليا الغنية، يخلق توازناً استثنائياً بين الجرأة والنعومة.',
    opening: 'برغموت وفلفل أسود ناعم',
    heart: 'خشب العود وزهور الفانيليا',
    base: 'فانيليا غنية، حبوب التونكا، وعنبر',
    prominent: 'خشب العود والفانيليا الغنية'
  },
  'oil-musk-abyad-moutsaleq': {
    titleEn: 'White Climbing Musk Oil (15ml)',
    overview: 'المسك الأبيض المتسلق الشهير بنقائه العالي وبرودته الصيفية المنعشة، يعطيك ثباتاً ناصعاً يدوم لساعات طويلة.',
    opening: 'مسك أبيض بارد ونفحات مائية',
    heart: 'زهور السوسن والياسمين الأبيض',
    base: 'مسك نقي وبودرة أطفال فاخرة',
    prominent: 'المسك الأبيض البارد والسوسن'
  },
  'oil-mukhallat-najd-aldhahabi': {
    titleEn: 'Mukhallat Najd Gold Oil (15ml)',
    overview: 'مخلط نجد الذهبي التراثي الفاخر المستوحى من كرم وأصالة نجد، يجمع بين دهن العود والصندل والورد والعنبر.',
    opening: 'ورد طائفي وزعفران ذهبي',
    heart: 'دهن عود كمبودي وخشب الصندل',
    base: 'عنبر أشهب ومسك الغزال',
    prominent: 'الورد الطائفي والعود الكمبودي'
  },
  'oil-lemon-hask': {
    titleEn: 'Lemon Husk Fresh Perfume Oil (15ml)',
    overview: 'جرعة عالية من الانتعاش الصيفي تجمع بين قشور الليمون الإيطالي والأعشاب الخضراء والمسك البارد.',
    opening: 'قشور الليمون، برغموت، ونعناع',
    heart: 'زهور ليمون وشاي أخضر',
    base: 'مسك بارد وأخشاب بيضاء',
    prominent: 'قشور الليمون والمسك البارد'
  },
  'oil-rose-heart': {
    titleEn: 'Rose Heart Perfume Oil (15ml)',
    overview: 'قلب الورد الجوري الملكي المقطر بعناية ليعطيك رائحة نقية تمثل أرقى درجات الأناقة والجاذبية الوردية.',
    opening: 'ورد جوري وبتلات الورد التركي',
    heart: 'ورد مايو وزهر البرتقال',
    base: 'مسك وردي وعنبر خفيف',
    prominent: 'الورد الجوري والورد التركي'
  },
  'oil-musk-altoot': {
    titleEn: 'Berry Musk Perfume Oil (15ml)',
    overview: 'توليفة لذيذة تجمع بين حلاوة التوت البري المنعش ونقاء المسك الأبيض، يعطي إحساساً فاكهياً حلواً ومبهجاً.',
    opening: 'توت بري، فراولة، وتوت العليق',
    heart: 'زهور الكرز وياسمين ناعم',
    base: 'مسك أبيض وفانيليا سكرية',
    prominent: 'التوت البري والمسك الأبيض'
  },
  'oil-believer': {
    titleEn: 'Believer Pure Perfume Oil (15ml)',
    overview: 'زيت عطري ملهم وجذاب يمزج بين نفحات الحمضيات المتألقة والتوابل الدافئة والأخشاب العطرية العميقة.',
    opening: 'جريب فروت وتوابل منعشة',
    heart: 'أخشاب الأرز وجوزة الطيب',
    base: 'باتشولي، نجيل الهند، ومسك',
    prominent: 'الجريب فروت وخشب الأرز'
  },
  'oil-sweet-musk': {
    titleEn: 'Sweet Musk Perfume Oil (15ml)',
    overview: 'مسك سكري حلو وناعم يلفك بهالة مخملية من الدفء والجاذبية مع لمسات كراميل وفانيليا ناعمة.',
    opening: 'سكر مكرمل ومسك أبيض',
    heart: 'فانيليا ناعمة وزهر اللوز',
    base: 'مسك بودري وحبوب التونكا',
    prominent: 'السكر المكرمل والمسك البودري'
  },
  'oil-musk-alrumman': {
    titleEn: 'Pomegranate Musk Perfume Oil (15ml)',
    overview: 'الأكثر طلباً وشهرة! مسك الرمان المنعش بنكهته الفاكهية اللذيذة ورائحته الصيفية التي تأسر القلوب وتدوم طويلاً.',
    opening: 'رمان ياقوتي ونفحات عنب أحمر',
    heart: 'مسك أبيض نقي وزهور فواكه',
    base: 'مسك بودري وعنبر خفيف',
    prominent: 'الرمان الياقوتي والمسك الأبيض'
  },
  'oil-pink-musk': {
    titleEn: 'Pink Musk Perfume Oil (15ml)',
    overview: 'مسك وردي ناعم يفيض بالرقة والأنوثة مع لمسات من أزهار الكرز والبودرة المخملية.',
    opening: 'أزهار الكرز وتوت أحمر',
    heart: 'مسك وردي وبتلات الفاوانيا',
    base: 'فانيليا بيضاء ومسك نقي',
    prominent: 'أزهار الكرز والمسك الوردي'
  },
  'oil-tayf-alemarat': {
    titleEn: 'Tayf Al Emarat Perfume Oil (15ml)',
    overview: 'زيت عطري شرقي فاخر بعبير العود الملكي والزعفران والعنبر، يعكس كرم وضيافة وفخامة البيت الإماراتي.',
    opening: 'زعفران وهيل إماراتي',
    heart: 'دهن عود فاخر وخشب الصندل',
    base: 'عنبر دافئ ومسك أصيل',
    prominent: 'دهن العود والزعفران'
  }
};

async function processAllOils() {
  console.log(`Processing Batch 4: ${rawOils.length} Perfume Oils (Tolas 15ml)...`);
  const existingProducts = JSON.parse(fs.readFileSync(perfumesFile, 'utf8'));

  for (const item of rawOils) {
    const slug = makeSlug(item.name);
    const details = oilDetails[slug] || {
      titleEn: `${item.name} Perfume Oil (15ml)`,
      overview: 'زيت عطري مركز فاخر من دار غلاتي سعة 15 مل بتركيز عالٍ وثبات استثنائي.',
      opening: 'زيوت عطرية مركزة',
      heart: 'نوتات عطرية فاخرة',
      base: 'مسك وعنبر',
      prominent: item.name
    };

    console.log(`\n--- [${slug}] ${item.name} ---`);
    const outShowcaseJpg = path.join(__dirname, '..', 'public', 'images', `ghalati_${slug}.jpg`);
    const outOriginalPng = path.join(__dirname, '..', 'public', 'images', `original_${slug}.png`);

    console.log(`Downloading ${item.originalImage}...`);
    const res = await fetch(item.originalImage, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const imgBuf = Buffer.from(await res.arrayBuffer());

    // 1. Save original
    await sharp(imgBuf).png().toFile(outOriginalPng);

    // 2. Save pristine 1024x1024 studio showcase
    await sharp(imgBuf)
      .resize(1024, 1024, { fit: 'contain', background: '#f5f4f0' })
      .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
      .toFile(outShowcaseJpg);

    console.log(`✓ Showcase created: ${outShowcaseJpg}`);

    // 3. Prepare product object
    const sarNum = parseFloat(item.sarPrice) || 30;
    const baseJod = Math.round(sarNum / 5.29); // 6 JOD
    const finalJod = baseJod + 12; // 18 JOD

    const prodObj = {
      id: slug,
      title: `تولة ${item.name} (15 مل)`,
      titleEn: details.titleEn,
      brand: 'دار غلاتي (Ghalati)',
      categoryType: 'oil',
      sarPrice: sarNum,
      baseJod: baseJod,
      finalJod: finalJod,
      url: item.url,
      bottleUrl: item.originalImage,
      overview: details.overview,
      opening: details.opening,
      heart: details.heart,
      base: details.base,
      prominent: details.prominent,
      specs: {
        origin: 'المملكة العربية السعودية',
        category: 'للجنسين',
        size: '15 مل تولة فاخرة',
        type: 'زيت عطري مركز نقي'
      },
      image: `images/ghalati_${slug}.jpg`,
      originalImage: `images/original_${slug}.png`,
      galleryImages: [item.originalImage]
    };

    const idx = existingProducts.findIndex(p => p.id === slug);
    if (idx >= 0) existingProducts[idx] = prodObj;
    else existingProducts.push(prodObj);
  }

  fs.writeFileSync(perfumesFile, JSON.stringify(existingProducts, null, 2), 'utf8');
  console.log(`\n🎉 Successfully processed Batch 4! Total products in catalog now: ${existingProducts.length}`);
}

processAllOils().catch(console.error);
