const fs = require('fs');
const { execSync } = require('child_process');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));
const perfumeItems = perfumes.filter(p => p.categoryType === 'perfume');

console.log(`Checking ${perfumeItems.length} perfume items for gallery and packaging images...`);

const results = {};

perfumeItems.forEach((p, idx) => {
  console.log(`[${idx + 1}/${perfumeItems.length}] Checking ${p.id} (${p.title})...`);
  try {
    const cmd = `curl.exe -s -L "${p.url}" -H "User-Agent: Mozilla/5.0"`;
    const html = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    // Extract all cdn.salla.sa images
    const sallaImgs = [...html.matchAll(/https:\/\/cdn\.salla\.sa\/Dqvgy\/[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp)/gi)].map(m => m[0]);
    // Filter out logos / icons / 500x500 thumbnails
    const unique = [...new Set(sallaImgs)].filter(img => 
      !img.includes('lsSRUDFXv00bFNJa4GiHjtn4Y9KTDd1SCrksaoPn') &&
      !img.includes('500x500') &&
      !img.includes('100x100') &&
      !img.includes('logo')
    );

    results[p.id] = {
      title: p.title,
      url: p.url,
      images: unique
    };
    console.log(`   Found ${unique.length} unique large images`);
  } catch (err) {
    console.error(`   Error fetching ${p.id}:`, err.message);
    results[p.id] = { title: p.title, url: p.url, images: [] };
  }
});

fs.writeFileSync('data/salla_perfume_images.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Done scanning Salla images.');
