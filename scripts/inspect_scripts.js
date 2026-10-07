const fs = require('fs');
const html = fs.readFileSync('./scripts/cat_debug.html', 'utf8');
const regex = /src="([^"]+)"/g;
let m;
const srcs = [];
while ((m = regex.exec(html)) !== null) {
  srcs.push(m[1]);
}
console.log('Script srcs:');
srcs.forEach(s => console.log('  ', s));
