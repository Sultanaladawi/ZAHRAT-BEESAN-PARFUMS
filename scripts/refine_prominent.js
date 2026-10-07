const fs = require('fs');

const scraped = JSON.parse(fs.readFileSync('data/live_scraped_ghalati.json', 'utf8'));
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

let count = 0;
perfumes.filter(p => p.categoryType === 'perfume').forEach(p => {
  const item = scraped.find(s => s.id === p.id);
  const text = item?.parsed?.fullText || '';

  // Check if text has الروائح البارزة
  const promMatch = text.match(/(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة|المكونات البارزة|المكونـات الظاهـرة)\s*[:：]?\s*([^.]+?)(?=(?:مواصفات|بلد المنشأ|الفئة|الحجم|النوع|العطار|لماذا تختار|الخط العطري|متى تستخدم|سعر|تسوق|---|$))/i);
  if (promMatch && promMatch[1].trim().length > 3) {
    p.prominent = promMatch[1].replace(/[.\s]+$/, '').trim();
    count++;
  } else {
    // If has الخط العطري
    const lineMatch = text.match(/الخط العطري\s*[:：]?\s*([^.]+?)(?=(?:المقدمة|الافتتاحية|القلب|القاعدة|مواصفات|$))/i);
    if (lineMatch && lineMatch[1].trim().length > 3) {
      p.prominent = 'الخط العطري: ' + lineMatch[1].replace(/[.\s]+$/, '').trim();
      count++;
    }
  }
});

fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
console.log(`Updated prominent notes for ${count} perfumes.`);
