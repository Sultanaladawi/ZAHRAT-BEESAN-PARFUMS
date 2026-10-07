const fs = require('fs');
const html = fs.readFileSync('scripts/moudi_boutiqaat.html', 'utf8');

// Search for JSON inside the HTML or key strings
const matches = html.match(/"description":\s*"(.*?)"/g);
if (matches) {
  matches.slice(0, 5).forEach(m => console.log('MATCH:', m.slice(0, 300)));
}

// Look for product details
const regex = /"name":\s*"([^"]+)"/g;
let m;
while ((m = regex.exec(html)) !== null) {
  if (m[1].includes('Moudi') || m[1].includes('موضي')) {
    console.log('Found product name:', m[1]);
  }
}

// Look for notes or arabic description
const arabicMatches = html.match(/عطر\s+موضي[\s\S]{1,600}/g);
if (arabicMatches) {
  arabicMatches.slice(0, 3).forEach(am => console.log('ARABIC:', am));
}
