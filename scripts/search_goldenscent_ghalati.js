async function searchAllGhalati() {
  const urls = [
    'https://www.goldenscent.com/p/ghalati-sunrise-edp',
    'https://www.goldenscent.com/p/ghalati-oud-absolute-edp',
    'https://www.goldenscent.com/p/ghalati-utopia-platinum-edp',
    'https://www.goldenscent.com/p/ghalati-mountain-leather-edp',
    'https://www.goldenscent.com/p/ghalati-sublime-woods-edp',
    'https://www.goldenscent.com/p/ghalati-absolute-musk-edp',
    'https://www.goldenscent.com/p/ghalati-eloquent-edp',
    'https://www.goldenscent.com/p/ghalati-peach-musk-edp',
    'https://www.goldenscent.com/p/ghalati-carmine-soul-edp',
    'https://www.goldenscent.com/p/ghalati-dama-edp',
    'https://www.goldenscent.com/p/ghalati-exotic-wood-edp',
    'https://www.goldenscent.com/p/ghalati-rose-intense-edp',
    'https://www.goldenscent.com/p/ghalati-cherry-musk-edp',
    'https://www.goldenscent.com/p/ghalati-honest-edp'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const text = await res.text();
        const m = text.match(/https:\/\/assets\.goldenscent\.com\/catalog\/product\/[a-zA-Z0-9_\/.-]+_2\.png/g) || [];
        console.log(url.split('/').pop(), '->', [...new Set(m)]);
      } else {
        console.log(url.split('/').pop(), '-> status:', res.status);
      }
    } catch (e) {
      console.log(url.split('/').pop(), '-> error:', e.message);
    }
  }
}

searchAllGhalati();
