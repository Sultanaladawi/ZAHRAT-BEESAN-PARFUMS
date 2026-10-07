const fs = require('fs');

const html = fs.readFileSync('scripts/sample_fragrantica_purple_rose.html', 'utf8');

const pyrIdx = html.indexOf('id="pyramid"');
if (pyrIdx !== -1) {
  const pyrEnd = html.indexOf('</section>', pyrIdx) !== -1 ? html.indexOf('</section>', pyrIdx) : pyrIdx + 4000;
  console.log(html.slice(pyrIdx, pyrEnd));
}
