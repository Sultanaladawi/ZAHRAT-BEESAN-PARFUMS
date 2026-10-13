const fs = require('fs');
const path = require('path');

const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'laverne_perfumes.json');
const ARCHIVE_DATA_PATH = path.join(__dirname, '..', 'data', 'laverne_master_archive.json');

const prods = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));

// Specific URL & metadata fixes
const urlFixes = {
  'PdgOKDr': 'https://cdn.salla.sa/XzOPD/ZO1VLa6hMWRnT1KifUvusg8aRk5QAOTjqKt5wvhP.jpg', // لادور بخور كلاسيك مع الغطاء الكامل
  'DGOgbBW': 'https://cdn.salla.sa/XzOPD/mSoTXLs1nfDw7pr3ZcqtTs6VNHntTjUETryZtQNU.jpg', // ليسن الزجاجة الكاملة على قاعدة رخام
  'EXKzNoQ': 'https://cdn.salla.sa/XzOPD/q0Ws6n1Ol4IjCjE7rBVKqkloqgypnW60b6DIE7l4.jpg', // ماجيستك
  'wARadPK': 'https://cdn.salla.sa/XzOPD/brBWD7IjQW5AfhfPoPcMKRsHJ25OUfYQjEoxB4SO.jpg', // قلوري
  'rRKPBPZ': 'https://cdn.salla.sa/XzOPD/o2QFwDqTVTgqQCR2xmUUPVlci8pmiGx2dKPp2B4E.jpg', // اكسبشنال
  'vAgdGdo': 'https://cdn.salla.sa/XzOPD/fEWQXwbavW1NcO8Q8SktXxRIHDjvlLnIBEyKzH5D.jpg', // امبريال
  'xvnOKOg': 'https://cdn.salla.sa/XzOPD/4wBPBiQtQ4bgYOcAToBq9deabuO8JRygNyX6pF8f.jpg', // نايت اندر ذا ستار
  'zowPGRA': 'https://cdn.salla.sa/XzOPD/roVIm1Y9RXGcphO4knGEvQBuoZiQZZycOhSDfmDX.jpg', // لويارد
  'oZdXBGY': 'https://cdn.salla.sa/XzOPD/54fC8wDg8HdYmnxFhkNz9CXYmvGZzAYxDlZ0Ug0O.jpg', // ذا ريل باتشولي
  'EZaEoWZ': 'https://cdn.salla.sa/XzOPD/ULA5Hmmnb3LSOo2NSbtKR7NwrLGQLfcVx2Wv8Twc.jpg', // الحديقة الكبرى
  'Azgvgme': 'https://cdn.salla.sa/XzOPD/DWVYTu6ZsIkN5JUDgfi3jiGdpnVM6fnhrPNsPifv.jpg', // الحديقة الصغيرة
};

prods.forEach(item => {
  if (urlFixes[item.sallaId]) {
    item.bottleUrl = urlFixes[item.sallaId];
    item.originalImage = urlFixes[item.sallaId];
  }

  const t = item.title;

  // 1. Hair mist
  if (t.includes('عطر الشعر') || t.includes('هير مست')) {
    item.subCategory = 'hair_mist';
    item.categoryType = 'hair_mist';
  }
  // 2. Mini & Travel / Distributions
  else if (t.includes('25 مل') || t.includes('25مل') || t.includes('10 مل') || t.includes('توزيعات') || t.includes('توزيعة')) {
    item.subCategory = 'mini';
    item.categoryType = 'mini';
  }
  // 3. Gift sets & Luxury discovery boxes
  else if (item.sallaId === 'ngXQPYD' || t.includes('مجموعة الإهداء') || t.includes('الحديقة الكُبرى') || t.includes('الحديقة الصغيرة') ||
           t.includes('مجموعة الإستكشاف') || t.includes('المجموعة الثلاثية') || t.includes('المجموعة الكاملة') ||
           t.includes('سينس فورايفر الكاملة') || t.includes('تايرنت - 10') || t.includes('تايرنت - 5') ||
           t.includes('والحديقة الصغيرة') || t.includes('لويارد والحديقة') || t.includes('بيلا والحديقة') ||
           t.includes('تايرنت والحديقة') || t.includes('مس لافيرن والحديقة')) {
    item.subCategory = 'gift_set';
    item.categoryType = 'gift_set';
  }
  // 4. Duo / Combo fragrance bundles
  else if (item.sallaId === 'jgbDOzR' || item.sallaId === 'wAdeEly' || item.sallaId === 'mZDygDl' ||
           t.includes('مجموعة') || t.includes('باقة') || t.includes('لك ولها') ||
           t.includes('المتناقضات') || t.includes('الليل والنهار') || t.includes('القمر والنجوم') ||
           t.includes('الأيام البخورية') || t.includes('لاند اوف وود') || t.includes('ذا واي أوف لوف') ||
           t.includes('100 وايز أوف لوف') || t.includes('آي واز هير') || t.includes('ليتل قاردن')) {
    item.subCategory = 'bundle';
    item.categoryType = 'bundle';
  }
  // 5. Standalone Eau de Parfum
  else {
    item.subCategory = 'perfume';
    item.categoryType = 'perfume';
  }
});

const counts = {};
prods.forEach(p => counts[p.subCategory] = (counts[p.subCategory] || 0) + 1);
console.log('Subcategory breakdown:', counts);

fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(prods, null, 2));
fs.writeFileSync(ARCHIVE_DATA_PATH, JSON.stringify(prods, null, 2));
console.log('Successfully saved to public/data and data archive!');
