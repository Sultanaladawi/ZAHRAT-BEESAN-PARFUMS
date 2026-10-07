const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

function parseProductPage(html, product) {
  // Check if details_table exists
  const tabMatch = html.match(/<div\s+id="details_table"\s+class="[^"]*tab-pane[^"]*"[^>]*>/i);
  let block = '';
  if (tabMatch) {
    const startIdx = tabMatch.index + tabMatch[0].length;
    const endMarkers = ['<div id="reviews"', '<div id="comments"', '<div class="more-tab-container"', 'id="customer-reviews"'];
    let minEnd = html.length;
    for (const m of endMarkers) {
      const idx = html.indexOf(m, startIdx);
      if (idx !== -1 && idx < minEnd) minEnd = idx;
    }
    block = html.slice(startIdx, minEnd);
  } else {
    // Fallback: look for meta description or article
    const artM = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (artM) block = artM[1];
  }

  if (!block) return null;

  // Clean HTML
  const cleanLines = block
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0);

  const fullText = cleanLines.join(' ');

  // Extract Notes using robust regex across fullText
  let opening = '';
  let heart = '';
  let base = '';
  let prominent = '';
  let perfumer = '';
  let origin = '';
  let category = '';
  let size = '';
  let type = '';

  const opM = fullText.match(/(?:الافتتاحية|قمة العطر|مقدمة العطر)\s*[:：]\s*([^:]+?)(?=(?:القلب|قلب العطر|القاعدة|قاعدة العطر|الروائح البارزة|مواصفات|بلد المنشأ|العطار|---|$))/i);
  if (opM) opening = opM[1].replace(/[.\s]+$/, '').trim();

  const heM = fullText.match(/(?:القلب|قلب العطر)\s*[:：]\s*([^:]+?)(?=(?:القاعدة|قاعدة العطر|الروائح البارزة|مواصفات|بلد المنشأ|العطار|---|$))/i);
  if (heM) heart = heM[1].replace(/[.\s]+$/, '').trim();

  const baM = fullText.match(/(?:القاعدة|قاعدة العطر)\s*[:：]\s*([^:]+?)(?=(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة|مواصفات|بلد المنشأ|العطار|---|$))/i);
  if (baM) base = baM[1].replace(/[.\s]+$/, '').trim();

  const prM = fullText.match(/(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة)\s*[:：]\s*([^:]+?)(?=(?:مواصفات|بلد المنشأ|الفئة|الحجم|النوع|العطار|لماذا تختار|سعر|تسوق|---|$))/i);
  if (prM) prominent = prM[1].replace(/[.\s]+$/, '').trim();

  const perM = fullText.match(/(?:العطار|الأنف العطري)\s*[:：]\s*([^:]+?)(?=(?:مواصفات|بلد المنشأ|الفئة|الحجم|النوع|سعر|تسوق|لماذا تختار|---|$))/i);
  if (perM) perfumer = perM[1].replace(/[.\s]+$/, '').trim();

  const oriM = fullText.match(/(?:بلد المنشأ)\s*[:：]\s*([^:]+?)(?=(?:الفئة|الحجم|النوع|العطار|لماذا تختار|سعر|تسوق|---|$))/i);
  if (oriM) origin = oriM[1].replace(/[.\s]+$/, '').trim();

  const catM = fullText.match(/(?:الفئة|الجنس)\s*[:：]\s*([^:]+?)(?=(?:الحجم|النوع|العطار|بلد المنشأ|سعر|تسوق|---|$))/i);
  if (catM) category = catM[1].replace(/[.\s]+$/, '').trim();

  const sizM = fullText.match(/(?:الحجم)\s*[:：]\s*([^:]+?)(?=(?:النوع|العطار|الفئة|بلد المنشأ|سعر|تسوق|---|$))/i);
  if (sizM) size = sizM[1].replace(/[.\s]+$/, '').trim();

  const typM = fullText.match(/(?:النوع)\s*[:：]\s*([^:]+?)(?=(?:العطار|الفئة|الحجم|بلد المنشأ|سعر|تسوق|لماذا تختار|---|$))/i);
  if (typM) type = typM[1].replace(/[.\s]+$/, '').trim();

  // Extract Overview / Description
  // Usually between start and "مكونات" or "الافتتاحية" or "---"
  const overviewLines = [];
  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    if (line.includes('تفاصيل المنتج')) continue;
    if (/^(?:مكونات|الافتتاحية|قمة العطر|مقدمة العطر|مواصفات|لماذا تختار|سعر|تسوق|---)/i.test(line)) break;
    if (line.startsWith('عطر ') && line.includes(':') && line.length < 60) continue;
    if (line.startsWith('بخور ') && line.includes(':') && line.length < 60) continue;
    if (line.startsWith('معمول ') && line.includes(':') && line.length < 60) continue;
    if (line.startsWith('باقة ') && line.includes(':') && line.length < 60) continue;
    if (line.startsWith('مجموعة ') && line.includes(':') && line.length < 60) continue;
    if (line === 'الوصف:' || line === 'الوصف') continue;
    overviewLines.push(line);
  }
  let overview = overviewLines.join(' ').replace(/^الوصف\s*[:：]\s*/, '').trim();

  // If overview is empty or very short, fallback to first 2 sentences before reviews
  if (!overview && cleanLines.length > 0) {
    overview = cleanLines.slice(0, 3).join(' ');
  }

  return {
    overview,
    opening,
    heart,
    base,
    prominent,
    perfumer,
    origin,
    category,
    size,
    type,
    fullText
  };
}

module.exports = { parseProductPage };
