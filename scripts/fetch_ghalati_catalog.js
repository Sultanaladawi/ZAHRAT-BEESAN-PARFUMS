const fs = require('fs');
const path = require('path');

const productUrls = [
  { id: 'purple-rose', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D8%B1%D8%A8%D9%84-%D8%B1%D9%88%D8%B2/p133723763' },
  { id: 'majestic-wood', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%85%D8%A7%D8%AC%D8%B3%D8%AA%D9%83-%D9%88%D9%88%D8%AF/p1249911952' },
  { id: 'oud-argent', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B9%D9%88%D8%AF-%D8%A7%D8%B1%D8%AC%D9%8A%D9%86%D8%AA/p1988267997' },
  { id: 'amber-cashmere', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B9%D9%86%D8%A8%D8%B1-%D9%83%D8%A7%D8%B4%D9%85%D9%8A%D8%B1/p1569128723' },
  { id: 'liana', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%84%D9%8A%D8%A7%D9%86%D8%A7/p1925160687' },
  { id: 'nowara', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%86%D9%88%D8%A7%D8%B1%D8%A7/p1256502465' },
  { id: 'moudhi', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%85%D9%88%D8%B6%D9%8A/p1288952363' },
  { id: 'rozana', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D9%88%D8%B2%D8%A7%D9%86%D8%A7/p25373017' },
  { id: 'emotion', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A7%D9%8A%D9%85%D9%88%D8%B4%D9%86/p341537925' },
  { id: 'attraction', url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A7%D8%AA%D8%B1%D8%A7%D9%83%D8%B4%D9%86/p64193430' }
];

async function parseProduct(item) {
  console.log(`Fetching: ${item.id} ...`);
  const res = await fetch(item.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();

  // 1. Title
  let title = '';
  const titleMatch = html.match(/<title>([^<|]+)/i);
  if (titleMatch) title = titleMatch[1].trim();

  // 2. Price in SAR
  let sarPrice = 95;
  const jsonLdMatch = html.match(/"price"\s*:\s*(\d+(?:\.\d+)?)/);
  if (jsonLdMatch) {
    sarPrice = parseFloat(jsonLdMatch[1]);
  }

  // 3. Zahrat Beesan Price: (SAR / 5.29) + 12 JOD
  const baseJod = Math.round(sarPrice / 5.29);
  const finalJod = baseJod + 12;

  // 4. Description
  // Search for the description container in Salla template
  let descHtml = '';
  let descText = '';

  // Look for product description block
  const descIdx = html.indexOf('class="product-description');
  const contentIdx = html.indexOf('content--product-description');
  const articleIdx = html.indexOf('<article');
  
  // Find paragraphs that describe the perfume
  // In Salla, it's often inside <div class="description-paragrah"> or article
  const descRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs = [];
  let m;
  while ((m = descRegex.exec(html)) !== null) {
    const pText = m[1].replace(/<[^>]+>/g, '').trim();
    if (pText.includes('مكونات') || pText.includes('الافتتاحية') || pText.includes('القاعدة') || pText.includes('الروائح') || pText.includes('مواصفات') || pText.includes('عطر') || pText.includes('الحجم')) {
      paragraphs.push(m[0]);
    }
  }

  // Fallback to meta description if empty
  const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

  // 5. Images
  const regex = /https:\/\/cdn\.salla\.sa\/Dqvgy\/[a-zA-Z0-9_\-\.]+\.(?:png|jpg|jpeg|webp)/gi;
  const matches = [...new Set(html.match(regex) || [])];
  
  // Find the primary high-res 1000x1000 bottle image
  const primary1000 = matches.find(img => img.includes('1000x1000'));
  const primary500 = matches.find(img => img.includes('500x500'));
  const mainBottle = primary1000 || primary500 || matches[0];

  // Gallery and description images
  const galleryImages = matches.filter(img => !img.includes('store-') && !img.includes('favicon'));

  return {
    id: item.id,
    title,
    url: item.url,
    brand: 'دار غلاتي (Ghalati)',
    brandEn: 'GHALATI',
    sarPrice,
    baseJod,
    finalJod,
    metaDesc,
    paragraphs,
    mainBottleUrl: mainBottle,
    galleryImages: galleryImages.slice(0, 6)
  };
}

async function run() {
  const products = [];
  for (const item of productUrls) {
    try {
      const prod = await parseProduct(item);
      products.push(prod);
    } catch(e) {
      console.error(`Error parsing ${item.id}:`, e);
    }
  }

  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'ghalati_products.json');
  fs.writeFileSync(outFile, JSON.stringify(products, null, 2), 'utf8');
  console.log(`Saved ${products.length} products to ${outFile}`);
}

run().catch(console.error);
