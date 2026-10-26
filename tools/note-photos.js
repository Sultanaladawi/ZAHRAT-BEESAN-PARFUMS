#!/usr/bin/env node
/**
 * Ingredient photos for the perfume card: one small round-cropped photo per
 * note key in public/js/notes.js, taken from Wikimedia Commons (free licences
 * only) and saved as public/images/notes/<key>.webp. Credits go to
 * public/data/note-credits.json (shown on /note-credits.html).
 *
 *   node tools/note-photos.js            # fetch notes that have no photo yet
 *   node tools/note-photos.js rose oud   # (re)fetch these notes
 *   node tools/note-photos.js rose=2     # use the 3rd search result for rose
 *
 * PICKS below pins a Commons file for notes where the first search result
 * is wrong or ugly.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { NOTES } = require('../public/js/notes.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'images', 'notes');
const CREDITS = path.join(ROOT, 'public', 'data', 'note-credits.json');
const UA = 'ZahratBeesanCatalog/1.0 (https://zahrat-beesan-parfums.vercel.app; sultanadawi2004@gmail.com)';
const SIZE = 240;
const FREE = /^(cc0|cc[- ]by(?:[- ]sa)?(?:[- ][0-9.]+)?(?:[- ][a-z]+)?|public domain|pd|attribution|no restrictions)/i;

// Search text per note (Commons file search). Defaults to the English name.
const QUERY = {
  'musk': 'Abelmoschus moschatus flower',
  'white-musk': 'cotton plant boll Gossypium',
  'tuberose': 'Polianthes tuberosa white flowers bloom',
  'sandalwood': 'sandalwood wood Santalum album',
  'bergamot': 'bergamot orange fruit',
  'saffron': 'saffron threads crocus',
  'amber': 'labdanum resin',
  'ambroxan': 'ambergris',
  'jasmine': 'Jasminum officinale flowers',
  'jasmine-sambac': 'Jasminum sambac flowers',
  'oud': 'agarwood chips',
  'damask-rose': 'Rosa damascena flower',
  'rose': 'pink rose flower close up',
  'frankincense': 'frankincense resin tears',
  'incense': 'incense smoke burning',
  'patchouli': 'patchouli leaves Pogostemon cablin',
  'pink-pepper': 'pink peppercorns Schinus',
  'black-pepper': 'black peppercorns',
  'vanilla': 'vanilla pods beans',
  'cedar': 'cedar wood logs',
  'woods': 'wood logs cross section',
  'orange-blossom': 'orange blossom flowers Citrus',
  'neroli': 'bitter orange blossom',
  'flowers': 'bouquet of flowers',
  'white-flowers': 'white flowers bouquet',
  'lemon': 'lemon fruit sliced',
  'vetiver': 'vetiver roots',
  'orange': 'orange fruit sliced',
  'lily-of-the-valley': 'Convallaria majalis flowers',
  'lily': 'white lily flower Lilium',
  'peach': 'peach fruit',
  'nectarine': 'nectarine fruit',
  'apricot': 'apricot fruit',
  'cardamom': 'green cardamom pods',
  'mandarin': 'mandarin orange fruit',
  'grapefruit': 'grapefruit halves',
  'blackcurrant': 'blackcurrant berries Ribes nigrum',
  'tonka': 'tonka beans',
  'lavender': 'lavender flowers Lavandula',
  'apple': 'red apple fruit',
  'violet': 'Viola odorata flowers',
  'violet-leaf': 'Viola odorata leaves',
  'iris': 'Iris germanica flower',
  'pear': 'pear fruit',
  'pineapple': 'pineapple fruit',
  'ginger': 'ginger root rhizome',
  'leather': 'brown leather texture',
  'raspberry': 'raspberries fruit',
  'berries': 'mixed berries',
  'blackberry': 'blackberries fruit',
  'strawberry': 'strawberries fruit',
  'cherry': 'cherries fruit',
  'plum': 'plums fruit',
  'fig': 'fig fruit cut',
  'pomegranate': 'pomegranate fruit opened',
  'coconut': 'coconut halves',
  'watermelon': 'watermelon slice',
  'melon': 'cantaloupe melon cut',
  'mango': 'mango fruit',
  'lychee': 'lychee fruit',
  'passion-fruit': 'passion fruit cut',
  'banana': 'bananas fruit',
  'geranium': 'Pelargonium graveolens flowers',
  'cinnamon': 'cinnamon sticks',
  'caramel': 'caramel candies',
  'praline': 'praline nuts caramelized',
  'honey': 'honey dipper',
  'chocolate': 'dark chocolate pieces',
  'coffee': 'roasted coffee beans',
  'almond': 'almonds nuts',
  'guaiac': 'guaiacum wood',
  'nutmeg': 'nutmeg whole',
  'clove': 'cloves spice',
  'spices': 'spices assortment',
  'cumin': 'cumin seeds',
  'mint': 'peppermint leaves',
  'basil': 'basil leaves',
  'sage': 'Salvia officinalis leaves',
  'rosemary': 'rosemary sprig',
  'thyme': 'thyme herb',
  'wormwood': 'Artemisia absinthium',
  'eucalyptus': 'eucalyptus leaves',
  'juniper': 'juniper berries',
  'cypress': 'Cupressus sempervirens branch',
  'pine': 'pine cone needles',
  'benzoin': 'benzoin resin',
  'labdanum': 'Cistus ladanifer flower',
  'myrrh': 'myrrh resin',
  'galbanum': 'galbanum resin',
  'cypriol': 'Cyperus scariosus',
  'oakmoss': 'Evernia prunastri',
  'citrus': 'citrus fruits sliced',
  'cashmere-wood': 'cashmere wool texture',
  'tobacco': 'dried tobacco leaves',
  'peony': 'pink peony flower',
  'magnolia': 'Magnolia grandiflora flower',
  'orchid': 'orchid flower Phalaenopsis',
  'freesia': 'freesia flowers',
  'gardenia': 'Gardenia jasminoides flower',
  'narcissus': 'Narcissus flower',
  'heliotrope': 'Heliotropium arborescens',
  'mimosa': 'Acacia dealbata flowers',
  'ylang-ylang': 'Cananga odorata flower',
  'lotus': 'Nelumbo nucifera flower',
  'hibiscus': 'hibiscus flower',
  'osmanthus': 'Osmanthus fragrans flowers',
  'green-tea': 'green tea leaves',
  'tea': 'black tea leaves',
  'green-leaves': 'green leaves',
  'ivy': 'Hedera helix leaves',
  'aldehydes': 'sparkling bubbles water drops',
  'sea-notes': 'sea waves',
  'sidr': 'Ziziphus spina-christi',
  'tamarind': 'tamarind pods',
  'dates': 'dates fruit',
  'cotton': 'cotton flower',
  'powdery': 'face powder',
  'sugar': 'sugar cubes',
  'milk': 'glass of milk',
  'pistachio': 'pistachios',
  'hazelnut': 'hazelnuts',
  'rum': 'rum bottle glass',
  'birch': 'birch bark',
  'papyrus': 'Cyperus papyrus',
  'bamboo': 'bamboo stalks',
  'carrot-seed': 'carrot seeds',
  'coriander': 'coriander seeds',
  'anise': 'star anise',
  'rhubarb': 'rhubarb stalks',
  'elemi': 'elemi resin',
  'mastic': 'mastic resin tears',
  'lime': 'lime fruit sliced',
  'kumquat': 'kumquat fruit',
  'quince': 'quince fruit',
  'blueberry': 'blueberries',
  'red-fruits': 'fruit assortment',
  'resins': 'tree resin',
  'chamomile': 'chamomile flowers',
  'fir-balsam': 'Abies balsamea branch',
  'linden': 'linden blossom Tilia',
  'balsam': 'Myroxylon balsamum',
  'davana': 'Artemisia pallens',
  'hedione': 'jasmine flowers',
  'raisin': 'raisins',
  'grape': 'grapes bunch',
  'tomato-leaf': 'tomato plant leaves',
  'marigold': 'Tagetes flowers',
  'licorice': 'liquorice root',
  'frangipani': 'Plumeria flowers',
  'petitgrain': 'bitter orange leaves',
  'chestnut': 'chestnuts',
  'immortelle': 'Helichrysum italicum',
  'styrax': 'styrax resin',
  'sesame': 'sesame seeds',
  'guava': 'guava fruit',
  'yuzu': 'yuzu fruit',
  'marine': 'ocean water',
};

// Commons file titles pinned after review (key → "File:…").
const PICKS = {
  'pineapple': "File:Piña (Ananas comosus), Parque Nacional de Lokobe, Nosy Be, Madagascar, 2025-09-21, DD 39.jpg",
  'oud': 'File:Agarwood top grade.jpg',
  'sandalwood': 'File:Sandalwood plant (Santalum album).jpg',
  'eucalyptus': "File:Minimal dark green leaves (Unsplash).jpg",
  'frankincense': "File:Olibanum resin.jpg",
  'resins': "File:Frankincense 2005-12-31.jpg",
  'sesame': "File:Sesame seeds2.jpg",
  'spices': "File:Speculaaskruiden.jpeg",
  'vanilla': "File:Vanilla planifolia 04.JPG",
  'white-flowers': "File:White-Rose-Sitia-Crete.jpg",
  'red-fruits': "File:Red Berry 1.jpg",
  'amber': 'File:Amber (resinite) (Baltics) 2.jpg',
  'ambroxan': 'File:Ambergris.jpg',
  'basil': 'File:Basil leaves.jpg',
  'benzoin': 'File:Kemenyan 110112-11054 tdp.jpg',
  'blackberry': 'File:Blackberries, ripe and unripe.jpeg',
  'caramel': 'File:Caramel-3.jpg',
  'cardamom': 'File:Green Cardamom Pods.jpg',
  'cashmere-wood': 'File:Sidewall (possibly USA), ca. 1890 (CH 18353755).jpg',
  'cotton': 'File:Cotton boll, Floyd County, GA, US.jpg',
  'elemi': 'File:Dammar.jpg',
  'guaiac': 'File:BulnesiaSarmientoi wood.jpg',
  'hazelnut': 'File:Hazelnuts (from France).jpg',
  'jasmine': 'File:Starr-090806-3870-Jasminum grandiflorum-flower-Wailuku-Maui (24344589153).jpg',
  'lavender': 'File:Lavandula angustifolia in Sedovo 1.jpg',
  'mango': 'File:Mango Medley 1.jpg',
  'mastic': 'File:Mastic.jpg',
  'mint': 'File:Mentha sp.001 - A Pobra do Caramiñal.JPG',
  'musk': 'File:Cotton boll nearly ready for harvest.jpg',
  'myrrh': 'File:Myrrh-20180430.jpg',
  'neroli': 'File:Turunç - Citrus aurantium 01.JPG',
  'orange-blossom': 'File:Orange Blossom.JPG',
  'peach': 'File:Autumn Red peaches.jpg',
  'pistachio': 'File:Pistachio Nuts (Day 13 of 50) (23183126032).jpg',
  'pomegranate': 'File:Pomegranate (opened).jpg',
  'powdery': 'File:Talc.jpg',
  'apple': 'File:Red Apple.jpg',
  'bergamot': 'File:Citrus bergamia fructus.jpg',
  'ginger': 'File:Ginger rhizome.jpg',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(params) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', origin: '*', ...params });
  // Commons rate-limits shared addresses hard: wait as long as it asks.
  for (let i = 0; i < 12; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) { await sleep((Number(res.headers.get('retry-after')) || 20) * 1000 + 2000); continue; }
    if (!res.ok) throw new Error(`commons ${res.status}`);
    return res.json();
  }
  throw new Error('commons rate limited');
}

const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// Candidate images for a note, best first: free licence, photo, roughly square.
// Scans, drawings and unrelated objects that searches turn up.
const NOT_A_PHOTO = /drawing|illustrat|plate|engrav|herbarium|specimen|botanical|lithograph|painting|print|book|page|diagram|map|logo|label|stamp|poster|chess|weevil|insect|museum|statue|coin|chart|scan|svg|icon|sign|advert|packag|bottle|perfume|cosmetic|product/i;

async function search(text, pinned) {
  const params = pinned
    ? { action: 'query', titles: pinned, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: 480 }
    : { action: 'query', generator: 'search', gsrsearch: `${text} filetype:bitmap`, gsrnamespace: 6, gsrlimit: 25,
        prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: 480 };
  const json = await api(params);
  const pages = Object.values((json.query && json.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  return pages.map(p => {
    const ii = (p.imageinfo || [])[0] || {};
    const m = ii.extmetadata || {};
    return {
      title: p.title, thumb: ii.thumburl, width: ii.width, height: ii.height, mime: ii.mime,
      license: strip(m.LicenseShortName && m.LicenseShortName.value),
      author: strip(m.Artist && m.Artist.value) || 'Unknown',
      source: ii.descriptionurl,
    };
  }).filter(c => c.thumb && /jpeg|png|webp/.test(c.mime || '') && FREE.test(c.license)
    && (pinned || !NOT_A_PHOTO.test(c.title))
    && c.width >= 400 && c.height >= 400 && Math.max(c.width, c.height) / Math.min(c.width, c.height) < 2);
}

// Candidate photos for a note, best first: Commons "Quality images" when
// there are any (sharp, well-lit photos), then the plain search.
async function candidates(key) {
  if (PICKS[key]) return search('', PICKS[key]);
  const q = QUERY[key] || NOTES[key][1];
  const quality = await search(`${q} incategory:Quality_images`);
  if (quality.length) return quality;
  await sleep(3000);
  return search(q);
}

async function save(key, c) {
  return saveTo(path.join(OUT, `${key}.webp`), c);
}

async function saveTo(file, c) {
  // Thumbs live on upload.wikimedia.org (thumb.wikimedia.org is not reachable here).
  const url = c.thumb.replace('//thumb.wikimedia.org/', '//upload.wikimedia.org/');
  let buf = null;
  for (let i = 0; i < 12 && !buf; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) { await sleep((Number(res.headers.get('retry-after')) || 20) * 1000 + 2000); continue; }
    if (!res.ok) throw new Error(`thumb ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  }
  if (!buf) throw new Error('thumb rate limited');
  await sharp(buf).resize(SIZE, SIZE, { fit: 'cover', position: 'attention' }).webp({ quality: 78 })
    .toFile(file);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--try') {
    // --try key "search text" … → top candidates saved to /tmp/note-try for review
    const dir = '/tmp/note-try';
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 1; i + 1 < args.length + 1; i += 2) {
      const key = args[i], q = args[i + 1];
      if (!key || !q) break;
      const list = (await search(q)).slice(0, 6);
      for (const [j, c] of list.entries()) {
        try { await saveTo(path.join(dir, `${key}__${j}.webp`), c); console.log(`${key}\t${j}\t${c.title}`); } catch (e) { console.log(`${key}\t${j}\tfailed ${e.message}`); }
      }
      await sleep(3000);
    }
    return;
  }
  if (args[0] === '--list') {
    // --list "search text" → candidate titles to pin in PICKS
    for (const c of (await search(args[1])).slice(0, 12)) console.log(`${c.title}  [${c.license}] ${c.width}x${c.height}`);
    return;
  }
  // "rose=2" picks the 3rd candidate for rose; a bare key refetches it.
  const picks = {};
  for (const a of args) { const m = /^([\w-]+)=(\d+)$/.exec(a); if (m) picks[m[1]] = Number(m[2]); }
  const wanted = args.filter(a => !a.includes('='));
  fs.mkdirSync(OUT, { recursive: true });
  const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, 'utf8')) : {};
  const keys = wanted.length ? wanted : Object.keys(picks).length ? Object.keys(picks)
    : Object.keys(NOTES).filter(k => !fs.existsSync(path.join(OUT, `${k}.webp`)));
  for (const key of keys) {
    try {
      const list = await candidates(key);
      const c = list[picks[key] || 0];
      if (!c) { console.log(`${key.padEnd(20)} no free photo found`); continue; }
      await save(key, c);
      credits[key] = { note: NOTES[key][1], title: c.title, author: c.author, license: c.license, source: c.source };
      console.log(`${key.padEnd(20)} ${c.title} (${c.license})`);
    } catch (e) {
      console.log(`${key.padEnd(20)} failed: ${e.message}`);
    }
    await sleep(4000);
  }
  const sorted = Object.fromEntries(Object.keys(credits).sort().map(k => [k, credits[k]]));
  fs.writeFileSync(CREDITS, JSON.stringify(sorted, null, 1) + '\n');
}

main();
