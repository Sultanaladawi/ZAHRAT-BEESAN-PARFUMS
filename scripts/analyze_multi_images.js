const fs = require('fs');
const salla = JSON.parse(fs.readFileSync('data/salla_perfume_images.json', 'utf8'));
for (const [id, info] of Object.entries(salla)) {
  if (info.images.length > 1) {
    console.log('[' + id + '] (' + info.title + '): ' + info.images.length + ' images');
    info.images.forEach(img => console.log('   ' + img));
  }
}
