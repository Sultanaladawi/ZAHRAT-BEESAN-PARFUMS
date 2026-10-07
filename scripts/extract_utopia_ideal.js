const fs = require('fs');

const sallaHtml = fs.readFileSync('scripts/salla_utopia_ideal.html', 'utf8');

// Regex for JSON-LD
const jsonLdMatch = sallaHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
if (jsonLdMatch) {
  jsonLdMatch.forEach(block => {
    const raw = block.replace(/<\/?script[^>]*>/gi, '').trim();
    try {
      const data = JSON.parse(raw);
      console.log('JSON-LD Object:', JSON.stringify(data, null, 2));
    } catch(e) {}
  });
}

// Search for Arabic text / product description
const textMatches = sallaHtml.match(/يوتوبيا[\s\S]{1,1000}/g);
if (textMatches) {
  textMatches.slice(0, 5).forEach((t, i) => {
    const clean = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`\nText Match ${i+1}:`, clean.slice(0, 300));
  });
}

// Check GS description
const gsHtml = fs.readFileSync('scripts/gs_utopia_ideal.html', 'utf8');
const gsDesc = gsHtml.match(/"description":\s*"(.*?)"/);
if (gsDesc) {
  console.log('\nGS Description:', gsDesc[1]);
}
