async function fetchCategory(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    console.log('Category:', url, 'Length:', html.length);
    const matches = [...html.matchAll(/href="([^"]*\/p\d+)"/g)];
    const urls = [...new Set(matches.map(m => decodeURIComponent(m[1])))];
    console.log('Found product URLs:', urls.length);
    urls.forEach(u => console.log('  ->', u));
  } catch (e) {
    console.error('Error fetching category:', e.message);
  }
}

async function run() {
  console.log('--- Category 1 (Gifting & Sets) ---');
  await fetchCategory('https://ghalati.com/ar/c103216922');
  console.log('\n--- Category 2 (Bakhoor & Incense) ---');
  await fetchCategory('https://ghalati.com/ar/c1377526805');
}

run();
