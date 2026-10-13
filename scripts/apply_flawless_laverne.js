const fs = require('fs');
const path = require('path');

const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'laverne_perfumes.json');
const ARCHIVE_DATA_PATH = path.join(__dirname, '..', 'data', 'laverne_master_archive.json');

const prods = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));

// Filter out all non-fragrance, makeup, accessories, partials, body sprays, oils, and refill atomizers
const filtered = prods.filter(p => {
  const t = p.title.toLowerCase();
  if (t.includes('ليب لاينر') || t.includes('لاينر') || t.includes('قلوس') || t.includes('ملمع') ||
      t.includes('قلم') || t.includes('كحل') || t.includes('مسكرا') || t.includes('ماسكارا') ||
      t.includes('وشاح') || t.includes('شال') || t.includes('حقيبة') || t.includes('شنطة') ||
      t.includes('لحقيبتك') || t.includes('كيس') || t.includes('بودي اويل') || t.includes('بودي أويل') ||
      t.includes('اويل') || t.includes('أويل') || t.includes('مستحضر') || t.includes('جل') ||
      t.includes('استحمام') || t.includes('إستحمام') || t.includes('دفيوزر') || t.includes('بخور المنزل') ||
      t.includes('تعبئة') || t.includes('العبئة') || t.includes('باودر') || t.includes('بودرة') ||
      t.includes('بيوتي') || t.includes('رذاذ') || t.includes('عطر الجسم') || t.includes('بودي مست')) {
    return false;
  }
  return true;
});

console.log(`Original: ${prods.length} -> Clean genuine perfumes: ${filtered.length}`);

// Fix URLs and bundles for studio framing and full bottles
const specialFixes = {
  'EXKzNoQ': { url: 'https://cdn.salla.sa/XzOPD/q0Ws6n1Ol4IjCjE7rBVKqkloqgypnW60b6DIE7l4.jpg', type: 'bundle' }, // ماجيستك
  'wARadPK': { url: 'https://cdn.salla.sa/XzOPD/brBWD7IjQW5AfhfPoPcMKRsHJ25OUfYQjEoxB4SO.jpg', type: 'bundle' }, // قلوري
  'rRKPBPZ': { url: 'https://cdn.salla.sa/XzOPD/o2QFwDqTVTgqQCR2xmUUPVlci8pmiGx2dKPp2B4E.jpg', type: 'bundle' }, // اكسبشنال
  'vAgdGdo': { url: 'https://cdn.salla.sa/XzOPD/fEWQXwbavW1NcO8Q8SktXxRIHDjvlLnIBEyKzH5D.jpg', type: 'bundle' }, // امبريال
  'xvnOKOg': { url: 'https://cdn.salla.sa/XzOPD/4wBPBiQtQ4bgYOcAToBq9deabuO8JRygNyX6pF8f.jpg', type: 'bundle' }, // نايت اندر ذا ستار
  'zowPGRA': { url: 'https://cdn.salla.sa/XzOPD/roVIm1Y9RXGcphO4knGEvQBuoZiQZZycOhSDfmDX.jpg', type: 'perfume' }, // لويارد
  'oZdXBGY': { url: 'https://cdn.salla.sa/XzOPD/54fC8wDg8HdYmnxFhkNz9CXYmvGZzAYxDlZ0Ug0O.jpg', type: 'bundle' },  // ذا ريل باتشولي
  'EZaEoWZ': { url: 'https://cdn.salla.sa/XzOPD/ULA5Hmmnb3LSOo2NSbtKR7NwrLGQLfcVx2Wv8Twc.jpg', type: 'bundle' },  // الحديقة الكُبرى
  'Azgvgme': { url: 'https://cdn.salla.sa/XzOPD/DWVYTu6ZsIkN5JUDgfi3jiGdpnVM6fnhrPNsPifv.jpg', type: 'bundle' },  // الحديقة الصغيرة
};

filtered.forEach(p => {
  if (specialFixes[p.sallaId]) {
    p.bottleUrl = specialFixes[p.sallaId].url;
    p.originalImage = specialFixes[p.sallaId].url;
    p.categoryType = specialFixes[p.sallaId].type;
  }
});

fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(filtered, null, 2));
fs.writeFileSync(ARCHIVE_DATA_PATH, JSON.stringify(filtered, null, 2));
console.log('Saved cleaned catalog to public/data and data archive.');
