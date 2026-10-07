const fs = require('fs');

const html = fs.readFileSync('scripts/fragrantica_ghalati.html', 'utf8');
const regex = /<a\s+href="(\/perfumes\/Ghalati\/[^"]+)"[^>]*title="([^"]+)"/gi;
const list = [];
let m;
while ((m = regex.exec(html)) !== null) {
  const url = 'https://www.fragranticarabia.com' + m[1];
  const title = m[2];
  const idM = m[1].match(/-(\d+)\.html/);
  const fid = idM ? idM[1] : null;
  if (!list.some(x => x.fid === fid)) {
    list.push({ fid, title, url });
  }
}

console.log('Total unique perfumes on Fragrantica:', list.length);
list.forEach(p => console.log(`${p.fid} | ${p.title} | ${p.url}`));

fs.writeFileSync('data/fragrantica_all_ghalati.json', JSON.stringify(list, null, 2), 'utf8');
