const fs = require('fs');
const { execSync } = require('child_process');

const sampleIds = [
  { id: 'vintage', fid: 89823, url: 'https://www.fragranticarabia.com/perfumes/Ghalati/Eau-de-Vintage-89823.html' },
  { id: 'boudoir', fid: 103316, url: 'https://www.fragranticarabia.com/perfumes/Ghalati/Boudoir-103316.html' },
  { id: 'serenade', fid: 103318, url: 'https://www.fragranticarabia.com/perfumes/Ghalati/Serenade-103318.html' },
  { id: 'cartage-velours', fid: 103288, url: 'https://www.fragranticarabia.com/perfumes/Ghalati/Carthage-Velours-103288.html' },
  { id: 'majestic-wood', fid: 79249, url: 'https://www.fragranticarabia.com/perfumes/Ghalati/Majestic-Woods-79249.html' }
];

sampleIds.forEach(item => {
  try {
    const cmd = `curl.exe -s -L "${item.url}" -H "User-Agent: Mozilla/5.0"`;
    const html = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const matches = [...html.matchAll(/https:\/\/fimgs\.net\/mdimg\/secundar\/o\.([0-9]+)\.jpg/gi)].map(m => m[0]);
    console.log(`[${item.id}] fid: ${item.fid} -> Secundar:`, [...new Set(matches)]);
  } catch (e) {
    console.error(item.id, e.message);
  }
});
