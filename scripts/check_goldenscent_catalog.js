async function check() {
  const urls = [
    'https://www.goldenscent.com/p/ghalati-bois-noir-edp',
    'https://www.goldenscent.com/p/ghalati-bois-noir',
    'https://www.goldenscent.com/ar/p/ghalati-bois-noir-edp'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(url, res.status);
      if (res.ok) {
        const text = await res.text();
        const imgs = text.match(/https:\/\/assets\.goldenscent\.com\/catalog\/product\/[a-zA-Z0-9_\/.-]+/g) || [];
        console.log('Images:', [...new Set(imgs)]);
      }
    } catch (e) {
      console.log(url, e.message);
    }
  }
}

check();
