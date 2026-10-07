const fs = require('fs');
const path = require('path');

const newProductTargets = [
  { id: 'rasayil-haneen', titleDefault: 'عطر رسائل حنين', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D8%B3%D8%A7%D8%A6%D9%84-%D9%88%D8%AF/p1291527951' },
  { id: 'spring', titleDefault: 'عطر سبرينج', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B3%D8%A8%D8%B1%D9%8A%D9%86%D8%AC/p625338571' },
  { id: 'sparkle', titleDefault: 'عطر سباركل', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B3%D8%A8%D8%A7%D8%B1%D9%83%D9%84/p1757606131' },
  { id: 'sunrise', titleDefault: 'عطر صن رايز', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B5%D9%86-%D8%B1%D8%A7%D9%8A%D8%B2/p1942806396' },
  { id: 'bois-noir', titleDefault: 'عطر بوانوير', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D9%88%D8%A7%D9%86%D9%88%D9%8A%D8%B1/p214279369' },
  { id: 'shades', titleDefault: 'عطر شيدز', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B4%D9%8A%D8%AF%D8%B2/p1859126740' },
  { id: 'oud-absolute', titleDefault: 'عطر عود ابسيليوت', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B9%D9%88%D8%AF-%D8%A7%D8%A8%D8%B3%D9%8A%D9%84%D9%8A%D9%88%D8%AA/p704485665' },
  { id: 'rica', titleDefault: 'عطر ريكا', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D9%8A%D9%83%D8%A7/p717502073' },
  { id: '1932', titleDefault: 'عطر 1932', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-1932/p1626340129' },
  { id: 'utopia-platinum', titleDefault: 'عطر يوتوبيا بلاتينيوم', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%8A%D9%88%D8%AA%D9%88%D8%A8%D9%8A%D8%A7-%D8%A8%D9%84%D8%A7%D8%AA%D9%8A%D9%86%D9%8A%D9%88%D9%85/p1781279602' },
  { id: 'sublime-woods', titleDefault: 'عطر سبلايم وود', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B3%D8%A8%D9%84%D8%A7%D9%8A%D9%85-%D9%88%D9%88%D8%AF/p1476002698' },
  { id: 'ambitious', titleDefault: 'عطر امبيشيس', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A7%D9%85%D8%A8%D9%8A%D8%B4%D9%8A%D8%B3/p416529345' },
  { id: '2016', titleDefault: 'عطر 2016', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-2016/p929551252' },
  { id: 'mountain-leather', titleDefault: 'عطر ماونتن ليذر', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%85%D8%A7%D9%88%D9%86%D8%AA%D9%86-%D9%84%D9%8A%D8%B0%D8%B1/p1184729170' },
  { id: 'sublime-flowers', titleDefault: 'عطر سبلايم فلور', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B3%D8%A8%D9%84%D8%A7%D9%8A%D9%85-%D9%81%D9%84%D9%88%D8%B1/p192589990' },
  { id: '1981', titleDefault: 'عطر 1981', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-1981/p863469488' },
  { id: '1985', titleDefault: 'عطر 1985', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-1985/p1737622149' },
  { id: '1727', titleDefault: 'عطر 1727', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-1727/p921934657' }
];

async function fetchDetails(item) {
  try {
    const res = await fetch(item.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();

    let title = item.titleDefault;
    const titleMatch = html.match(/<title>([^<|]+)/i);
    if (titleMatch) title = titleMatch[1].trim();

    let sarPrice = 95;
    const priceMatch = html.match(/"price"\s*:\s*(\d+(?:\.\d+)?)/);
    if (priceMatch) sarPrice = parseFloat(priceMatch[1]);

    const baseJod = Math.round(sarPrice / 5.29);
    const finalJod = baseJod + 12;

    const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

    const imgs = html.match(/https:\/\/cdn\.salla\.sa\/Dqvgy\/[a-zA-Z0-9_\-\.]+\.(?:png|jpg|jpeg)/gi) || [];
    const uniqueImgs = [...new Set(imgs)].filter(i => !i.includes('favicon') && !i.includes('store-'));
    const bottle1000 = uniqueImgs.find(i => i.includes('1000x1000'));
    const bottle500 = uniqueImgs.find(i => i.includes('500x500'));
    const mainBottleUrl = bottle1000 || bottle500 || uniqueImgs[0];

    return {
      id: item.id,
      title,
      sarPrice,
      baseJod,
      finalJod,
      url: item.url,
      metaDesc,
      mainBottleUrl,
      galleryImages: uniqueImgs.slice(0, 4)
    };
  } catch(e) {
    console.error(`Error fetching ${item.id}:`, e.message);
    return null;
  }
}

async function run() {
  const results = [];
  for (const item of newProductTargets) {
    console.log(`Fetching ${item.id}...`);
    const data = await fetchDetails(item);
    if (data) results.push(data);
  }

  const outPath = path.join(__dirname, '..', 'data', 'ghalati_batch2_raw.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved ${results.length} items to ${outPath}`);
}

run();
