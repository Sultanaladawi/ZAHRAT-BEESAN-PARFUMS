const fs = require('fs');

async function test() {
  const url = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%81%D9%8A%D9%86%D8%AA%D8%A7%D8%AC/p1644587878';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const start = html.indexOf('<div id="details_table"');
  const end = html.indexOf('<div id="reviews"', start);
  const block = html.slice(start, end !== -1 ? end : start + 3000);
  console.log(block
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  );
}
test();
