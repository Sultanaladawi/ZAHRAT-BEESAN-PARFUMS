async function run() {
  try {
    const res = await fetch('https://goldenwingas.com/%D8%B9%D8%B7%D8%B1-%D8%B1%D9%88%D8%B2%D8%A7%D9%86%D8%A7/p1287786639', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    const imgs = html.match(/https:\/\/[^"']+\.(?:jpg|png|webp|jpeg)/gi) || [];
    console.log('Images:', [...new Set(imgs)].filter(x => x.includes('cdn') || x.includes('salla') || x.includes('product') || x.includes('goldenwing')));
  } catch(e) {
    console.error(e.message);
  }
}
run();
