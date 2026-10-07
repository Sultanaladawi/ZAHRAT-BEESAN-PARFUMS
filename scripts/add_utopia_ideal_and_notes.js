const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

// Check if utopia-ideal already exists
let utopiaIdeal = perfumes.find(p => p.id === 'utopia-ideal');
if (!utopiaIdeal) {
  utopiaIdeal = {
    id: "utopia-ideal",
    title: "عطر يوتوبيا ايديال",
    titleEn: "Utopia Ideal Eau De Parfum",
    brand: "دار غلاتي (Ghalati)",
    categoryType: "perfume",
    sarPrice: 95,
    baseJod: 18,
    finalJod: 30,
    url: "https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%8A%D9%88%D8%AA%D9%88%D8%A8%D9%8A%D8%A7-%D8%A7%D9%8A%D8%AF%D9%8A%D8%A7%D9%84/p1177605477",
    bottleUrl: "https://cdn.salla.sa/Dqvgy/zlqJxA2ptXlpBirFArOt16fv8Ox2yTzw4SFwRhVv.png",
    overview: "عطر يوتوبيا ايديال مستوحى من قوة رياح الصحراء عند غروب الشمس. من الصحراء في لحظة الغسق السحرية لحظة زرقاء عميقة، تمتزج خلالها نضارة الليل وحرارة الصحراء معًا لإنتاج عطور كثيفة وإفساح المجال أمام أعنف النبضات بتركيبة قوية من المكونات المنعشة والنفحات الخشبية الترابية الداكنة، رائحة منعشة قوية مميزة مستوحاة من قوة الرياح كقصيدة للحرية الذكورية يتم التعبير عنها في عطر خشبي عطري ذو أثر آسر ورائحة خالدة في زجاجة من اللون الأسود الغامض.",
    opening: "البرغموت الإيطالي والفلفل الأسود",
    heart: "الخزامى (اللافندر) وأوراق الباتشولي",
    base: "العنبر الفاخر وخشب الأرز والمسك",
    prominent: "البرغموت، الفلفل، اللافندر، الباتشولي، وخشب الأرز",
    specs: {
      origin: "المملكة العربية السعودية",
      category: "رجالي",
      size: "100 مل",
      type: "عطر خشبي أروماتي",
      perfumer: "دار غلاتي للعطور"
    },
    image: "images/ghalati_utopia-ideal.jpg",
    originalImage: "images/original_utopia-ideal.png",
    galleryImages: [],
    overviewEn: "Inspired by the raw strength of desert winds at dusk. A magnetic fusion of cool night air and desert heat, bursting with refreshing citrus, fiery pepper, noble lavender, and dark earthy woods in an enigmatic black bottle.",
    openingEn: "Italian Bergamot, Black Pepper",
    heartEn: "Lavender, Patchouli Leaves",
    baseEn: "Precious Amber, Cedarwood, Musk",
    prominentEn: "Bergamot, Black Pepper, Lavender, Patchouli, Cedarwood",
    specsEn: {
      origin: "Kingdom of Saudi Arabia",
      category: "Men",
      size: "100 مل",
      type: "Eau De Parfum",
      perfumer: "Ghalati Parfums R&D"
    },
    fragranticaCard: "images/pyramid_utopia-ideal.jpg",
    boxImage: null
  };

  // Find index of utopia-gist and insert right after
  const gistIdx = perfumes.findIndex(p => p.id === 'utopia-gist');
  if (gistIdx !== -1) {
    perfumes.splice(gistIdx + 1, 0, utopiaIdeal);
  } else {
    perfumes.push(utopiaIdeal);
  }
  console.log('✓ Added utopia-ideal to perfumes.json');
}

// Update utopia-platinum galleryImages
const plat = perfumes.find(p => p.id === 'utopia-platinum');
if (plat) {
  plat.galleryImages = ['images/utopia-platinum_notes.jpg'];
  console.log('✓ Updated utopia-platinum gallery with notes artwork');
}

// Update utopia-gist galleryImages
const gist = perfumes.find(p => p.id === 'utopia-gist');
if (gist) {
  gist.galleryImages = ['images/utopia-gist_notes.jpg'];
  console.log('✓ Updated utopia-gist gallery with notes artwork');
}

// Strict Deduplication Check across all perfumes
perfumes.forEach(p => {
  const seen = new Set();
  if (p.image) seen.add(p.image);
  if (p.boxImage) {
    if (seen.has(p.boxImage)) p.boxImage = null;
    else seen.add(p.boxImage);
  }
  if (p.originalImage) {
    if (seen.has(p.originalImage)) p.originalImage = null;
    else seen.add(p.originalImage);
  }
  if (p.fragranticaCard) {
    if (seen.has(p.fragranticaCard)) p.fragranticaCard = null;
    else seen.add(p.fragranticaCard);
  }
  if (Array.isArray(p.galleryImages)) {
    p.galleryImages = p.galleryImages.filter(img => {
      if (!img || seen.has(img)) return false;
      seen.add(img);
      return true;
    });
  }
});

fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
console.log(`Saved perfumes.json. Total items now: ${perfumes.length}`);
