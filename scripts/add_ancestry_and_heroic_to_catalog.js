const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('Current catalog size:', catalog.length);

// Ensure neither exists yet
const filtered = catalog.filter(p => p.id !== 'heroic' && p.id !== 'ancestry-oud');

const heroicItem = {
  id: "heroic",
  title: "عطر هيرويك",
  titleEn: "Heroic Eau De Parfum",
  brand: "دار غلاتي (Ghalati)",
  sarPrice: 95,
  url: "https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%87%D9%8A%D8%B1%D9%88%D9%8A%D9%83/p133723790",
  bottleUrl: "images/original_heroic.png",
  overview: "عطر هيرويك يجسد روح البطولة والجاذبية اللامحدودة بلمسة عصرية مشرقة، حيث يمزج بين انتعاش البرغموت الإيطالي والليمون مع دفء الفلفل الوردي والباتشولي الإندونيسي، مستنداً إلى قاعدة فاخرة من العنبر، خشب الصندل، والمسك النقي.",
  opening: "البرغموت الإيطالي، الليمون، والفلفل الوردي",
  heart: "الباتشولي الإندونيسي الفاخر",
  base: "العنبر، خشب الصندل، والمسك",
  prominent: "البرغموت، الباتشولي، والعنبر",
  specs: {
    origin: "المملكة العربية السعودية",
    category: "للجنسين، عطر أروماتك حمضي وخشبي فاخر",
    size: "100 مل",
    type: "أو دو بارفيوم (Eau De Parfum)",
    perfumer: "Philippe Paparella-Paris"
  },
  baseJod: 18,
  finalJod: 30,
  image: "images/ghalati_heroic.jpg",
  originalImage: "images/original_heroic.png",
  galleryImages: [],
  overviewEn: "Heroic embodies the spirit of valor, distinction, and enduring charisma. An exhilarating opening of Italian bergamot, lemon, and pink pepper leads into an opulent Indonesian patchouli heart, resting on a sophisticated base of amber, sandalwood, and musk.",
  openingEn: "Italian Bergamot, Lemon, Pink Pepper",
  heartEn: "Indonesian Patchouli",
  baseEn: "Amber, Sandalwood, Musk",
  prominentEn: "Bergamot, Patchouli, Amber",
  specsEn: {
    origin: "Kingdom of Saudi Arabia",
    category: "Unisex",
    size: "100 مل",
    type: "Eau De Parfum",
    perfumer: "Philippe Paparella-Paris"
  },
  categoryType: "perfume",
  fragranticaUrl: "https://www.fragranticarabia.com/perfumes/Ghalati/Heroic-84784.html",
  fragranticaId: "84784",
  fragranticaCard: "https://fimgs.net/mdimg/perfume-social-cards/ar-p_c_84784.jpeg",
  fragranticaBottle: "https://fimgs.net/mdimg/perfume/o.84784.jpg",
  boxImage: "images/box_heroic.png"
};

const ancestryItem = {
  id: "ancestry-oud",
  title: "عطر انسيستري عود",
  titleEn: "Ancestry Oud Eau De Parfum",
  brand: "دار غلاتي (Ghalati)",
  sarPrice: 125,
  url: "https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%A7%D9%86%D8%B3%D9%8A%D8%B3%D8%AA%D8%B1%D9%8A-%D8%B9%D9%88%D8%AF/p133723800",
  bottleUrl: "images/original_ancestry-oud.png",
  overview: "عطر انسيستري عود (Ancestry Oud) بحجمه الفاخر 200 مل، تحفة عطرية شرقية تجمع بين عبق التراث والأناقة الملكية المعاصرة. يفتتح بنفحات عشبية دافئة من إكليل الجبل، ليعبر نحو قلب فاخر من خيوط الزعفران النبيل، ويستقر على قاعدة عميقة آسرة من أخشاب العود الفاخر والعنبر الخشبي.",
  opening: "إكليل الجبل العطري (Rosemary)",
  heart: "الزعفران النبيل الفاخر (Noble Saffron)",
  base: "العود الفاخر، العنبر الخشبي (Rich Oud & Woody Amber)",
  prominent: "العود، الزعفران، وإكليل الجبل",
  specs: {
    origin: "المملكة العربية السعودية",
    category: "للجنسين، عطر شرقي خشبي ملكي فاخر",
    size: "200 مل",
    type: "أو دو بارفيوم (Eau De Parfum)",
    perfumer: "دار غلاتي للعطور"
  },
  baseJod: 24,
  finalJod: 36,
  image: "images/ghalati_ancestry-oud.jpg",
  originalImage: "images/original_ancestry-oud.png",
  galleryImages: [],
  overviewEn: "Ancestry Oud (200ml Luxury Edition) is a majestic oriental fragrance embodying timeless heritage and royal sophistication. It opens with aromatic rosemary, transitions into noble saffron, and settles onto a profound base of precious oud and woody amber.",
  openingEn: "Aromatic Rosemary",
  heartEn: "Noble Saffron",
  baseEn: "Aged Oud, Woody Amber",
  prominentEn: "Oud, Saffron, Rosemary",
  specsEn: {
    origin: "Kingdom of Saudi Arabia",
    category: "Unisex Luxury Oud",
    size: "200 مل",
    type: "Eau De Parfum",
    perfumer: "Maison Ghalati"
  },
  categoryType: "perfume",
  fragranticaUrl: null,
  fragranticaId: null,
  fragranticaCard: "images/pyramid_ancestry-oud.jpg",
  fragranticaBottle: null,
  boxImage: "images/box_ancestry-oud.png"
};

// Insert at end of perfumes section (before bundles)
const lastPerfumeIdx = filtered.map(p => p.categoryType).lastIndexOf('perfume');
console.log('Inserting after perfume at index:', lastPerfumeIdx, filtered[lastPerfumeIdx].id);

filtered.splice(lastPerfumeIdx + 1, 0, heroicItem, ancestryItem);

console.log('New catalog size:', filtered.length);
fs.writeFileSync(catalogPath, JSON.stringify(filtered, null, 2), 'utf8');
console.log('✓ Successfully updated', catalogPath);
