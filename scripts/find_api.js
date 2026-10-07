const fs = require('fs');
const html = fs.readFileSync('./scripts/cat_debug.html', 'utf8');

// Find all salla tags
const tags = [...html.matchAll(/<salla-[a-z0-9\-]+[^>]*>/gi)].map(m => m[0]);
console.log('Salla tags found (', tags.length, '):');
tags.forEach(t => console.log('  ', t));

// Find script tags or window.salla or api
const sallaScripts = [...html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)];
console.log('Scripts count:', sallaScripts.length);
sallaScripts.forEach((s, idx) => {
  if (s[1].includes('salla') || s[1].includes('category') || s[1].includes('products')) {
    console.log(`Script #${idx}: snippet:`, s[1].slice(0, 300).replace(/\s+/g, ' '));
  }
});
