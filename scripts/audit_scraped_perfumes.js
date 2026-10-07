const fs = require('fs');

const scraped = JSON.parse(fs.readFileSync('data/live_scraped_ghalati.json', 'utf8'));
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

// Fix rasayil-haneen in scraped
const haneenEntry = scraped.find(s => s.id === 'rasayil-haneen');
if (haneenEntry) {
  haneenEntry.success = true;
  haneenEntry.url = 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D8%B3%D8%A7%D8%A6%D9%84-%D8%AD%D9%86%D9%8A%D9%86/p1089182563';
  haneenEntry.parsed = {
    overview: "رسائل حنين عطر منعش يتحدى الجاذبية فتراقصها نسمة هواء محملة بعبير الازهار و الياسمين لخلق أثر عطري رائع التي تذهب بحواسك بعيدا إلى عالم مليء بالجمال وفرحا منعشا للروح .",
    opening: "البرغموت",
    heart: "البرتقال",
    base: "الباتشولي و التفاح",
    prominent: "البرغموت و البرتقال",
    perfumer: "",
    origin: "المملكة العربية السعودية",
    category: "للجنسين",
    size: "100 مل",
    type: "عطر",
    fullText: "رسائل حنين عطر منعش يتحدى الجاذبية فتراقصها نسمة هواء محملة بعبير الازهار و الياسمين لخلق أثر عطري رائع التي تذهب بحواسك بعيدا إلى عالم مليء بالجمال وفرحا منعشا للروح ."
  };
}

console.log('--- PERFUMES AUDIT ---');
let perfumeWithNotes = 0;
let perfumeWithoutNotes = 0;

perfumes.filter(p => p.categoryType === 'perfume').forEach(p => {
  const item = scraped.find(s => s.id === p.id);
  const parsed = item?.parsed;
  if (parsed && (parsed.opening || parsed.heart || parsed.base)) {
    perfumeWithNotes++;
  } else {
    perfumeWithoutNotes++;
    console.log(`Perfume lacking notes: [${p.id}] ${p.title} -> URL: ${p.url}`);
    if (parsed) console.log('FullText excerpt:', parsed.fullText?.slice(0, 200));
  }
});

console.log(`Perfumes: ${perfumeWithNotes} have notes, ${perfumeWithoutNotes} lack notes.`);
