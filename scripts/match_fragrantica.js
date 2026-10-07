const fs = require('fs');

const fragrantica = JSON.parse(fs.readFileSync('data/fragrantica_all_ghalati.json', 'utf8'));
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

// Manual aliases for spelling variations between Ghalati Arabic transliteration and Fragrantica
const ALIASES = {
  'amber-cashmere': '79184', // Amber Cashmir
  'liana': '79187',          // Layana
  'nowara': '79250',         // Nawara
  'rozana': '79253',         // Rosanna
  'sublime-woods': '84783',  // Sublime Wood
  'cartage-velours': '103288', // Carthage Velours
  'cartage-etoile': '103286',  // Carthage Etoile
  'cartage-noble': '103287',   // Carthage Noble
  'varna-single': '89824',     // Varna
  'vintage': '89823',          // Eau de Vintage
  'mont-dor': '89822',         // Mont d'Or
  'utopia-gist': '79192',      // Utopia Gist
  'utopia-platinum': '89826',  // Utopia Platinum
  'sublime-flowers': '79256',  // Sublime Flowers
  'synergy-homme': '79191',    // Synergy Homme
  'just-amber': '79188',       // Just Amber
  'just-oud': '79189',         // Just Oud
  'just-tobacco': '79251',     // Just Tobacco
  'majestic-wood': '79249',    // Majestic Woods
  'oud-argent': '79185',       // Oud Argent
  'purple-rose': '79186',      // Purple Rose
  'candy-musk': '84786',       // Candy Musk
  'dama': '84781',             // Dama
  'donna-rossa': '84782',      // Donna Rossa
  'eloquent': '79248',         // Eloquent
  'emotion': '79252',          // Emotion
  'heroic': '84784',           // Heroic
  'iris-musk': '79255',        // Iris Musk
  'leather-oud': '84787',      // Leather Oud
  'rica': '84785',             // Rica
  'shades': '79254',           // Shades
  'boudoir': '103316',         // Boudoir
  'eternal-passion': '103317', // Eternal Passion
  'first-impression': '111006',// First Impression
  'most-wanted': '111005',     // Most Wanted
  'seraj': '143758',           // Seraj
  'serenade': '103318',        // Serenade
  'silk-essence': '103319',    // Silk Essence
  'amber-oud': '79247',        // Amber Oud
  'ambitious': '79183',        // Ambitious
  'attraction': '79190'        // Attraction
};

const mapped = [];
const unmapped = [];

perfumes.filter(p => p.categoryType === 'perfume').forEach(p => {
  let fid = ALIASES[p.id];
  let found = null;

  if (fid) {
    found = fragrantica.find(f => f.fid === fid);
  }

  if (found) {
    mapped.push({
      id: p.id,
      title: p.title,
      titleEn: p.titleEn,
      fid: found.fid,
      fTitle: found.title,
      fUrl: found.url
    });
  } else {
    unmapped.push({ id: p.id, title: p.title, titleEn: p.titleEn });
  }
});

console.log(`Successfully mapped: ${mapped.length} perfumes to Fragrantica!`);
console.log(`Unmapped count: ${unmapped.length}`);
unmapped.forEach(u => console.log(`  - [${u.id}] ${u.title}`));

fs.writeFileSync('data/perfume_fragrantica_map.json', JSON.stringify(mapped, null, 2), 'utf8');
