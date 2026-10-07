const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

// Check what descriptions exist in remaining_53_scraped.json, full_53_products.json, ghalati_complete_store_catalog.json
const files = [
  'data/full_53_products.json',
  'data/remaining_53_scraped.json',
  'data/ghalati_complete_store_catalog.json',
  'data/ghalati_all_sections_raw.json'
];

const allScrapedMap = new Map();

files.forEach(f => {
  if (fs.existsSync(f)) {
    const list = JSON.parse(fs.readFileSync(f, 'utf8'));
    list.forEach(item => {
      const idKey = item.id ? String(item.id) : null;
      const urlKey = item.url ? item.url : null;
      const nameKey = item.title || item.name;
      
      const entry = {
        id: idKey,
        name: nameKey,
        url: urlKey,
        description: item.description || item.overview || '',
        opening: item.opening || '',
        heart: item.heart || '',
        base: item.base || '',
        prominent: item.prominent || '',
        specs: item.specs || {}
      };

      if (idKey) allScrapedMap.set('id:' + idKey, entry);
      if (urlKey) allScrapedMap.set('url:' + urlKey, entry);
      if (nameKey) allScrapedMap.set('name:' + nameKey.trim(), entry);
    });
  }
});

console.log('Total keys in allScrapedMap:', allScrapedMap.size);

let foundWithNotes = 0;
let foundWithDescOnly = 0;
let notFoundInDump = 0;

perfumes.forEach(p => {
  const m = p.url && p.url.match(/\/p(\d+)/);
  const pid = m ? m[1] : null;
  const entry = allScrapedMap.get('id:' + pid) || allScrapedMap.get('url:' + p.url) || allScrapedMap.get('name:' + p.title);
  if (entry) {
    if (entry.opening || entry.heart) {
      foundWithNotes++;
    } else if (entry.description) {
      foundWithDescOnly++;
    }
  } else {
    notFoundInDump++;
  }
});

console.log(`In dumps: With notes: ${foundWithNotes}, With desc only: ${foundWithDescOnly}, Not found: ${notFoundInDump}`);
