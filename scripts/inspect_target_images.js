const all = require('../data/ghalati_complete_store_catalog.json');
const targetNames = [
  'بخور وصائف', 'بخور عود ازرق مبخر', 'معمول دار الكرم', 'معمول رجوة',
  'معمول جازي', 'معمول العنود', 'معمول وعد', 'بخور عود غلاتي',
  'بخور مبثوث الجود', 'بخور عود فاخر', 'بخور اسرار العود', 'معمول خاص غلاتي',
  'بخور عود السمو', 'بخور دخون المجالس', 'عود الدار',
  'مجموعة الفخامة', 'باقة التاريخ', 'باقة عطور المسك', 'مجموعة فارنا'
];
const found = all.filter(p => targetNames.includes(p.name));
console.log('Found:', found.length, 'out of', targetNames.length);
found.forEach(p => {
  console.log(`[${p.sarPrice} SAR -> ${p.jodPrice} JOD] ${p.name}`);
  console.log('  URL:', p.url);
  console.log('  Image:', p.originalImage);
});
