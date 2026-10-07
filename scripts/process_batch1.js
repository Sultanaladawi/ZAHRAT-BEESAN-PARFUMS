const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');

const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const perfumesFile = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');

// BFS Largest Connected Component
async function cleanToLargestComponent(imgBuf) {
  const { data, info } = await sharp(imgBuf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // 1. Remove faint noise & neutral studio shadow
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] === 0) continue;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      // Studio drop shadow outside cap
      if (y > h * 0.35 && diff <= 10 && min >= 80 && (x < w * 0.3 || x > w * 0.7 || y > h * 0.88)) {
        data[idx + 3] = 0;
      }
      if (data[idx + 3] < 30) data[idx + 3] = 0;
    }
  }

  // 2. Connected Component
  const grid = new Int32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] > 30) grid[i] = -1;
    else grid[i] = 0;
  }

  let currentLabel = 0;
  const compSizes = {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (grid[idx] === -1) {
        currentLabel++;
        let size = 0;
        const queue = [x, y];
        grid[idx] = currentLabel;
        let qHead = 0;
        while (qHead < queue.length) {
          const cx = queue[qHead++], cy = queue[qHead++];
          size++;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx, ny = cy + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nidx = ny * w + nx;
                if (grid[nidx] === -1) {
                  grid[nidx] = currentLabel;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }
        compSizes[currentLabel] = size;
      }
    }
  }

  let maxSize = 0, maxLabel = 0;
  for (const [lbl, sz] of Object.entries(compSizes)) {
    if (sz > maxSize) { maxSize = sz; maxLabel = parseInt(lbl); }
  }

  for (let i = 0; i < w * h; i++) {
    if (grid[i] !== maxLabel) data[i * 4 + 3] = 0;
  }

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  return await sharp(cleaned).trim().png().toBuffer();
}

async function compositeBottle(bottlePngBuf, outJpgPath, targetH = 505) {
  const resized = await sharp(bottlePngBuf).resize({ height: targetH, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 60;
  const shadowSvg = `
  <svg width="${shadowW}" height="32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.8" /></filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.42}" ry="8.5" fill="#18110b" opacity="0.62" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="16" rx="${bW * 0.28}" ry="4.2" fill="#080503" opacity="0.88" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 30), top: baseContactY - 16 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(outJpgPath);
}

const batch1 = [
  {
    id: 'spring',
    title: 'عطر سبرينج',
    titleEn: 'Spring Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 55,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D8%B1%D9%8A%D9%86%D8%AC/p625338571',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/99ba1303-5eac-470a-a962-1a2320b44bca-1000x1000-GvaNqPnD8T1J9sOUYaPSmJnPbkv3Omu9St6d73xH.jpg',
    overview: 'أول تركيبة عطرية منعشة مثلجة نستكشف من خلالها نضارة لا نهاية لها مع مسار مبهر ونكهة حلوة من الزنجبيل المنعش وكوكتيل فاكهي مثلج من التوت والقريب فروت.',
    opening: 'زنجبيل منعش، قريب فروت، وتوت مثلج',
    heart: 'أزهار الربيع، زنبق الوادي، ونفحات حمضية',
    base: 'مسك أبيض، خشب الأرز، ولمسات سكرية لطيفة',
    prominent: 'التوت المثلج، الزنجبيل، والقريب فروت',
    specs: { origin: 'المملكة العربية السعودية', category: 'نسائي / للجنسين', size: '100 مل', type: 'عطر فاكهي منعش مثلج' },
    targetH: 520
  },
  {
    id: 'sparkle',
    title: 'عطر سباركل',
    titleEn: 'Sparkle Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 55,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B3%D8%A8%D8%A7%D8%B1%D9%83%D9%84/p1757606131',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/83857c0c-f93c-4b47-9916-0d7284941a2b-1000x1000-DA9A7wKpnjqmFpoaZFFbHhV2tipHptzja43oJH28.jpg',
    overview: 'بوصلة عطرية من التناغم الأنيق وغير المتوقع، تنطلق من حيوية اليوسفي المنعشة وتتوج بزهرة الأمورتال الخالدة لتعطي إشراقة وانتعاشاً مبهراً طوال النهار.',
    opening: 'يوسفي إيطالي، برغموت متلألئ، ونفحات مائية',
    heart: 'زهرة الأمورتال الخالدة، ياسمين، وأزهار بيضاء',
    base: 'أخشاب ناعمة، مسك نقي، ولمسات عنبرية خفيفة',
    prominent: 'اليوسفي، زهرة الأمورتال، والمسك النقي',
    specs: { origin: 'المملكة العربية السعودية', category: 'للجنسين', size: '100 مل', type: 'عطر حمضي زهري مشرق' },
    targetH: 520
  },
  {
    id: 'sunrise',
    title: 'عطر صن رايز',
    titleEn: 'Sunrise Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 55,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B5%D9%86-%D8%B1%D8%A7%D9%8A%D8%B2/p1942806396',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/1a9f243c-1989-4987-beeb-57df7979e0cd-1000x1000-8hWopTxHaBX54anIQXLM1FhdaogoISBDw0NEnAqJ.png',
    overview: 'ثورة عطرية تعيد تعريف العنبر بمزيج متناقض يجذب الأنظار ويفتن الحواس برائحته الجذابة، يفتتح برائحة الأمبريت المكثف والتوابل الحارة مع دفء شمس الصباح.',
    opening: 'أمبريت مكثف، توابل دافئة، وحمضيات شمسية',
    heart: 'أزهار صفراء، هيل، وخشب الصندل',
    base: 'عنبر دافئ، مسك شمسي، وفانيليا غنية',
    prominent: 'الأمبريت، العنبر الدافئ، والتوابل الشمسية',
    specs: { origin: 'المملكة العربية السعودية', category: 'للجنسين', size: '100 مل', type: 'عطر عنبري شمسي دافئ' },
    targetH: 520
  },
  {
    id: 'bois-noir',
    title: 'عطر بوانوير',
    titleEn: 'Bois Noir Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D9%88%D8%A7%D9%86%D9%88%D9%8A%D8%B1/p214279369',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/aa43eba8-89f6-4000-8c0b-866af91a2082-1000x1000-0MXI2XePRsOP8oMf3q7YkqFkW5OU4Y37Hh02DTyQ.png',
    overview: 'الغموض الخشبي الآسر، يجمع بين قوة أخشاب الغابات الداكنة ودفء الباتشولي ولمسات ناعمة من الجلود والبخور لتمنحك شخصية واثقة وفخامة طاغية.',
    opening: 'برغموت مدخن، بهارات حارة، وفلفل وردي',
    heart: 'أخشاب الأرز، باتشولي فاخر، وخشب الغاياك',
    base: 'بخور داكن، مسك أسود، وجلود فاخرة',
    prominent: 'أخشاب الأرز، الباتشولي، والجلود الداكنة',
    specs: { origin: 'المملكة العربية السعودية', category: 'رجالي / للجنسين', size: '100 مل', type: 'عطر خشبي جلدي غامض' },
    targetH: 505
  },
  {
    id: 'shades',
    title: 'عطر شيدز',
    titleEn: 'Shades Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B4%D9%8A%D8%AF%D8%B2/p1859126740',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/8c3df01e-2d0f-4159-8746-53a2d8ebd1f3-1000x1000-RLomeBfBIfSLGGmRn9xOcm4CHssbAYF1qFkoeqgV.png',
    overview: 'عطر التدرجات اللونية والعواطف المتناغمة، يجمع بين الفواكه المخملية والزهور الأرجوانية الفواحة مع قاعدة عنبرية خشبية ثابتة تترك أثراً لا يُنسى.',
    opening: 'توت داكن، برغموت كالابريا، وفلفل وردي',
    heart: 'ورد بنفسجي، خزامى فرنسي، وياسمين مخملي',
    base: 'عنبر ملكي، باتشولي، خشب الصندل، وفانيليا',
    prominent: 'التوت الداكن، الورد البنفسجي، والعنبر',
    specs: { origin: 'المملكة العربية السعودية', category: 'للجنسين', size: '100 مل', type: 'عطر فاكهي زهري عنبري' },
    targetH: 505
  },
  {
    id: 'oud-absolute',
    title: 'عطر عود ابسيليوت',
    titleEn: 'Oud Absolute Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B9%D9%88%D8%AF-%D8%A7%D8%A8%D8%B3%D9%8A%D9%84%D9%8A%D9%88%D8%AA/p704485665',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/f22be590-9d21-480f-833a-a7ad1c9fea69-1000x1000-pySdSXctosXIPohei53tzn4Mtd29jmALD4wPkUfH.jpg',
    overview: 'جوهر العود الخالص بأرقى تجلياته، نفحات نقية ومعتقة من دهن العود الشرقي الفاخر الممزوج بالزعفران والعنبر لأصحاب الذوق الرفيع والمناسبات الكبرى.',
    opening: 'زعفران ملكي، هيل فاخر، ونفحات حمضية هادئة',
    heart: 'ورد شرقي، باتشولي، وقرفة سيلانية',
    base: 'دهن عود معتق، خشب الصندل، وعنبر داكن',
    prominent: 'العود المعتق، الزعفران الملكي، والعنبر',
    specs: { origin: 'المملكة العربية السعودية', category: 'للجنسين', size: '100 مل', type: 'عطر شرقي خشبي ملكي' },
    targetH: 505
  },
  {
    id: 'rica',
    title: 'عطر ريكا',
    titleEn: 'Rica Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D9%8A%D9%83%D8%A7/p717502073',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/77e6f0b5-c291-4eec-bbb3-b6753eb39305-1000x1000-IhWpOe5n1QV65l1TS8qYh3dmJ9t71lQuTA0sfTcB.jpg',
    overview: 'تحفة عطرية في زجاجة زمردية فاخرة، تمزج بين الانتعاش العشبي والزهور الأنيقة مع عمق الأخشاب النادرة والمسك الأبيض لتمنح حضوراً آسراً.',
    opening: 'برغموت، تفاح أخضر، ونفحات عشبية نضرة',
    heart: 'زهر البرتقال، ياسمين سامباك، وورد فرنسي',
    base: 'مسك أبيض، خشب الصندل، ولمسات فانيليا مدغشقر',
    prominent: 'التفاح الأخضر، زهر البرتقال، والمسك الأبيض',
    specs: { origin: 'المملكة العربية السعودية', category: 'نسائي / للجنسين', size: '100 مل', type: 'عطر زمردي زهري منعش' },
    targetH: 510
  },
  {
    id: 'utopia-platinum',
    title: 'عطر يوتوبيا بلاتينيوم',
    titleEn: 'Utopia Platinum Eau De Parfum',
    brand: 'دار غلاتي (Ghalati)',
    sarPrice: 95,
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%8A%D9%88%D8%AA%D9%88%D8%A8%D9%8A%D8%A7-%D8%A8%D9%84%D8%A7%D8%AA%D9%8A%D9%86%D9%8A%D9%88%D9%85/p1781279602',
    bottleUrl: 'https://cdn.salla.sa/Dqvgy/455d481c-e8a9-46a1-bee9-8b4a882e5443-1000x1000-I2ukrAy693qbGvlAeHQqxWnXiPASBtcjewGofivI.png',
    overview: 'التصميم المستقبلي في عالم العطور، تحفة معمارية بلاتينية تحتضن مزيجاً منعشاً وأنيقاً من النعناع والحمضيات مع قاعدة خشبية معدنية راقية.',
    opening: 'نعناع منعش، ليمون إيطالي، وجريب فروت',
    heart: 'فلفل وردي، زنجبيل، وياسمين شفاف',
    base: 'خشب الأرز، نجيل الهند، ومسك معدني نقي',
    prominent: 'النعناع المنعش، الليمون، وأخشاب الأرز',
    specs: { origin: 'المملكة العربية السعودية', category: 'رجالي / للجنسين', size: '100 مل', type: 'عطر مستقبلي منعش بلاتيني' },
    targetH: 520
  }
];

async function run() {
  console.log('Processing Batch 1 (8 new perfumes)...');
  const existingProducts = JSON.parse(fs.readFileSync(perfumesFile, 'utf8'));

  for (const item of batch1) {
    console.log(`\n--- [${item.id}] ${item.title} ---`);
    const rawImgPath = path.join(__dirname, `raw_${item.id}.jpg`);
    const cleanPngPath = path.join(__dirname, `definitive_${item.id}.png`);
    const outShowcasePath = path.join(__dirname, '..', 'public', 'images', `ghalati_${item.id}.jpg`);
    const outOriginalPath = path.join(__dirname, '..', 'public', 'images', `original_${item.id}.png`);

    // 1. Download official bottle image
    console.log(`Downloading ${item.bottleUrl}...`);
    const res = await fetch(item.bottleUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(rawImgPath, buf);

    // 2. Remove background via @imgly
    console.log('Removing background via @imgly...');
    const blob = new Blob([buf], { type: 'image/jpeg' });
    const bgRemovedBlob = await removeBackground(blob);
    const bgRemovedBuf = Buffer.from(await bgRemovedBlob.arrayBuffer());

    // 3. Clean via BFS Connected Components
    console.log('Applying Connected Component Island Filter...');
    const spotlessCutout = await cleanToLargestComponent(bgRemovedBuf);
    fs.writeFileSync(cleanPngPath, spotlessCutout);
    fs.writeFileSync(outOriginalPath, spotlessCutout);

    // 4. Composite onto master podium
    console.log('Compositing onto master podium...');
    await compositeBottle(spotlessCutout, outShowcasePath, item.targetH);
    console.log(`✓ Showcase created: ${outShowcasePath}`);

    // 5. Calculate prices
    const baseJod = Math.round(item.sarPrice / 5.29);
    const finalJod = baseJod + 12;

    const prodObj = {
      id: item.id,
      title: item.title,
      titleEn: item.titleEn,
      brand: item.brand,
      sarPrice: item.sarPrice,
      baseJod: baseJod,
      finalJod: finalJod,
      url: item.url,
      bottleUrl: item.bottleUrl,
      overview: item.overview,
      opening: item.opening,
      heart: item.heart,
      base: item.base,
      prominent: item.prominent,
      specs: item.specs,
      image: `images/ghalati_${item.id}.jpg`,
      originalImage: `images/original_${item.id}.png`,
      galleryImages: [item.bottleUrl]
    };

    // Remove existing if any, then append
    const idx = existingProducts.findIndex(p => p.id === item.id);
    if (idx >= 0) existingProducts[idx] = prodObj;
    else existingProducts.push(prodObj);
  }

  // Also ensure rasayil-haneen is added to perfumes.json
  const hasRasayil = existingProducts.some(p => p.id === 'rasayil-haneen');
  if (!hasRasayil) {
    existingProducts.push({
      id: 'rasayil-haneen',
      title: 'عطر رسائل حنين',
      titleEn: 'Rasayil Haneen Eau De Parfum',
      brand: 'دار غلاتي (Ghalati)',
      sarPrice: 95,
      baseJod: 18,
      finalJod: 30,
      url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D8%B3%D8%A7%D8%A6%D9%84-%D9%88%D8%AF/p1291527951',
      bottleUrl: 'https://cdn.salla.sa/Dqvgy/36e5830d-6cb9-4153-8b85-c1bc6df6fab4-1000x1000-ePLIem4e83On0kDlykE9Qh9b33qeZogYnwCEBAY1.png',
      overview: 'تحفة شرقية كلاسيكية بقارورة كريستالية مذهبة وشعلة ذهبية تعبر عن أرقى مشاعر الحنين والدفء مع توليفة ملكية من دهن العود والزعفران والعنبر.',
      opening: 'زعفران أحمر، هيل هندي، ونفحات ورد ندي',
      heart: 'عود فاخر، خشب الصندل، وباتشولي',
      base: 'عنبر دافئ، مسك ملكي، وفانيليا غنية',
      prominent: 'الزعفران، دهن العود، والعنبر الملكي',
      specs: { origin: 'المملكة العربية السعودية', category: 'للجنسين', size: '100 مل', type: 'عطر شرقي دافئ ملكي' },
      image: 'images/ghalati_rasayil-haneen.jpg',
      originalImage: 'images/original_rasayil-haneen.png',
      galleryImages: []
    });
  }

  fs.writeFileSync(perfumesFile, JSON.stringify(existingProducts, null, 2), 'utf8');
  console.log(`\n🎉 Successfully processed Batch 1! Total products in catalog: ${existingProducts.length}`);
}

run().catch(console.error);
