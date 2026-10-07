const fs = require('fs');
const { execSync } = require('child_process');

const map = JSON.parse(fs.readFileSync('data/perfume_fragrantica_map.json', 'utf8'));

console.log(`Checking secundar images for ${map.length} Fragrantica perfumes...`);

const results = [];

for (let i = 0; i < map.length; i++) {
  const item = map[i];
  console.log(`[${i + 1}/${map.length}] Checking ${item.id} (${item.fUrl})...`);
  try {
    const cmd = `curl.exe -s -L "${item.fUrl}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"`;
    const html = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    const secundarMatches = [...html.matchAll(/https:\/\/fimgs\.net\/mdimg\/secundar\/o\.([0-9]+)\.jpg/gi)].map(m => m[0]);
    const uniqueSecundar = [...new Set(secundarMatches)];

    console.log(`  Found ${uniqueSecundar.length} secundar images:`, uniqueSecundar);

    results.push({
      id: item.id,
      fid: item.fid,
      url: item.fUrl,
      secundar: uniqueSecundar
    });
  } catch (err) {
    console.error(`  Error for ${item.id}:`, err.message);
    results.push({
      id: item.id,
      fid: item.fid,
      url: item.fUrl,
      secundar: []
    });
  }
}

fs.writeFileSync('data/fragrantica_secundar_results.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Finished scraping secundar images.');
