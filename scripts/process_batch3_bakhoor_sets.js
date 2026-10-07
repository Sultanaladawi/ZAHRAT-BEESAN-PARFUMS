const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');

const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const perfumesFile = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');

// Clean neutral shadow for jars
async function cleanJarShadow(imgBuf, isCylindrical = false) {
  const { data, info } = await sharp(imgBuf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] === 0) continue;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      const bright = (r + g + b) / 3;

      // Clean side/wall studio shadow
      if (x < w * 0.44 && diff <= 14 && bright >= 70) {
        data[idx + 3] = 0;
      }
      // Clean bottom contact shadow artifact outside actual jar base
      if (y > h * 0.86 && diff <= 12 && bright >= 60 && (x < w * 0.6 || x > w * 0.75)) {
        data[idx + 3] = 0;
      }
    }
  }

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  return await sharp(cleaned).trim().png().toBuffer();
}

async function compositeJar(jarPngBuf, outJpgPath, targetH = 460) {
  const resized = await sharp(jarPngBuf).resize({ height: targetH, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 70;
  const shadowSvg = `
  <svg width="${shadowW}" height="34" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4.2" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="17" rx="${bW * 0.44}" ry="9" fill="#18110b" opacity="0.62" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="17" rx="${bW * 0.30}" ry="4.5" fill="#080503" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 35), top: baseContactY - 17 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(outJpgPath);
}

// For box sets / dioramas: fit inside luxury 1024x1024 canvas with elegant neutral studio background
async function processDioramaSet(buf, outJpgPath) {
  const img = sharp(buf);
  const meta = await img.metadata();
  
  // Create square canvas with soft luxury gradient matching studio lighting
  await sharp(buf)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 246, g: 244, b: 240, alpha: 1 }
    })
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(outJpgPath);
}

const batch3Items = [
  // ── 1. باقات الإهداء والمجموعات الفاخرة (من لقطة الشاشة 1) ──
  {
    id: 'bundle-musk-collection',
    name: 'باقة عطور المسك',
    title: 'باقة عطور المسك الفاخرة',
    titleEn: 'Musk Collection Luxury Bundle',
    type: 'diorama',
    categoryType: 'bundle',
    sarPrice: 199,
    url: 'https://ghalati.com/ar/%D8%A8%D8%A7%D9%82%D8%A9-%D8%B9%D8%B7%D9%88%D8%B1-%D8%A7%D9%84%D9%85%D8%B3%D9%83/p342037118',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/JeOrcZXS1lcHRPFTGpyaAStiaoypmlUKOvq0T79k.png',
    overview: 'امنح نفسك لمسة من الفخامة الملكية مع باقة عطور المسك المتميزة، التي تضم 4 قوارير من أرقى أنواع المسك الطبيعي المنعش، مصممة لعشاق النقاء والفوحان الآسر.',
    opening: 'برغموت منعش، فلفل وردي، ونفحات حمضية نقية',
    heart: 'فريزيا بيضاء، يلانغ يلانغ مدغشقر، وزبدة السوسن الملكية',
    base: 'مسك نقي، عنبر أبيض، وفانيليا كريمية هادئة',
    prominent: 'المسك الأبيض، زبدة السوسن، والبرغموت',
    specs: { origin: 'المملكة العربية السعودية', category: 'للجنسين', size: '4 قوارير × 50 مل', type: 'باقة عطور مسك فاخرة' }
  },
  {
    id: 'set-varna',
    name: 'مجموعة فارنا',
    title: 'مجموعة فارنا الملكية الفاخرة',
    titleEn: 'Varna Royal Gift Set',
    type: 'diorama',
    categoryType: 'bundle',
    sarPrice: 197,
    url: 'https://ghalati.com/ar/%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A9-%D9%81%D8%A7%D8%B1%D9%86%D8%A7/p241161755',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/Tax3VP8v86Aut7K3gfJIGDnNHIpk94BnyDqhU69m.png',
    overview: 'مجموعة صُممت لتليق بأفخم المناسبات ولتعبر عن حضورك الملكي بامتياز. تحتوي على عطر فارنا الملكي سعة 100 مل مع بخور فارنا الفاخر 45 جرام داخل علبة إهداء مبطنة.',
    opening: 'هيل فاخر، زعفران أحمر، وبرغموت إيطالي',
    heart: 'جلد فاخر، لافندر نقي، وأخشاب الأرز',
    base: 'عود ملكي، عنبر دافئ، ونجيل الهند',
    prominent: 'عطر فارنا الملكي وبخور فارنا الفاخر',
    specs: { origin: 'المملكة العربية السعودية', category: 'رجالي / للجنسين', size: 'عطر 100 مل + بخور 45 جم', type: 'طقم إهداء ملكي متكامل' }
  },
  {
    id: 'bundle-altarikh',
    name: 'باقة التاريخ',
    title: 'باقة التاريخ التراثية',
    titleEn: 'The History Heritage Bundle',
    type: 'diorama',
    categoryType: 'bundle',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%A8%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D8%AA%D8%A7%D8%B1%D9%8A%D8%AE/p1575237133',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/JfLJAoxscHA0WqVIKJlR9eZAhOURfNvXI1RY7mAb.jpg',
    overview: 'تشكيلة مذهلة من العطور التي تجسد تاريخ وعراقة الجزيرة العربية عبر 4 عطور تاريخية مستوحاة من أهم المحطات والأعوام الخالدة (1727، 1932، 1981، 2016).',
    opening: 'نفحات خشبية، توابل دافئة، وحمضيات نضرة',
    heart: 'لبان، ورد طائفي، وجلد شرقي',
    base: 'أخشاب العود، عنبر كلاسيكي، ومسك أصيل',
    prominent: 'عطور الأعوام التراثية الأربعة',
    specs: { origin: 'المملكة العربية السعودية', category: 'للجنسين', size: '4 قوارير عطور تراثية', type: 'مجموعة تراثية خالدة' }
  },
  {
    id: 'set-alfakhamah',
    name: 'مجموعة الفخامة',
    title: 'مجموعة الفخامة الملكية',
    titleEn: 'Al Fakhamah Luxury Gift Box',
    type: 'diorama',
    categoryType: 'bundle',
    sarPrice: 211,
    url: 'https://ghalati.com/ar/%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A9-%D8%A7%D9%84%D9%81%D8%AE%D8%A7%D9%85%D8%A9/p1867218307',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/jJqLdfFa1vPRoTsX2r8EmZFSwRIBqg48rWcNd2U8.png',
    overview: 'بوكس الفخامة الملكي يجمع نخبة العطور المختارة بعناية داخل تغليف كحلي مذهب يعكس أرقى مراتب الذوق والأصالة، صُمم ليكون الإهداء الذي يسبق حضورك ويبقى بعدك.',
    opening: 'زعفران نقي، هيل، وبرغموت ذهبي',
    heart: 'عود فاخر، عنبر ملكي، وباتشولي',
    base: 'صندل أصيل، مسك خاص، وبخور مبخر',
    prominent: 'دهن العود الملكي، البخور الفاخر، والعنبر',
    specs: { origin: 'المملكة العربية السعودية', category: 'للجنسين', size: 'طقم متكامل مع علبة إهداء ملكية', type: 'صندوق إهداء ملكي فاخر' }
  },

  // ── 2. قسم البخور والمعمول والعود الملكي (من لقطات الشاشة 2، 3، 4، 5) ──
  {
    id: 'bakhoor-wasaef',
    name: 'بخور وصائف',
    title: 'بخور وصائف الفاخر',
    titleEn: 'Bakhoor Wasaef Prestige',
    type: 'jar-cube',
    categoryType: 'bakhoor',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D9%88%D8%B5%D8%A7%D8%A6%D9%81/p2106124134',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/0FggXPs8eFmu6LplIqBa7SrZs6R1vnHY6oWAgKXz.jpg',
    overview: 'بخور ذو رائحة فاخرة تبعث روح الفخامة والأناقة، تدوم فعاليته لفترة طويلة على الملابس وأجواء المجالس والمنازل. كتلة بسيطة منه كفيلة بانتشار الرائحة الأكثر مبيعاً في معارض غلاتي.',
    opening: 'دهن العود الفاخر والزعفران',
    heart: 'زهور شرقية وعنبر دافئ',
    base: 'أخشاب ثمينة ومسك ملكي',
    prominent: 'العود الفاخر والزعفران المعتمد',
    specs: { origin: 'المملكة العربية السعودية', category: 'بخور ومجالس', size: '45 جرام', type: 'بخور ملكي فاخر' },
    targetH: 460
  },
  {
    id: 'bakhoor-oud-azraq',
    name: 'بخور عود ازرق مبخر',
    title: 'بخور عود أزرق مبخر',
    titleEn: 'Bakhoor Blue Steamed Oud',
    type: 'jar-cube',
    categoryType: 'bakhoor',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D8%B9%D9%88%D8%AF-%D8%A7%D8%B2%D8%B1%D9%82-%D9%85%D8%A8%D8%AE%D8%B1/p701735668',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/XhxgP3grSDqTImnSGBtTYBXqGBPWVm0D97Trq62z.png',
    overview: 'بخور العود الأزرق المبخر النادر المأخوذ من أرقى أخشاب العود الطبيعية المشبعة بالزيوت الشرقية ليعطي فوحاناً استثنائياً يدوم لأيام على الأقمشة والأجواء.',
    opening: 'خلاصة العود الأزرق والبرغموت',
    heart: 'أخشاب الأرز وعنبر مدخن',
    base: 'مسك خام ودهن عود نقي',
    prominent: 'العود الأزرق المعتق والدخان العطري',
    specs: { origin: 'المملكة العربية السعودية', category: 'بخور ومجالس', size: '45 جرام', type: 'بخور عود أزرق ملكي' },
    targetH: 460
  },
  {
    id: 'mamool-dar-alkaram',
    name: 'معمول دار الكرم',
    title: 'معمول دار الكرم الملكي',
    titleEn: 'Mamool Dar Al Karam',
    type: 'jar-cylinder',
    categoryType: 'bakhoor',
    sarPrice: 99,
    url: 'https://ghalati.com/ar/%D9%85%D8%B9%D9%85%D9%88%D9%84-%D8%AF%D8%A7%D8%B1-%D8%A7%D9%84%D9%83%D8%B1%D9%85/p1459235944',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/jmmrA3SVXvGuv8KPkkGxc3qM6Lg7DXDGH3tZ16rf.jpg',
    overview: 'معمول دار الكرم الفاخر مصنوع من أجود أنواع البخور واللابدانوم والورد والزعفران إلى جانب أفخم العطور الشرقية، مثالي لتبخير الملابس والأثاث اليومي.',
    opening: 'زعفران إيراني وورد ندي',
    heart: 'لابدانوم شرقي وخشب الصندل',
    base: 'مسك أصيل وعنبر كثيف',
    prominent: 'اللابدانوم، الزعفران، والورد الفاخر',
    specs: { origin: 'المملكة العربية السعودية', category: 'معمول وبخور', size: '120 جرام', type: 'معمول فاخر مشبع بالزيوت' },
    targetH: 500
  },
  {
    id: 'mamool-rajwa',
    name: 'معمول رجوة',
    title: 'معمول رجوة الشرقي',
    titleEn: 'Mamool Rajwa Oriental',
    type: 'jar-cylinder',
    categoryType: 'bakhoor',
    sarPrice: 85,
    url: 'https://ghalati.com/ar/%D9%85%D8%B9%D9%85%D9%88%D9%84-%D8%B1%D8%AC%D9%88%D8%A9/p386089479',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/oXD3FDxag8ohQEV8CBHlB09CmybU0XAXCGewW5Rn.jpg',
    overview: 'فخامة البخور الشرقي لتبخير يومي مميز، مصنوع من أجود أنواع البخور ليوفر تجربة تبخير استثنائية للملابس والمجالس بأصالة شرقية تفيض بالدفء.',
    opening: 'توابل شرقية ناعمة ولمسات ورد',
    heart: 'عود نقي وخشب الأرز',
    base: 'عنبر دافئ ومسك أبيض نقي',
    prominent: 'العود الشرقي والمسك الأبيض',
    specs: { origin: 'المملكة العربية السعودية', category: 'معمول وبخور', size: '120 جرام', type: 'معمول شرقي كلاسيكي' },
    targetH: 500
  },
  {
    id: 'mamool-jazi',
    name: 'معمول جازي',
    title: 'معمول جازي الأصيل',
    titleEn: 'Mamool Jazi Authentic',
    type: 'jar-cylinder',
    categoryType: 'bakhoor',
    sarPrice: 85,
    url: 'https://ghalati.com/ar/%D9%85%D8%B9%D9%85%D9%88%D9%84-%D8%AC%D8%A7%D8%B2%D9%8A/p1118957836',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/gsXwjjEkYJTXuWqofEJU6g7p0lqtgMLqRbuyKYaG.jpg',
    overview: 'معمول مصنوع من أجود أنواع البخور مناسب لتبخير الملابس والأثاث والاستخدام اليومي، يضفي هالة عطرية ساحرة تملأ أرجاء البيت بعبق تراثي فخم.',
    opening: 'أخشاب عطرية وزهور بيضاء',
    heart: 'صندل ناعم وعنبر ملكي',
    base: 'مسك أصيل ودهن عود خفيف',
    prominent: 'أخشاب الصندل والعنبر الملكي',
    specs: { origin: 'المملكة العربية السعودية', category: 'معمول وبخور', size: '120 جرام', type: 'معمول يومي فاخر' },
    targetH: 500
  },
  {
    id: 'mamool-alanoud',
    name: 'معمول العنود',
    title: 'معمول العنود الملكي',
    titleEn: 'Mamool Al Anoud Prestige',
    type: 'jar-cylinder',
    categoryType: 'bakhoor',
    sarPrice: 85,
    url: 'https://ghalati.com/ar/%D9%85%D8%B9%D9%85%D9%88%D9%84-%D8%A7%D9%84%D8%B9%D9%86%D9%88%D8%AF/p976374070',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/DoqbMtPFIf0jvtqlgOPeWBECc58gWbfHOvIzUljN.jpg',
    overview: 'عبق البخور الشرقي بروح الفخامة والأنوثة الراقية، مصنوع بعناية ليضفي لمسة من الأصالة والرفاهية على الملابس ومحيط المنزل بفوحان استثنائي.',
    opening: 'زهور شرقية ولمسات ياسمين',
    heart: 'عود رقيق وخشب الصندل',
    base: 'عنبر كريمي ومسك ناصع',
    prominent: 'الزهور الشرقية والمسك الناصع',
    specs: { origin: 'المملكة العربية السعودية', category: 'معمول وبخور', size: '120 جرام', type: 'معمول شرقي راقي' },
    targetH: 500
  },
  {
    id: 'mamool-waad',
    name: 'معمول وعد',
    title: 'معمول وعد الفاخر',
    titleEn: 'Mamool Waad Signature',
    type: 'jar-cylinder',
    categoryType: 'bakhoor',
    sarPrice: 85,
    url: 'https://ghalati.com/ar/%D9%85%D8%B9%D9%85%D9%88%D9%84-%D9%88%D8%B9%D8%AF/p1606752261',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/0YCuo78UDgas9Y9REDdwqJiFtu3cw8XRUD8lhbwp.jpg',
    overview: 'أصالة البخور الشرقي بتفاصيل دقيقة فاخرة، يتميز بفوحانه القوي ورائحته العميقة التي تضفي أجواء من الفخامة والدفء وتدوم لساعات طويلة.',
    opening: 'توابل عطرية وزعفران',
    heart: 'أخشاب الأرز وعنبر نقي',
    base: 'مسك ملكي وراتنجات شرقية',
    prominent: 'الزعفران وراتنجات العود',
    specs: { origin: 'المملكة العربية السعودية', category: 'معمول وبخور', size: '120 جرام', type: 'معمول بخور فواح' },
    targetH: 500
  },
  {
    id: 'bakhoor-oud-ghalati',
    name: 'بخور عود غلاتي',
    title: 'بخور عود غلاتي الملكي',
    titleEn: 'Bakhoor Oud Ghalati Royal',
    type: 'jar-cube',
    categoryType: 'bakhoor',
    sarPrice: 159,
    url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D8%B9%D9%88%D8%AF-%D8%BA%D9%84%D8%A7%D8%AA%D9%8A/p2126378518',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/MtJUYPj241XRZ73fYzc0nIewM0oP1BYuAE5o25d6.jpg',
    overview: 'مبثوث ملكي خاص بالدار مكون من أجود أنواع العود والعطور الفاخرة، مناسب جداً لتبخير المنازل، المكاتب، المساجد وصالات الضيوف مع ثبات طويل.',
    opening: 'دهن عود نقي وزعفران ملكي',
    heart: 'أخشاب العود الفاخرة واللبان الحوجري',
    base: 'عنبر معتق ومسك الغزال',
    prominent: 'دهن العود واللبان الحوجري',
    specs: { origin: 'المملكة العربية السعودية', category: 'بخور ومجالس', size: '80 جرام', type: 'مبثوث ملكي معتق' },
    targetH: 460
  },
  {
    id: 'bakhoor-mabthooth-aljoud',
    name: 'بخور مبثوث الجود',
    title: 'بخور مبثوث الجود الفاخر',
    titleEn: 'Mabthooth Al Joud Premium',
    type: 'jar-cube',
    categoryType: 'bakhoor',
    sarPrice: 159,
    url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D9%85%D8%A8%D8%AB%D9%88%D8%AB-%D8%A7%D9%84%D8%AC%D9%88%D8%AF/p159841822',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/PLSJ3wMW6U1XPd8JaXj9FzoI5FX8Rt0herDXgJRC.jpg',
    overview: 'مبثوث فاخر من أجود أنواع العود والعطور الفخمة، مناسب لتبخير صالات التجمعات والمناسبات الكبرى، يمنح المكان هيبة وضيافة عربية أصيلة.',
    opening: 'دقة العود الملكية ونفحات هيل',
    heart: 'عنبر أشهب وخشب الصندل',
    base: 'مسك فاخر ودهن عود كمبودي',
    prominent: 'دقة العود ودهن العود الكمبودي',
    specs: { origin: 'المملكة العربية السعودية', category: 'بخور ومجالس', size: '80 جرام', type: 'مبثوث مناسبات فاخر' },
    targetH: 460
  },
  {
    id: 'bakhoor-oud-fakher',
    name: 'بخور عود فاخر',
    title: 'بخور عود فاخر ملكي',
    titleEn: 'Bakhoor Oud Fakher',
    type: 'jar-cube',
    categoryType: 'bakhoor',
    sarPrice: 159,
    url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D8%B9%D9%88%D8%AF-%D9%81%D8%A7%D8%AE%D8%B1/p1270730574',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/NRnrYVa4lso24iDWGOInUs3ubldWubS5sIil85QX.png',
    overview: 'تحفة تبخير ملكية بقارورة مذهبة أنيقة، تجمع بين نقاء خشب العود الطبيعي المعالج بالزيوت العطرية الفاخرة ليوفر رائحة بخورية ثقيلة وثابتة.',
    opening: 'زيوت شرقية مركزة وبخور موروكي',
    heart: 'أخشاب الأرز وعنبر دافئ',
    base: 'دهن عود نقي ومسك خام',
    prominent: 'العود الموروكي والزيوت الشرقية',
    specs: { origin: 'المملكة العربية السعودية', category: 'بخور ومجالس', size: '80 جرام', type: 'بخور عود مركز' },
    targetH: 460
  },
  {
    id: 'bakhoor-asrar-aloud',
    name: 'بخور اسرار العود',
    title: 'بخور أسرار العود الفاخر',
    titleEn: 'Bakhoor Asrar Al Oud',
    type: 'jar-cube',
    categoryType: 'bakhoor',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D8%A7%D8%B3%D8%B1%D8%A7%D8%B1-%D8%A7%D9%84%D8%B9%D9%88%D8%AF/p1297991797',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/Eg4AGjq4RsEz1cAi9k9wh07dHcCT2W60glXp6U6v.jpg',
    overview: 'تنهمر رائحته بتوليفة فريدة تسحر المكان بالبروز والظهور، رقائق ضئيلة منه كفيلة بانتشار الرائحة العطرية الخلابة في كامل أرجاء الغرفة.',
    opening: 'عبير العود ورقائق الصندل',
    heart: 'ورد جوري وعنبر خالص',
    base: 'مسك عربي ودهن عود ناعم',
    prominent: 'أسرار العود والورد الجوري',
    specs: { origin: 'المملكة العربية السعودية', category: 'بخور ومجالس', size: '45 جرام', type: 'بخور شرقي فواح' },
    targetH: 460
  },
  {
    id: 'mamool-khas-ghalati',
    name: 'معمول خاص غلاتي',
    title: 'معمول خاص غلاتي الفاخر',
    titleEn: 'Mamool Khas Ghalati Signature',
    type: 'jar-cylinder',
    categoryType: 'bakhoor',
    sarPrice: 185,
    url: 'https://ghalati.com/ar/%D9%85%D8%B9%D9%85%D9%88%D9%84-%D8%AE%D8%A7%D8%B5-%D8%BA%D9%84%D8%A7%D8%AA%D9%8A/p974771830',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/k5caiW4Qb8VEhAsvz0BkpsKGwOgzksA98ENrRybg.jpg',
    overview: 'المعمول الخاص والأعلى فئة لدى دار غلاتي، مصنوع بخلطة سرية ملكية من دهن العود والمسك والعنبر المركز، مخصص للباحثين عن أعلى درجات التميز والفوحان.',
    opening: 'خلطة غلاتي الخاصة ودهن عود مبخر',
    heart: 'عنبر ملوكي وصندل نادر',
    base: 'مسك الطهارة والزعفران الأحمر',
    prominent: 'خلطة غلاتي الخاصة ودهن العود المبخر',
    specs: { origin: 'المملكة العربية السعودية', category: 'معمول وبخور', size: '120 جرام', type: 'معمول ملكي خاص' },
    targetH: 500
  },
  {
    id: 'bakhoor-oud-alsamou',
    name: 'بخور عود السمو',
    title: 'بخور عود السمو الملكي',
    titleEn: 'Bakhoor Oud Al Samou',
    type: 'jar-cube',
    categoryType: 'bakhoor',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D8%B9%D9%88%D8%AF-%D8%A7%D9%84%D8%B3%D9%85%D9%88/p1285210357',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/b3eJrWFH6Gx6HeIfDkjfwVGxC0vLNHasYeSMojvj.png',
    overview: 'عود نادر مستخرج من أعماق غابات جنوب شرق آسيا، تم انتقاء الأفضل من أشجار العود العتيقة لتقديم رائحة فاخرة تجسد معنى السمو والرفعة.',
    opening: 'خشب العود الآسيوي الطبيعي',
    heart: 'راتنجات عطرية وعنبر خام',
    base: 'مسك أسود وزيوت خشبية ثمينة',
    prominent: 'عود السمو النادر والراتنجات العطرية',
    specs: { origin: 'المملكة العربية السعودية', category: 'بخور ومجالس', size: '45 جرام', type: 'بخور عود أسيوي نادر' },
    targetH: 460
  },
  {
    id: 'bakhoor-dokhoon-almajales',
    name: 'بخور دخون المجالس',
    title: 'بخور دخون المجالس الفاخر',
    titleEn: 'Bakhoor Dokhoon Al Majales',
    type: 'jar-cube',
    categoryType: 'bakhoor',
    sarPrice: 159,
    url: 'https://ghalati.com/ar/%D8%A8%D8%AE%D9%88%D8%B1-%D8%AF%D8%AE%D9%88%D9%86-%D8%A7%D9%84%D9%85%D8%AC%D8%A7%D9%84%D8%B3/p1388243446',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/YAo20pQb9q5LUS7iI2Ct6B6IHzOJ3rFl8rhGGkYW.png',
    overview: 'دخون المجالس الأصيل بعبق الضيافة العربية الفاخرة، يثبت في الأرجاء والأقمشة لساعات طويلة مخلداً ذكريات الكرم وحسن الاستقبال.',
    opening: 'دخان العود المعطر وتوابل دافئة',
    heart: 'عنبر أشهب وخشب الصندل',
    base: 'مسك فاخر ودهن عود نقي',
    prominent: 'دخون المجالس ودهن العود',
    specs: { origin: 'المملكة العربية السعودية', category: 'بخور ومجالس', size: '80 جرام', type: 'دخون مجالس فاخر' },
    targetH: 460
  },
  {
    id: 'oud-aldar',
    name: 'عود الدار',
    title: 'بخور عود الدار الطبيعي',
    titleEn: 'Oud Al Dar Natural Incense',
    type: 'diorama',
    categoryType: 'bakhoor',
    sarPrice: 40,
    url: 'https://ghalati.com/ar/%D8%B9%D9%88%D8%AF-%D8%A7%D9%84%D8%AF%D8%A7%D8%B1/p667748448',
    imageUrl: 'https://cdn.salla.sa/Dqvgy/hRCY03Fdi3ZOcbV81AEE3A7fV9uPc2XRmq9BIALH.jpg',
    overview: 'استمتع بجو من الفخامة والدفء مع بخور عود الدار، الذي يجمع بين عبق رقائق العود الطبيعية المشبعة والروائح الشرقية التقليدية، خيار مثالي لإضفاء لمسة تراثية أصيلة.',
    opening: 'رقائق عود طبيعية مبخرة',
    heart: 'أخشاب الأرز وعنبر هادئ',
    base: 'مسك صافي ودهن خشب الصندل',
    prominent: 'رقائق العود الطبيعية',
    specs: { origin: 'المملكة العربية السعودية', category: 'بخور ومجالس', size: 'علبة رقائق عود', type: 'رقائق عود طبيعي' }
  }
];

async function run() {
  console.log(`Processing Batch 3 (${batch3Items.length} products: Bakhoor, Ma'amoul, and Luxury Sets)...`);
  const existingProducts = JSON.parse(fs.readFileSync(perfumesFile, 'utf8'));

  for (const item of batch3Items) {
    console.log(`\n--- [${item.id}] ${item.name} ---`);
    const outShowcaseJpg = path.join(__dirname, '..', 'public', 'images', `ghalati_${item.id}.jpg`);
    const outOriginalPng = path.join(__dirname, '..', 'public', 'images', `original_${item.id}.png`);

    console.log(`Downloading ${item.imageUrl}...`);
    const res = await fetch(item.imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const imgBuf = Buffer.from(await res.arrayBuffer());

    // 1. Save original
    await sharp(imgBuf).png().toFile(outOriginalPng);

    // 2. Process showcase image based on type
    if (item.type === 'diorama') {
      console.log('Processing Diorama presentation shot...');
      await processDioramaSet(imgBuf, outShowcaseJpg);
    } else {
      console.log('Removing background via @imgly...');
      const blob = new Blob([imgBuf], { type: 'image/jpeg' });
      const cutoutBlob = await removeBackground(blob);
      const cutoutBuf = Buffer.from(await cutoutBlob.arrayBuffer());

      console.log('Cleaning studio shadow artifacts...');
      const isCyl = item.type === 'jar-cylinder';
      const cleanedBuf = await cleanJarShadow(cutoutBuf, isCyl);

      console.log('Compositing onto master luxury podium...');
      await compositeJar(cleanedBuf, outShowcaseJpg, item.targetH || 460);
    }

    console.log(`✓ Showcase created: ${outShowcaseJpg}`);

    // 3. Prepare product object
    const baseJod = Math.round(item.sarPrice / 5.29);
    const finalJod = baseJod + 12;

    const prodObj = {
      id: item.id,
      title: item.title,
      titleEn: item.titleEn,
      brand: 'دار غلاتي (Ghalati)',
      categoryType: item.categoryType,
      sarPrice: item.sarPrice,
      baseJod: baseJod,
      finalJod: finalJod,
      url: item.url,
      bottleUrl: item.imageUrl,
      overview: item.overview,
      opening: item.opening,
      heart: item.heart,
      base: item.base,
      prominent: item.prominent,
      specs: item.specs,
      image: `images/ghalati_${item.id}.jpg`,
      originalImage: `images/original_${item.id}.png`,
      galleryImages: [item.imageUrl]
    };

    const idx = existingProducts.findIndex(p => p.id === item.id);
    if (idx >= 0) existingProducts[idx] = prodObj;
    else existingProducts.push(prodObj);
  }

  fs.writeFileSync(perfumesFile, JSON.stringify(existingProducts, null, 2), 'utf8');
  console.log(`\n🎉 Successfully processed Batch 3! Total products in catalog now: ${existingProducts.length}`);
}

run().catch(console.error);
