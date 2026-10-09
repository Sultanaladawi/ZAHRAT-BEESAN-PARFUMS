const fs = require('fs');
const content = fs.readFileSync('public/js/houses.js', 'utf8');

// Match houses array items
const houses = [];
const idRegex = /id:\s*["']([^"']+)["'],\s*nameAr:\s*["']([^"']+)["'],\s*nameEn:\s*["']([^"']+)["']/g;
let m;
while ((m = idRegex.exec(content)) !== null) {
  houses.push({ id: m[1], nameAr: m[2], nameEn: m[3] });
}

console.log('Total houses in houses.js:', houses.length);

const hasOfficialImage = [];
const needsOfficialLogo = [];

houses.forEach(h => {
  const svgPath = 'public/images/brands/' + h.id + '.svg';
  const pngPath = 'public/images/brands/' + h.id + '.png';
  let hasOfficial = false;
  if (fs.existsSync(svgPath)) {
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    if (svgContent.includes('image href="data:image') || fs.existsSync(pngPath)) {
      hasOfficial = true;
    }
  }
  if (hasOfficial) {
    hasOfficialImage.push(h);
  } else {
    needsOfficialLogo.push(h);
  }
});

console.log(`\n=== OFFICIAL LOGO PRESENT (${hasOfficialImage.length} houses) ===`);
hasOfficialImage.forEach(h => console.log(`✓ ${h.id.padEnd(20)} | ${h.nameAr.padEnd(25)} | ${h.nameEn}`));

console.log(`\n=== STILL NEEDS OFFICIAL LOGO (${needsOfficialLogo.length} houses) ===`);
needsOfficialLogo.forEach(h => console.log(`✗ ${h.id.padEnd(20)} | ${h.nameAr.padEnd(25)} | ${h.nameEn}`));
