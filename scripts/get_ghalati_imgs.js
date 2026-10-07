async function getImages() {
  const url = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A8%D8%B1%D8%A8%D9%84-%D8%B1%D9%88%D8%B2/p133723763';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
  const html = await res.text();
  const regex = /https:\/\/cdn\.salla\.sa\/[^"'\s>]+\.(?:png|jpg|jpeg|webp)/gi;
  const matches = html.match(regex) || [];
  console.log('Unique images on page:');
  const unique = [...new Set(matches)];
  for (const u of unique) {
    console.log(' -', u);
  }
}
getImages().catch(console.error);
