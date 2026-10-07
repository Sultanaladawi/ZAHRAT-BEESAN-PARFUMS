async function run() {
  const url = 'https://ghalati.com/ar/%D8%A7%D8%AE%D8%AA%D8%B1-2-%D8%A8-96-%D8%B1%D9%8A%D8%A7%D9%84/c1389534759';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();
  console.log('length:', html.length);
  const pMatches = html.match(/\/p\d+/g);
  console.log('p matches:', pMatches ? pMatches.length : 0);
  
  // Find all URLs inside the page
  const allUrls = html.match(/https?:\/\/[^\s"'<>]+/g) || [];
  const ghalatiUrls = [...new Set(allUrls.filter(u => u.includes('ghalati.com')))];
  console.log('Ghalati URLs found:', ghalatiUrls.length);
  ghalatiUrls.slice(0, 30).forEach(u => console.log(decodeURIComponent(u)));
}

run();
