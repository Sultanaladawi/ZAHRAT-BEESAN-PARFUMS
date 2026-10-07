const fs = require('fs');
const path = require('path');

const catalog = JSON.parse(fs.readFileSync('data/ghalati_complete_store_catalog.json', 'utf8'));
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

const normalize = (str) => {
  return (str || '')
    .replace(/[^\u0621-\u064A0-9a-zA-Z]/g, '')
    .replace(/(ال|عطر|بخور|معمول|تولة|زيت|باقة|مجموعة|بكج)/g, '')
    .toLowerCase();
};

const missing = [];
catalog.forEach((item) => {
  const cNorm = normalize(item.name);
  const found = perfumes.find((p) => {
    const pUrlMatch = p.url && item.url && p.url.includes(item.id);
    const pNormTitle = normalize(p.title);
    const pNormId = normalize(p.id);
    return pUrlMatch || pNormTitle === cNorm || pNormId === cNorm || (cNorm.length > 3 && pNormTitle.includes(cNorm));
  });

  if (!found) {
    missing.push(item);
  }
});

// Also add Honest
missing.push({
  id: '864997206',
  name: 'عطر هونست',
  categorySlug: 'bestsellers-summer',
  categoryLabel: 'العطور الأكثر طلباً والانتعاش الصيفي',
  sarPrice: 95,
  regularSarPrice: 199,
  jodPrice: 30,
  url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%87%D9%88%D9%86%D8%B3%D8%AA/p864997206',
  originalImage: 'https://cdn.salla.sa/Dqvgy/ada2c258-6e50-4b80-b7f7-2bc2dc369352-1000x1000-Yph90F1R1zG5iTA7araP6fmIW1jbDYQ3puES1n9a.png',
  thumbnail: 'https://cdn.salla.sa/Dqvgy/804029a1-b761-4d13-b5b8-ad87092c0d26-500x500-Yph90F1R1zG5iTA7araP6fmIW1jbDYQ3puES1n9a.png',
  description: '',
  isAvailable: true
});

console.log(`Found ${missing.length} missing products to scrape.`);

async function scrapeAll() {
  const scraped = [];
  for (let i = 0; i < missing.length; i++) {
    const item = missing[i];
    console.log(`[${i + 1}/${missing.length}] Scraping: ${item.name} (${item.url})...`);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const html = await res.text();

      // Extract title
      const titleMatch = html.match(/<title>([^<|]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : item.name;

      // Extract description
      let desc = '';
      const descMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (descMatch) {
        desc = descMatch[1].replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n').trim();
      } else {
        const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
        if (metaMatch) desc = metaMatch[1].trim();
      }

      // Extract images
      const imgMatches = [...html.matchAll(/https:\/\/cdn\.salla\.sa\/Dqvgy\/[a-zA-Z0-9_\-\.]+\.(?:png|jpg|jpeg)/gi)].map(m => m[0]);
      const uniqueImgs = [...new Set(imgMatches)].filter(u => !u.includes('favicon') && !u.includes('store-logo'));

      // Extract price if present
      let sarPrice = item.sarPrice;
      const priceRegex = /"price"\s*:\s*(\d+(?:\.\d+)?)/;
      const pMatch = html.match(priceRegex);
      if (pMatch && parseFloat(pMatch[1]) > 0) {
        sarPrice = parseFloat(pMatch[1]);
      }

      const baseJod = Math.round(sarPrice / 5.29);
      const finalJod = baseJod + 12;

      scraped.push({
        id: item.id,
        name: item.name,
        title,
        sarPrice,
        baseJod,
        finalJod,
        categorySlug: item.categorySlug,
        categoryLabel: item.categoryLabel,
        url: item.url,
        description: desc,
        originalImage: item.originalImage || uniqueImgs[0],
        images: uniqueImgs
      });
    } catch (err) {
      console.error(`Error scraping ${item.name}:`, err.message);
      const baseJod = Math.round(item.sarPrice / 5.29);
      scraped.push({
        id: item.id,
        name: item.name,
        title: item.name,
        sarPrice: item.sarPrice,
        baseJod,
        finalJod: baseJod + 12,
        categorySlug: item.categorySlug,
        categoryLabel: item.categoryLabel,
        url: item.url,
        description: '',
        originalImage: item.originalImage,
        images: [item.originalImage].filter(Boolean)
      });
    }

    // Small delay to be polite
    await new Promise(r => setTimeout(r, 120));
  }

  const outPath = path.join(__dirname, '..', 'data', 'remaining_53_scraped.json');
  fs.writeFileSync(outPath, JSON.stringify(scraped, null, 2), 'utf8');
  console.log(`\nSuccessfully scraped and saved ${scraped.length} items to ${outPath}`);
}

scrapeAll();
