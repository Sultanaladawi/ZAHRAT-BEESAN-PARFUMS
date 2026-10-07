async function checkProduct(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const title = html.match(/<title>([^<]+)<\/title>/);
    const price = html.match(/"price"\s*:\s*(\d+(?:\.\d+)?)/);
    const imgs = html.match(/https:\/\/cdn\.salla\.sa\/Dqvgy\/[a-zA-Z0-9_\-\.]+\.(?:png|jpg|jpeg)/gi) || [];
    const uniqueImgs = [...new Set(imgs)].filter(i => !i.includes('favicon') && !i.includes('store-'));
    console.log(`URL: ${url}`);
    console.log(`Title: ${title ? title[1] : 'N/A'}`);
    console.log(`Price: ${price ? price[1] : 'N/A'} SAR`);
    console.log(`Images: ${uniqueImgs.length}`);
    console.log('---');
  } catch(e) {
    console.error(`Error for ${url}:`, e.message);
  }
}

async function run() {
  const urls = [
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A7%D9%8A%D9%84%D9%8A%D9%83%D9%88%D9%8A%D9%86%D8%AA/p1691206831',
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D9%8A%D8%AA%D8%B4-%D9%85%D8%B3%D9%83/p94237016',
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A7%D9%8A%D9%83%D8%B3%D9%88%D8%AA%D9%83-%D9%88%D9%88%D8%AF/p827032303',
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%8A%D9%88%D8%AA%D9%88%D8%A8%D9%8A%D8%A7-%D8%A7%D9%8A%D8%B3%D9%8A%D9%86%D8%B3/p1459720051',
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%AF%D8%A7%D9%85%D8%A7/p1422738068',
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%83%D8%A7%D8%B1%D9%85%D9%86-%D8%B3%D9%88%D9%84/p552806699',
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D8%A7%D8%B3%D8%A8%D9%8A%D8%B1%D9%8A-%D9%85%D8%B3%D9%83/p1179801856',
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D9%88%D8%B2-%D8%A7%D9%86%D8%AA%D9%8A%D9%86%D8%B3/p1442767982',
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%AA%D8%B4%D9%8A%D8%B1%D9%8A-%D9%85%D8%B3%D9%83/p324286727'
  ];

  for (const u of urls) {
    await checkProduct(u);
  }
}

run();
