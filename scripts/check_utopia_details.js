const fs = require('fs');

const html = fs.readFileSync('scripts/salla_utopia_ideal.html', 'utf8');

// Search for product title, price, description
const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
if (title) console.log('Title:', title[1].trim());

// Look for price
const price = html.match(/(\d+)\s*(?:ر\.س|SAR)/i);
if (price) console.log('Price:', price[0]);

// Look for description tags or paragraphs
const paras = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
paras.forEach(p => {
  const clean = p.replace(/<[^>]+>/g, '').trim();
  if (clean.length > 30) {
    console.log('Paragraph:', clean);
  }
});

// Also check parfoom
async function checkParfoom() {
  try {
    const res = await fetch('https://ar.parfoom.com/perfumes/ghalati/utopia-ideal', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.ok) {
      const phtml = await res.text();
      fs.writeFileSync('scripts/parfoom_utopia_ideal.html', phtml);
      console.log('✓ Fetched Parfoom length:', phtml.length);
      const notes = phtml.match(/(?:الافتتاحية|قلب العطر|قاعدة العطر|المكونات)[\s\S]{1,500}/g);
      if (notes) console.log('Parfoom notes:', notes);
    }
  } catch(e) {
    console.log('Parfoom error:', e.message);
  }
}

checkParfoom();
