const fs = require('fs');

async function test() {
  const res = await fetch('https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%85%D8%A7%D8%AC%D8%B3%D8%AA%D9%83-%D9%88%D9%88%D8%AF/p1249911952');
  const html = await res.text();
  const startIdx = html.indexOf('<div id="details_table" class="tab-pane');
  console.log('startIdx:', startIdx);
  const endIdx = html.indexOf('<div id="reviews"', startIdx);
  console.log('endIdx:', endIdx);
  const block = html.slice(startIdx, endIdx);
  console.log('Majestic wood full text:');
  console.log(block
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  );
}
test();
