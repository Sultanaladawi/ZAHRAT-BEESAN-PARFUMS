const fs = require('fs');
const path = require('path');

async function inspectProduct(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();

  // Find product name
  let title = '';
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/\|.*/, '').replace(/-.*/, '').trim();
  }

  // Find price from JSON-LD or html
  let price = 95; // default fallback
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdMatches) {
    const raw = block.replace(/<\/?script[^>]*>/gi, '');
    try {
      const data = JSON.parse(raw);
      if (data.offers && data.offers.price) {
        price = parseFloat(data.offers.price);
        break;
      }
    } catch(e){}
  }

  // Find description container
  // Salla description is usually inside a container with class or id description
  let descriptionHtml = '';
  let descriptionText = '';
  const descBlockMatch = html.match(/<article[^>]*class="[^"]*article--product[^"]*"[^>]*>([\s\S]*?)<\/article>/i)
    || html.match(/<div[^>]*class="[^"]*product__description[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<div[^>]*id="product-description"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<div[^>]*class="[^"]*content-entry[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (descBlockMatch) {
    descriptionHtml = descBlockMatch[1];
    descriptionText = descriptionHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Images in the page
  const regex = /https:\/\/cdn\.salla\.sa\/[^"'\s<>]+\.(?:png|jpg|jpeg|webp)/gi;
  const allImages = [...new Set(html.match(regex) || [])];

  // Separate product images vs description images
  const productImages = allImages.filter(img => 
    !img.includes('store-') && 
    !img.includes('favicon') && 
    !img.includes('icon') &&
    (img.includes('1000x1000') || img.includes('500x500') || img.includes('Dqvgy'))
  );

  return {
    url,
    title,
    price,
    descriptionText,
    descriptionHtml: descriptionHtml.slice(0, 1000),
    images: productImages
  };
}

(async () => {
  const sampleUrl = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%85%D8%A7%D8%AC%D8%B3%D8%AA%D9%83-%D9%88%D9%88%D8%AF/p1249911952';
  const info = await inspectProduct(sampleUrl);
  console.log('Sample Product Scraped:', JSON.stringify(info, null, 2));
})();
