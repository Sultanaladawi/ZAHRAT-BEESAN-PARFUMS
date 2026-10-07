async function fetchHtml() {
  const url = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%87%D9%88%D9%86%D8%B3%D8%AA/p864997206';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  console.log('Length:', html.length);

  // Extract title, price, images, description
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  console.log('Title:', titleMatch ? titleMatch[1] : null);

  const images = [...html.matchAll(/https:\/\/cdn\.salla\.sa\/Dqvgy\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg)/gi)].map(m => m[0]);
  console.log('Unique images:', [...new Set(images)]);

  // Look for json-ld or app data
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1]);
      console.log('JSON-LD schema type:', data['@type']);
      if (data['@type'] === 'Product') {
        console.log('Product schema:', JSON.stringify(data, null, 2));
      }
    } catch (e) {}
  }
}

fetchHtml();
