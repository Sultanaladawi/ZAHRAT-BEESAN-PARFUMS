async function searchProducts() {
  const sitemaps = ['https://ghalati.com/ar/sitemap-1.xml', 'https://ghalati.com/ar/sitemap-2.xml'];
  const allUrls = [];
  for (const s of sitemaps) {
    const res = await fetch(s);
    const txt = await res.text();
    const regex = /<loc>([^<]+)<\/loc>/g;
    let m;
    while ((m = regex.exec(txt)) !== null) {
      const u = decodeURIComponent(m[1]);
      if (u.includes('/p') && u.includes('/ar/')) {
        allUrls.push(u);
      }
    }
  }

  console.log(`Total Arabic products in sitemap: ${allUrls.length}`);
  
  const targets = [
    'رسائل', 'حنين', 'شوق', 'سبرينج', 'سباركل', 'صن-رايز', 'بوانوير', 'جست',
    'شيدز', 'ابسيليوت', 'ريكا', '1932', 'بلاتينيوم', 'سبلايم-وود', 'امبيشيس',
    '2016', 'ماونتن', 'سبلايم-فلور', 'مسك', 'معطرات', 'يوتوبيا', '1985', '1981', '1727', 'فارنا', 'مون-دو', 'فينتاج'
  ];

  const matched = [];
  for (const u of allUrls) {
    for (const t of targets) {
      if (u.includes(t)) {
        matched.push(u);
        break;
      }
    }
  }

  console.log(`Matched products (${matched.length}):`);
  matched.forEach(u => console.log(u));
}

searchProducts().catch(console.error);
