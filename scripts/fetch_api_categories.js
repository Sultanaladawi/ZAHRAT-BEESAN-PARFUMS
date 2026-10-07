const fs = require('fs');

async function getCategory(catId) {
  console.log(`Fetching catId ${catId}...`);
  const url = `https://api.salla.dev/store/v1/products?category_id=${catId}&limit=50`;
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
  console.log(`Response status for ${catId}:`, res.status);
  const json = await res.json();
  return json.data || [];
}

async function run() {
  const bakhoor = await getCategory('1377526805');
  console.log('Bakhoor items count:', bakhoor.length);
  bakhoor.forEach(b => console.log(` - [${b.price?.amount} SAR] ${b.name}`));

  const bundles = await getCategory('103216922');
  console.log('\nBundles items count:', bundles.length);
  bundles.forEach(b => console.log(` - [${b.price?.amount} SAR] ${b.name}`));

  fs.writeFileSync('./data/ghalati_bakhoor_raw.json', JSON.stringify(bakhoor, null, 2), 'utf8');
  fs.writeFileSync('./data/ghalati_bundles_raw.json', JSON.stringify(bundles, null, 2), 'utf8');
  console.log('\nSaved data successfully!');
}

run().catch(console.error);
