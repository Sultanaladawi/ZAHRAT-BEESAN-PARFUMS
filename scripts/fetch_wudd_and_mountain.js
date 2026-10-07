const fs = require('fs');

async function download(url, out) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(out, buf);
      console.log('✓ Downloaded:', out, 'size:', buf.length);
      return true;
    } else {
      console.log('✗ Failed:', url, res.status);
    }
  } catch(e) {
    console.log('✗ Error:', url, e.message);
  }
  return false;
}

async function run() {
  console.log('Downloading Boutiqaat images for Rasayil Wudd (ORL-00005459):');
  for (let i = 1; i <= 5; i++) {
    await download(
      `https://v2cdn.boutiqaat.com/media/catalog/product/O/R/ORL-00005459-${i}.jpg`,
      `scripts/ORL-00005459-${i}.jpg`
    );
  }

  // Fetch Boutiqaat page for Rasayil Wudd
  try {
    const res = await fetch('https://www.boutiqaat.com/ar-sa/men/rasayil-wd-edp-100ml-unisex-by-ghalati-orl-00005459-1/p/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.ok) {
      const html = await res.text();
      fs.writeFileSync('scripts/wudd_boutiqaat.html', html);
      console.log('✓ Fetched Rasayil Wudd page, length:', html.length);
    }
  } catch(e) {
    console.log('Boutiqaat page error:', e.message);
  }

  // Fetch Golden Wings for Mountain Leather
  try {
    const res = await fetch('https://goldenwingas.com/%D8%B9%D8%B7%D8%B1-%D9%85%D8%A7%D9%88%D9%86%D8%AA%D9%86-%D9%84%D9%8A%D8%B0%D8%B1/p112281132', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.ok) {
      const html = await res.text();
      fs.writeFileSync('scripts/gw_mountain_leather.html', html);
      console.log('✓ Fetched Golden Wings Mountain Leather, length:', html.length);
    }
  } catch(e) {
    console.log('Golden Wings error:', e.message);
  }
}

run();
