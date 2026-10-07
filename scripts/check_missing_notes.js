const fs = require('fs');

const scraped = JSON.parse(fs.readFileSync('data/live_scraped_ghalati.json', 'utf8'));
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

function refineNotes(text) {
  let opening = '', heart = '', base = '', prominent = '', perfumer = '';

  const opM = text.match(/(?:الافتتاحية|قمة العطر|مقدمة العطر|المقدمة)\s*[:：]?\s*([^:]+?)(?=(?:القلب|قلب العطر|القاعدة|قاعدة العطر|الروائح البارزة|مواصفات|بلد المنشأ|العطار|---|$))/i);
  if (opM) opening = opM[1].replace(/[.\s]+$/, '').trim();

  const heM = text.match(/(?:القلب|قلب العطر)\s*[:：]?\s*([^:]+?)(?=(?:القاعدة|قاعدة العطر|الروائح البارزة|مواصفات|بلد المنشأ|العطار|---|$))/i);
  if (heM) heart = heM[1].replace(/[.\s]+$/, '').trim();

  const baM = text.match(/(?:القاعدة|قاعدة العطر)\s*[:：]?\s*([^:]+?)(?=(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة|مواصفات|بلد المنشأ|العطار|لماذا تختار|سعر|تسوق|---|$))/i);
  if (baM) base = baM[1].replace(/[.\s]+$/, '').trim();

  const prM = text.match(/(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة|المكونات البارزة|المكونـات الظاهـرة)\s*[:：]?\s*([^:]+?)(?=(?:مواصفات|بلد المنشأ|الفئة|الحجم|النوع|العطار|لماذا تختار|الخط العطري|متى تستخدم|سعر|تسوق|---|$))/i);
  if (prM) prominent = prM[1].replace(/[.\s]+$/, '').trim();

  const perM = text.match(/(?:العطار|الأنف العطري)\s*[:：]?\s*([^:]+?)(?=(?:مواصفات|بلد المنشأ|الفئة|الحجم|النوع|سعر|تسوق|لماذا تختار|---|$))/i);
  if (perM) perfumer = perM[1].replace(/[.\s]+$/, '').trim();

  return { opening, heart, base, prominent, perfumer };
}

const perfumeList = perfumes.filter(p => p.categoryType === 'perfume');
const issues = [];

perfumeList.forEach(p => {
  const item = scraped.find(s => s.id === p.id);
  const fullText = item?.parsed?.fullText || '';
  const notes = refineNotes(fullText);

  // If Carthage
  if (p.id.startsWith('cartage-')) {
    // handled manually
    return;
  }

  const missing = [];
  if (!notes.opening) missing.push('opening');
  if (!notes.heart) missing.push('heart');
  if (!notes.base) missing.push('base');

  if (missing.length > 0) {
    issues.push({ id: p.id, title: p.title, missing, text: fullText.slice(0, 200) });
  }
});

console.log(`Perfumes with missing fields: ${issues.length}`);
issues.forEach(iss => console.log(iss));
