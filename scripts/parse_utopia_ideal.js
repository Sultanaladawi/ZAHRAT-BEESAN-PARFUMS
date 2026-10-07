const fs = require('fs');

async function getDetails() {
  // 1. Fetch Salla page
  try {
    const sallaUrl = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%8A%D9%88%D8%AA%D9%88%D8%A8%D9%8A%D8%A7-%D8%A7%D9%8A%D8%AF%D9%8A%D8%A7%D9%84/p1177605477';
    const res = await fetch(sallaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const html = await res.text();
      fs.writeFileSync('scripts/salla_utopia_ideal.html', html);
      console.log('✓ Fetched Salla page, length:', html.length);
    }
  } catch(e) {
    console.error('Salla fetch error:', e.message);
  }

  // 2. Fetch Golden Scent page
  try {
    const gsUrl = 'https://www.goldenscent.com/p/ghalati-utopia-ideal-edp';
    const res = await fetch(gsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const html = await res.text();
      fs.writeFileSync('scripts/gs_utopia_ideal.html', html);
      console.log('✓ Fetched GS page, length:', html.length);
    }
  } catch(e) {
    console.error('GS fetch error:', e.message);
  }
}

getDetails();
