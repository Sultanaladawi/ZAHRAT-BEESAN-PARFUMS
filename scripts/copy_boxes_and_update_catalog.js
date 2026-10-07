const fs = require('fs');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const catalogPath = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');

// 1. Copy box images
fs.copyFileSync(
  path.join(__dirname, 'boutiqaat_layana_box.jpg'),
  path.join(publicImagesDir, 'box_layana.jpg')
);
fs.copyFileSync(
  path.join(__dirname, 'boutiqaat_layana_open.jpg'),
  path.join(publicImagesDir, 'box_layana_presentation.jpg')
);
fs.copyFileSync(
  path.join(__dirname, 'boutiqaat_majestic_winged.jpg'),
  path.join(publicImagesDir, 'box_majestic-wood.jpg')
);
fs.copyFileSync(
  path.join(__dirname, 'ebay_majestic_highres.jpg'),
  path.join(publicImagesDir, 'box_majestic-wood_pack.jpg')
);
fs.copyFileSync(
  'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791367515554.jpg',
  path.join(publicImagesDir, 'box_nowara.jpg')
);

console.log('✓ Box images copied successfully');

// 2. Update catalog JSON
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Update Majestic Wood
const mw = catalog.find(p => p.id === 'majestic-wood');
if (mw) {
  mw.boxImage = 'images/box_majestic-wood.jpg';
  mw.galleryImages = [];
  console.log('✓ Updated majestic-wood with boxImage');
}

// Update Nowara
const nw = catalog.find(p => p.id === 'nowara');
if (nw) {
  nw.boxImage = 'images/box_nowara.jpg';
  nw.galleryImages = [];
  console.log('✓ Updated nowara with boxImage');
}

// Create Layana object
const layanaItem = {
  id: "layana",
  title: "عطر ليانا",
  titleEn: "Layana Eau De Parfum",
  brand: "دار غلاتي (Ghalati)",
  sarPrice: 95,
  url: "https://www.boutiqaat.com/ar-sa/men/layana-edp-100ml-unisex-by-ghalati-orl-00005450-1/p/",
  bottleUrl: "images/original_layana.png",
  overview: "عطر ليانا النسائي الفاخر، توليفة شرقية ساحرة تجمع بين حلاوة الفواكه المخملية ودفء الجلود والبخور. يفتتح العطر بلمسات منعشة وشهية من الخوخ وتوت العليق مع إشراقة البرغموت، ثم يتعمق في قلب غني ومغري من الشوكولاتة الداكنة والبخور الشرقي، ليرتكز على قاعدة آسرة من الجلود الفخمة والفانيليا الدافئة تدوم طويلاً.",
  opening: "الخوخ، توت العليق، والبرغموت",
  heart: "الشوكولاتة الداكنة، والبخور الشرقي",
  base: "الجلود الفاخرة، والفانيليا الدافئة",
  prominent: "الخوخ، الجلود، توت العليق، الشوكولاتة الداكنة، والبخور",
  specs: {
    origin: "المملكة العربية السعودية",
    category: "نسائي، عطر شرقي فاكهي جلدي حلو وفخم",
    size: "100 مل",
    type: "أو دو بارفيوم (Eau De Parfum)",
    perfumer: "دار غلاتي للعطور"
  },
  baseJod: 18,
  finalJod: 30,
  image: "images/ghalati_layana.jpg",
  originalImage: "images/original_layana.png",
  galleryImages: [],
  overviewEn: "Layana Eau De Parfum for women is an enchanting blend combining velvety sweet fruits with rich leather and smoky incense. It opens with luscious peach, raspberry, and bergamot, evolves into an alluring heart of dark chocolate and incense, resting on an opulent, long-lasting foundation of leather and warm vanilla.",
  openingEn: "Peach, Raspberry, Bergamot",
  heartEn: "Dark Chocolate, Incense",
  baseEn: "Leather, Vanilla",
  prominentEn: "Peach, Leather, Raspberry, Dark Chocolate, Incense",
  specsEn: {
    origin: "Kingdom of Saudi Arabia",
    category: "Women's Luxury Fruity Leather",
    size: "100 مل",
    type: "Eau De Parfum",
    perfumer: "Maison Ghalati"
  },
  categoryType: "perfume",
  fragranticaUrl: "https://www.fragranticarabia.com/perfumes/Ghalati/Layana-79187.html",
  fragranticaId: "79187",
  fragranticaCard: "https://fimgs.net/mdimg/perfume-social-cards/ar-p_c_79187.jpeg",
  fragranticaBottle: "https://fimgs.net/mdimg/perfume/o.79187.jpg",
  boxImage: "images/box_layana.jpg"
};

// Check if Layana already exists
const existingLayanaIdx = catalog.findIndex(p => p.id === 'layana');
if (existingLayanaIdx >= 0) {
  catalog[existingLayanaIdx] = layanaItem;
  console.log('✓ Overwrote existing layana entry');
} else {
  // Insert at end of perfumes section (before bundles)
  const lastPerfumeIdx = catalog.map(p => p.categoryType).lastIndexOf('perfume');
  console.log('Inserting layana after index:', lastPerfumeIdx, catalog[lastPerfumeIdx].id);
  catalog.splice(lastPerfumeIdx + 1, 0, layanaItem);
  console.log('✓ Added layana to perfumes category');
}

console.log('Total catalog items now:', catalog.length);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('✓ perfumes.json saved successfully!');
