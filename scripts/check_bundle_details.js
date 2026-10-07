async function checkBundle() {
  const urls = [
    'https://ghalati.com/ar/%D8%A8%D8%A7%D9%82%D8%A9-%D9%85%D9%88%D8%AF%D8%B1%D9%86/p368258849',
    'https://ghalati.com/ar/%D8%A8%D9%83%D8%AC-%D9%85%D8%B9%D8%B7%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D8%AC%D9%88/p1943659770',
    'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%81%D9%8A%D9%86%D8%AA%D8%A7%D8%AC/p1644587878'
  ];

  for (const url of urls) {
    console.log('\n================================');
    console.log('URL:', url);
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const idx = html.indexOf('id="details_table"');
    if (idx !== -1) {
      console.log(html.substring(idx, idx + 2500).replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 20).join('\n'));
    }
  }
}
checkBundle();
