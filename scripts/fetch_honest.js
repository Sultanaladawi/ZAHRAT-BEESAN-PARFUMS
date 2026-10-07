async function test() {
  const res = await fetch('https://ghalati.com/ar/search?q=%D9%87%D9%88%D9%86%D8%B3%D8%AA', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const match = html.match(/\/p\d+/g);
  console.log('Matches:', [...new Set(match)]);
  const regex = /href="([^"]*\/p\d+)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    console.log('Found product link:', m[1]);
  }
}
test();
