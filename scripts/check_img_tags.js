const fs = require('fs');

async function checkImgs() {
  const url = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D8%B1%D8%A8%D9%84-%D8%B1%D9%88%D8%B2/p133723763';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();

  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  console.log('All image tags:');
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];
    const src = match[1];
    if (src.includes('cdn.salla.sa') || src.includes('files.salla.network')) {
      console.log('--- Found:');
      console.log('SRC:', src);
      console.log('TAG:', tag);
    }
  }
}

checkImgs().catch(console.error);
