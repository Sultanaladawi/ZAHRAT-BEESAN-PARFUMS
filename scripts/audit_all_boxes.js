const fs = require('fs');
const perfumes = require('../public/data/perfumes.json');

const nullBoxes = perfumes.filter(p => p.categoryType === 'perfume' && !p.boxImage);
console.log('Perfumes with null boxImage:', nullBoxes.length);

const scriptsFiles = fs.readdirSync(__dirname);
const publicImages = fs.readdirSync('public/images');

nullBoxes.forEach(p => {
  const matchingScript = scriptsFiles.filter(f => f.toLowerCase().includes(p.id.toLowerCase()));
  const matchingPublic = publicImages.filter(f => f.toLowerCase().includes(p.id.toLowerCase()) && (f.includes('box') || f.includes('secundar') || f.includes('pack')));
  console.log(`${p.id} (${p.title}):`);
  if (matchingScript.length) console.log('  scripts:', matchingScript);
  if (matchingPublic.length) console.log('  public:', matchingPublic);
  if (!matchingScript.length && !matchingPublic.length) console.log('  none found locally');
});
