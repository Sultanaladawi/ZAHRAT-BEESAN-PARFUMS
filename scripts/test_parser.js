const fs = require('fs');

const html = fs.readFileSync('scripts/sample_page.html', 'utf8');

const tabPaneIdx = html.indexOf('<div id="details_table"');
console.log('tabPaneIdx:', tabPaneIdx);

// Look for where details_table content goes
// Usually it ends before <div id="comments" or <div id="reviews" or <section or <footer
const endMarkers = ['<div id="reviews"', '<div id="comments"', '<div id="more_info"', '<div class="tab-pane', '<!-- /details_table -->', 'id="customer-reviews"'];
let minEnd = html.length;
for (const m of endMarkers) {
  const idx = html.indexOf(m, tabPaneIdx + 50);
  if (idx !== -1 && idx < minEnd) {
    minEnd = idx;
    console.log(`Matched end marker: ${m} at ${idx}`);
  }
}

const rawDetails = html.slice(tabPaneIdx, minEnd);
console.log('Raw details length:', rawDetails.length);
console.log('Sample raw details (first 1000):', rawDetails.slice(0, 1000));
console.log('Sample raw details (last 500):', rawDetails.slice(-500));
