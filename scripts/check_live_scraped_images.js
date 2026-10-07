const fs = require('fs');

const live = JSON.parse(fs.readFileSync('data/live_scraped_ghalati.json', 'utf8'));
console.log('Checking all items in live_scraped_ghalati.json...');

live.forEach(item => {
  if (item.parsed) {
    const p = item.parsed;
    const keys = Object.keys(p);
    // check if any key has images or urls
    const imgKeys = keys.filter(k => k.toLowerCase().includes('img') || k.toLowerCase().includes('image') || k.toLowerCase().includes('gallery'));
    if (imgKeys.length > 0) {
      console.log(item.id, imgKeys);
    }
  }
});
