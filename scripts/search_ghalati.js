async function testSallaApi() {
  const catId = '1377526805';
  const urls = [
    `https://api.salla.dev/store/v1/products?category_id=${catId}`,
    `https://api.salla.dev/store/v1/products?source=product.index&source_value=${catId}`,
    `https://api.salla.dev/store/v1/categories/${catId}/products`,
    `https://api.salla.dev/store/v1/products/search?q=رجوة`,
    `https://api.salla.dev/store/v1/products?keyword=رجوة`
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: {
          'Origin': 'https://ghalati.com',
          'Referer': 'https://ghalati.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'App-Store-Id': '1939633486',
          'Store-Identifier': '1939633486',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      console.log(u, '-> Status:', res.status);
      if (res.ok) {
        const json = await res.json();
        console.log('   Data count:', json.data ? json.data.length : 'no data array');
        if (json.data && json.data.length > 0) {
          console.log('   First item name:', json.data[0].name, 'url:', json.data[0].url);
        }
      } else {
        console.log('   Error body:', await res.text());
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

testSallaApi().catch(console.error);
