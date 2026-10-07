async function inspectRaw() {
  const url = `https://api.salla.dev/store/v1/products?filters[category_id]=1377526805&limit=2`;
  const res = await fetch(url, {
    headers: {
      'Origin': 'https://ghalati.com',
      'Referer': 'https://ghalati.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'App-Store-Id': '1939633486',
      'Store-Identifier': '1939633486',
      'Accept': 'application/json, text/plain, */*'
    }
  });
  const json = await res.json();
  const rawItem = json.data[0];
  console.log('Keys in raw item:', Object.keys(rawItem));
  console.log('price field:', rawItem.price);
  console.log('main_image:', rawItem.main_image);
  console.log('image:', rawItem.image);
  console.log('thumbnail:', rawItem.thumbnail);
  console.log('images:', rawItem.images);
}

inspectRaw().catch(console.error);
