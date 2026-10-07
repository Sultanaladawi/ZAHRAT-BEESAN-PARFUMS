async function discover() {
  try {
    const res = await fetch('https://ghalati.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    console.log('Homepage fetched, length:', html.length);

    // Extract categories or product links
    const pRegex = /href="(https:\/\/ghalati\.com\/ar\/[^"]+)"/g;
    const links = new Set();
    let m;
    while ((m = pRegex.exec(html)) !== null) {
      links.add(m[1]);
    }
    
    console.log('\n--- Discovered Links on Homepage ---');
    for (const l of links) {
      if (l.includes('/p') || l.includes('/category/') || l.includes('categories')) {
        console.log(decodeURIComponent(l));
      }
    }
  } catch(e) {
    console.error('Error fetching homepage:', e.message);
  }
}

discover();
