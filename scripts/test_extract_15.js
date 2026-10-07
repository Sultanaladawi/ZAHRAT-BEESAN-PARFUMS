const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

function extractDetails(html) {
  // Target the actual tab-pane
  const tabMatch = html.match(/<div\s+id="details_table"\s+class="[^"]*tab-pane[^"]*"[^>]*>/i);
  if (!tabMatch) return null;

  const startIdx = tabMatch.index + tabMatch[0].length;
  // End of tab pane is before next tab container or reviews
  const endMarkers = ['<div id="reviews"', '<div id="comments"', '<div class="more-tab-container"', 'id="customer-reviews"'];
  let minEnd = html.length;
  for (const m of endMarkers) {
    const idx = html.indexOf(m, startIdx);
    if (idx !== -1 && idx < minEnd) minEnd = idx;
  }
  const block = html.slice(startIdx, minEnd);

  // Normalize HTML to lines of text
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

  let overview = '';
  let opening = '';
  let heart = '';
  let base = '';
  let prominent = '';
  let perfumer = '';
  let origin = 'المملكة العربية السعودية';
  let category = '';
  let size = '';
  let type = '';

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    
    if (/^(?:الافتتاحية|قمة العطر|مقدمة العطر)\s*[:：]/i.test(line)) {
      opening = line.replace(/^(?:الافتتاحية|قمة العطر|مقدمة العطر)\s*[:：]\s*/i, '').trim();
    } else if (/^(?:القلب|قلب العطر)\s*[:：]/i.test(line)) {
      heart = line.replace(/^(?:القلب|قلب العطر)\s*[:：]\s*/i, '').trim();
    } else if (/^(?:القاعدة|قاعدة العطر)\s*[:：]/i.test(line)) {
      base = line.replace(/^(?:القاعدة|قاعدة العطر)\s*[:：]\s*/i, '').trim();
    } else if (/^(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة)\s*[:：]/i.test(line)) {
      prominent = line.replace(/^(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة)\s*[:：]\s*/i, '').trim();
    } else if (/^(?:العطار|الأنف العطري)\s*[:：]/i.test(line)) {
      perfumer = line.replace(/^(?:العطار|الأنف العطري)\s*[:：]\s*/i, '').trim();
    } else if (/^(?:بلد المنشأ)\s*[:：]/i.test(line)) {
      origin = line.replace(/^(?:بلد المنشأ)\s*[:：]\s*/i, '').trim();
    } else if (/^(?:الفئة|الجنس)\s*[:：]/i.test(line)) {
      category = line.replace(/^(?:الفئة|الجنس)\s*[:：]\s*/i, '').trim();
    } else if (/^(?:الحجم)\s*[:：]/i.test(line)) {
      size = line.replace(/^(?:الحجم)\s*[:：]\s*/i, '').trim();
    } else if (/^(?:النوع)\s*[:：]/i.test(line)) {
      type = line.replace(/^(?:النوع)\s*[:：]\s*/i, '').trim();
    }
  }

  // Overview
  const overviewLines = [];
  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    if (line.includes('تفاصيل المنتج')) continue;
    if (/^(?:مكونات|الافتتاحية|قمة العطر|مقدمة العطر|مواصفات|لماذا تختار|سعر عطر|تسوق عطر|---)/i.test(line)) break;
    if (line.startsWith('عطر ') && line.includes(':') && line.length < 60) continue;
    if (line === 'الوصف:' || line === 'الوصف') continue;
    overviewLines.push(line);
  }
  overview = overviewLines.join(' ').replace(/^الوصف\s*[:：]\s*/, '').trim();

  // If perfume notes were embedded in a single line (like "الافتتاحية: ... القلب: ...")
  if (!opening && !heart) {
    const allText = cleanLines.join(' ');
    const opM = allText.match(/(?:الافتتاحية|قمة العطر|مقدمة العطر)\s*[:：]\s*([^:]+?)(?=(?:القلب|قلب العطر|القاعدة|قاعدة العطر|الروائح البارزة|مواصفات|$))/i);
    if (opM) opening = opM[1].trim();

    const heM = allText.match(/(?:القلب|قلب العطر)\s*[:：]\s*([^:]+?)(?=(?:القاعدة|قاعدة العطر|الروائح البارزة|مواصفات|$))/i);
    if (heM) heart = heM[1].trim();

    const baM = allText.match(/(?:القاعدة|قاعدة العطر)\s*[:：]\s*([^:]+?)(?=(?:الروائح البارزة|مواصفات|العطار|$))/i);
    if (baM) base = baM[1].trim();

    const prM = allText.match(/(?:الروائح البارزة|الروائح الأساسية|الروائح الرئيسية|البارزة)\s*[:：]\s*([^:]+?)(?=(?:مواصفات|العطار|بلد المنشأ|$))/i);
    if (prM) prominent = prM[1].trim();

    const perM = allText.match(/(?:العطار|الأنف العطري)\s*[:：]\s*([^:]+?)(?=(?:مواصفات|بلد المنشأ|الفئة|الحجم|سعر|$))/i);
    if (perM) perfumer = perM[1].trim();
  }

  return {
    overview,
    opening: opening.replace(/[.\s]+$/, ''),
    heart: heart.replace(/[.\s]+$/, ''),
    base: base.replace(/[.\s]+$/, ''),
    prominent: prominent.replace(/[.\s]+$/, ''),
    perfumer: perfumer.replace(/[.\s]+$/, ''),
    specs: {
      origin: origin || 'المملكة العربية السعودية',
      category: category || 'للجنسين',
      size: size || '100 مل',
      type: type || 'عطر'
    }
  };
}

async function test15() {
  const sample = perfumes.slice(0, 15);
  for (const p of sample) {
    try {
      const res = await fetch(p.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const html = await res.text();
      const extracted = extractDetails(html);
      console.log(`\n================== [${p.id}] ==================`);
      console.log(`Title: ${p.title}`);
      console.log(`Overview: ${extracted?.overview?.slice(0, 100)}...`);
      console.log(`Opening: ${extracted?.opening}`);
      console.log(`Heart: ${extracted?.heart}`);
      console.log(`Base: ${extracted?.base}`);
      console.log(`Prominent: ${extracted?.prominent}`);
      console.log(`Perfumer: ${extracted?.perfumer}`);
    } catch (e) {
      console.error(p.id, e.message);
    }
  }
}

test15();
