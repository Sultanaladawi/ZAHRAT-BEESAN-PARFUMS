const fs = require('fs');

async function getDetails(name, url, outHtml) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const html = await res.text();
      fs.writeFileSync(outHtml, html);
      console.log(`✓ Fetched ${name}, length: ${html.length}`);

      const desc = html.match(/"description":\s*"(.*?)"/);
      if (desc) console.log(`${name} JSON-LD Desc:`, desc[1]);

      const lines = html.split('\n');
      for (const line of lines) {
        if (line.includes('مقدمة') || line.includes('الافتتاحية') || line.includes('قلب') || line.includes('قاعدة')) {
          const clean = line.replace(/<[^>]+>/g, ' ').trim();
          if (clean.length > 15 && clean.length < 500) {
            console.log(`${name} Notes line:`, clean);
          }
        }
      }
    }
  } catch(e) {
    console.error(`Error ${name}:`, e.message);
  }
}

async function run() {
  await getDetails(
    'Rasayil Haneen',
    'https://www.boutiqaat.com/ar-ae/men/rasayil-haneen-edp-100ml-unisex-by-ghalati-orl-00005469-1/p/',
    'scripts/haneen_boutiqaat.html'
  );
  await getDetails(
    'Rasayil Shawq',
    'https://www.boutiqaat.com/ar-ae/men/rasayil-shawq-edp-100ml-unisex-by-ghalati-orl-00005451-1/p/',
    'scripts/shawq_boutiqaat.html'
  );
}

run();
