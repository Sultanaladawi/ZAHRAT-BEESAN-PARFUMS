const fs = require('fs');

const html = fs.readFileSync('scripts/fragrantica_ghalati.html', 'utf8');

// Match /perfumes/Ghalati/
const regex = /<a\s+href="(\/perfumes\/Ghalati\/[^"]+)"[^>]*title="([^"]+)"/gi;
const perfumes = [];
let match;
while ((match = regex.exec(html)) !== null) {
  const url = 'https://www.fragranticarabia.com' + match[1];
  const title = match[2];
  perfumes.push({ url, title });
}

console.log('Total Ghalati perfumes matched:', perfumes.length);
perfumes.forEach(p => console.log(p.title, '-->', p.url));
