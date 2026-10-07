async function testEndpoints() {
  const catId = '1377526805';
  const endpoints = [
    `https://ghalati.com/api/v1/categories/${catId}/products`,
    `https://ghalati.com/api/v1/products?category_id=${catId}`,
    `https://ghalati.com/api/v1/products?source=product.index&source_value=${catId}`,
    `https://ghalati.com/api/v1/products?source=category&source_id=${catId}`,
    `https://ghalati.com/api/v1/products`,
    `https://ghalati.com/api/products?category_id=${catId}`,
    `https://ghalati.com/products?category_id=${catId}`,
    `https://ghalati.com/ar/products?category_id=${catId}`
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      console.log(ep, '-> Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
      if (res.ok) {
        const txt = await res.text();
        console.log('   Response snippet:', txt.slice(0, 200));
      }
    } catch (e) {
      console.log(ep, '-> Error:', e.message);
    }
  }
}

testEndpoints();
