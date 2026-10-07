const fs = require('fs');

async function run() {
  const res = await fetch('https://www.boutiqaat.com/ar-ae/men/moudi-edp-100ml-unisex-by-ghalati-orl-00005462-1/p/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();
  fs.writeFileSync('scripts/moudi_boutiqaat.html', html);
  console.log('Fetched HTML, length:', html.length);
  
  // Extract text inside description or specifications
  const lines = html.split('\n');
  for (const line of lines) {
    if (line.includes('موضي') || line.includes('عطر') || line.includes('الافتتاحية') || line.includes('المكونات') || line.includes('مقدمة') || line.includes('قلب') || line.includes('قاعدة')) {
      const clean = line.replace(/<[^>]+>/g, ' ').trim();
      if (clean.length > 20 && clean.length < 500) {
        console.log('LINE:', clean);
      }
    }
  }
}

run();
