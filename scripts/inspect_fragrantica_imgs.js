const fs = require('fs');
const html = fs.readFileSync('scripts/sample_fragrantica_purple_rose.html', 'utf8');
const imgs = [...html.matchAll(/https:\/\/[^"'<>\s]+\.(?:jpg|jpeg|png|webp)/gi)].map(m => m[0]);
const fimgs = [...new Set(imgs.filter(u => u.includes('fimgs.net')))];
console.log('Total fimgs:', fimgs.length);
console.log(fimgs);
