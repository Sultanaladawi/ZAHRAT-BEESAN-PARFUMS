const fs = require('fs');
const path = require('path');

const prods = JSON.parse(fs.readFileSync('public/data/laverne_perfumes.json', 'utf8'));

// Filter out all non-perfume and partial items
const cleaned = prods.filter(p => {
  const t = p.title.toLowerCase();
  if (t.includes('ليب لاينر') || t.includes('لاينر') || t.includes('قلوس') || t.includes('ملمع') ||
      t.includes('قلم') || t.includes('كحل') || t.includes('مسكرا') || t.includes('ماسكارا') ||
      t.includes('وشاح') || t.includes('شال') || t.includes('حقيبة') || t.includes('شنطة') ||
      t.includes('لحقيبتك') || t.includes('كيس') || t.includes('بودي اويل') || t.includes('بودي أويل') ||
      t.includes('اويل') || t.includes('أويل') || t.includes('مستحضر') || t.includes('جل') ||
      t.includes('استحمام') || t.includes('إستحمام') || t.includes('دفيوزر') || t.includes('بخور المنزل') ||
      t.includes('تعبئة') || t.includes('باودر') || t.includes('بودرة') || t.includes('بيوتي')) {
    return false;
  }
  return true;
});

console.log(`Original count: ${prods.length} -> Cleaned genuine perfumes: ${cleaned.length}`);
console.log('\nRemaining products:');
cleaned.forEach((p, idx) => {
  console.log(`${idx + 1}. ${p.title} (${p.categoryType}) - [${p.sallaId}]`);
});
