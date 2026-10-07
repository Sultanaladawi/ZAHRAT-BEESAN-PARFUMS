const fs = require('fs');

async function test() {
  const res = await fetch('https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B9%D9%86%D8%A8%D8%B1-%D9%83%D8%A7%D8%B4%D9%85%D9%8A%D8%B1/p1569128723');
  const html = await res.text();
  const m = html.match(/<div\s+id="details_table"\s+class="[^"]*tab-pane[^"]*"[^>]*>/i);
  if (!m) return console.log('no match');
  const start = m.index;
  const end = html.indexOf('<div id="reviews"', start);
  console.log(html.slice(start, end)
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
  );
}
test();
