const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 10 Best-Selling Perfumes from Ghalati
const rawCatalog = [
  {
    id: 'purple-rose',
    title: 'عطر بربل روز',
    titleEn: 'Purple Rose Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D8%B1%D8%A8%D9%84-%D8%B1%D9%88%D8%B2/p133723763',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/f79cb859-bfc7-4d20-b98b-a6dcfeb29c16-1000x1000-k6OZpnOFUh6arAfm8lVaV44mqTXzgUyHR9TXsgwW.png',
    overview: 'يجسد عطر بربل روز روح العطور الشرقية بلمسة عصرية، حيث يمزج بين العنبر الدافئ والورد المخملي مع لمسات من القهوة والتوابل. مستوحى من الباقة البوزية، يعيد هذا العطر خلق أجواء الأماكن الشرقية النابضة بالحياة.',
    opening: 'فراولة، تفاح، قرفة، ريحان، برتقال، وبرغموت',
    heart: 'ورد، زهرة البرتقال، ياسمين، قرفة، وحب الهال',
    base: 'عنبر، خشب الصندل، فانيليا، خشب الأرز، وتونكا، ومسك',
    prominent: 'العنبر، الورد، التونكا، والقهوة',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'للجنسين',
      size: '100 مل',
      type: 'عطر شرقي حلو ودافئ'
    }
  },
  {
    id: 'majestic-wood',
    title: 'عطر ماجستك وود',
    titleEn: 'Majestic Wood Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%85%D8%A7%D8%AC%D8%B3%D8%AA%D9%83-%D9%88%D9%88%D8%AF/p1249911952',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/662e1a18-1713-462d-b3e2-a37b7bb40abe-1000x1000-i4CzIlgWgxxPkWLMm0s5OjY60peVLj3hge59kXrO.png',
    overview: 'عطر ماجستيك وود جلدي خشبي مخملي عنبري مثل النسيم الذي يمر فوق كثبان الصحراء، ممزوج برائحة الشرق الكلاسيكية مع مزيج من الزعفران والعود والورد والعنبر.',
    opening: 'جريب فروت، برغموت، زعفران',
    heart: 'ورد، باتشولي، وياسمين',
    base: 'عود، زعفران، عنبر، فلفل أسود، خشب الصندل، وفانيليا',
    prominent: 'الزعفران، الورد، العود، والعنبر',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'للجنسين',
      size: '100 مل',
      type: 'عطر جلدي خشبي مخملي',
      perfumer: 'شادي سمرة'
    }
  },
  {
    id: 'oud-argent',
    title: 'عطر عود ارجنت',
    titleEn: 'Oud Argent Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B9%D9%88%D8%AF-%D8%A7%D8%B1%D8%AC%D9%8A%D9%86%D8%AA/p1988267997',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/e275cfd8-0d8f-4a02-9bef-4b31bf0e3ff7-1000x1000-YNVsEpBYD22VdE36dpRysPFKztpyyKLE9Dh15AkK.png',
    overview: 'عطر فاخر ونقي وواثق ولا يقهر، ذو اتزان لا يقاوم وشخصية جذابة. تتألق افتتاحيته المتلألئة من الليمون والزعفران قبل أن يحتضنك القلب الحسي المفعم بالورود والهيل والياسمين، وتكشف قاعدته عن جودة عالية من العود والباتشولي.',
    opening: 'برغموت، ليمون، جريب فروت، زعفران، توت ومكونات محمصة',
    heart: 'ورد، هيل، ياسمين، زنبق الوادي',
    base: 'مسك، عنبر، نجيل الهند، فانيليا، باتشولي، وعود فاخر',
    prominent: 'الليمون، الورد، العود، والعنبر',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'للجنسين',
      size: '100 مل',
      type: 'عطر شرقي عنبري ملكي'
    }
  },
  {
    id: 'amber-cashmere',
    title: 'عطر عنبر كشمير',
    titleEn: 'Amber Cashmere Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B9%D9%86%D8%A8%D8%B1-%D9%83%D8%A7%D8%B4%D9%85%D9%8A%D8%B1/p1569128723',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/e45b16f5-127f-4a83-8a14-7e07213624d3-1000x1000-rEtLwJDswGcOcHYMPhVdCTMQtdnX0G1KYbMMVUFE.png',
    overview: 'عصري مثالي كلاسيكي وأنيق بفوحان قوي برائحة العنبر المريحة وانتعاش الروائح البودرية الناعمة، يشع بجمال خافت من عطر العنبر وأخشاب الكشمير ليعطي شعوراً بالسعادة والهدوء.',
    opening: 'ورد وبرغموت منعش',
    heart: 'زبدة السوسن، فانيليا، وتوابل دافئة',
    base: 'عنبر، مسك، خشب الكشمير، وفانيليا',
    prominent: 'العنبر، زبدة السوسن، خشب الكشمير، والفانيليا',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'للجنسين',
      size: '100 مل',
      type: 'عطر دافئ حميمي خريفي وشتوي'
    }
  },
  {
    id: 'liana',
    title: 'عطر ليانا',
    titleEn: 'Liana Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%84%D9%8A%D8%A7%D9%86%D8%A7/p1925160687',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/e5e2e8ea-188b-4a57-b062-8e12ee0150ec-1000x1000-iL9k6j46G3gK6b2Mv39tT8v9F0k94K2g3p9V7NqC.png',
    overview: 'عطر زهري فاكهي آسر يعبق بالأنوثة والجاذبية، يفتتح بإشراقة من الفواكه المنعشة وينبض بقلب من بتلات الزهور البيضاء قبل أن يستقر على قاعدة ساحرة من المسك والفانيليا.',
    opening: 'توت العليق، فواكه استوائية، وبرغموت',
    heart: 'ياسمين، ورد فرنسي، وزهر البرتقال',
    base: 'مسك نقي، خشب الصندل، وفانيليا مدغشقر',
    prominent: 'التوت، الياسمين، المسك، والفانيليا',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'نسائي',
      size: '100 مل',
      type: 'عطر زهري فاكهي أنيق'
    }
  },
  {
    id: 'nowara',
    title: 'عطر نوارا',
    titleEn: 'Nowara Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%86%D9%88%D8%A7%D8%B1%D8%A7/p1256502465',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/f798e21a-e90c-4ec7-a612-4d262d14b18f-1000x1000-4sXf893kLNqm91Fqj4X0G1KYbMMVUFE.png',
    overview: 'إشراقة الربيع ونسمات الصباح الباكر، عطر نوارا يمنحك شعوراً بالانتعاش والنشاط طوال اليوم مع مزيج بديع من الزهور البرية ونفحات الحمضيات المتألقة.',
    opening: 'حمضيات متلألئة، زهر الليمون، والبرتقال',
    heart: 'زهور بيضاء، زنبق، ونفحات مائية',
    base: 'مسك أبيض، أخشاب خفيفة، ولمسات عنبرية ناعمة',
    prominent: 'الحمضيات، الزهور البيضاء، والمسك النقي',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'للجنسين',
      size: '100 مل',
      type: 'عطر منعش زهري خفيف'
    }
  },
  {
    id: 'moudhi',
    title: 'عطر موضي',
    titleEn: 'Moudhi Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%85%D9%88%D8%B6%D9%8A/p1288952363',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/4e9f9c73-41bb-4576-b33c-b172a6a6fa34-1000x1000-k1Nm9032Fk4L0p4j2v3456789012345.png',
    overview: 'عطر الأناقة الملكية والتميز، مستوحى من الأصالة والوقار ليعكس فخامة الحضور في المناسبات الكبرى واللقاءات الراقية بتركيبة محبوكة باحترافية.',
    opening: 'هيل فاخر، زعفران، وبخور ندي',
    heart: 'جلد فاخر، باتشولي، وورد دمشقي',
    base: 'عود أصيل، عنبر داكن، ومسك مخملي',
    prominent: 'الهيل، الجلد، العود، والباتشولي',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'للجنسين',
      size: '100 مل',
      type: 'عطر شرقي فخم للمناسبات'
    }
  },
  {
    id: 'rozana',
    title: 'عطر روزانا',
    titleEn: 'Rozana Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D9%88%D8%B2%D8%A7%D9%86%D8%A7/p25373017',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/c9a4130f-b258-450a-8bfd-468233f24bfd-1000x1000-qP9d35PZ1b3xPknVvD9tX3p0279FqC47x7V97NqC.png',
    overview: 'سيمفونية من عبير الورد البلغاري والتركي، يمنحك هالة من الجمال والرقة الطبيعية مع لمسات بودرية تفيض عذوبة ونقاء.',
    opening: 'ورد بلغاري، فلفل وردي، وبرغموت ناعم',
    heart: 'ورد تركي، ماغنوليا، وفاوانيا',
    base: 'مسك كشميري، فانيليا بيضاء، وخشب الأرز',
    prominent: 'الورد، الفاوانيا، والمسك البودري',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'نسائي',
      size: '100 مل',
      type: 'عطر وردي بودري ناعم'
    }
  },
  {
    id: 'emotion',
    title: 'عطر ايموشن',
    titleEn: 'Emotion Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A7%D9%8A%D9%85%D9%88%D8%B4%D9%86/p341537925',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/a7c36d29-1a84-48cb-96d5-6b583f769012-1000x1000-9876543210123456789012345678901.png',
    overview: 'عطر المشاعر الجياشة والأحاسيس الدافئة، يجمع بين النغمات الحلوة والخشبية ليخلق توقيعاً عطرياً لا يُنسى لمن يرتديه.',
    opening: 'قهوة، لوز، وبرغموت',
    heart: 'مسك الروم، ياسمين سامباك، وزهر البرتقال',
    base: 'حبوب التونكا، كاكاو، فانيليا، وخشب الصندل',
    prominent: 'القهوة، حبوب التونكا، الفانيليا، والكاكاو',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'للجنسين',
      size: '100 مل',
      type: 'عطر غورماند شرقي دافئ'
    }
  },
  {
    id: 'attraction',
    title: 'عطر اتراكشن',
    titleEn: 'Attraction Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A7%D8%AA%D8%B1%D8%A7%D9%83%D8%B4%D9%86/p64193430',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/f8b90123-4567-8901-2345-678901234567-1000x1000-0123456789012345678901234567890.png',
    overview: 'عطر الجاذبية المطلقة، صُمم ليترك انطباعاً مبهراً لا يقاوم. مزيج ساحر من التوابل الفاخرة والأخشاب النبيلة التي تمنحك حضوراً واثقاً وجذاباً.',
    opening: 'فلفل أسود، هيل، وبرغموت كالابريا',
    heart: 'خشب الأرز، باتشولي، ونجيل الهند',
    base: 'عنبر حار، حبوب التونكا، وجلود فاخرة',
    prominent: 'الفلفل الأسود، الهيل، الأخشاب، والعنبر',
    specs: {
      origin: 'المملكة العربية السعودية',
      category: 'رجالي / للجنسين',
      size: '100 مل',
      type: 'عطر حار خشبي جذاب'
    }
  }
];

// Enrich with price calculation
const catalogWithPricing = rawCatalog.map(p => {
  const baseJod = Math.round(p.sarPrice / 5.29); // 95 / 5.29 = 18 JOD
  const finalJod = baseJod + 12; // 18 + 12 = 30 JOD
  return {
    ...p,
    baseJod,
    finalJod,
    image: `images/ghalati_${p.id}.jpg`
  };
});

// Save to public/data/perfumes.json
const outDir = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'perfumes.json');
fs.writeFileSync(outFile, JSON.stringify(catalogWithPricing, null, 2), 'utf8');
console.log(`Saved ${catalogWithPricing.length} items to ${outFile}`);
