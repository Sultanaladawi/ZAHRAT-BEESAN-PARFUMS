const fs = require('fs');
const path = require('path');

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`Downloaded ${url} -> ${dest} (${buf.length} bytes)`);
}

async function run() {
  await download('https://fimgs.net/mdimg/secundar/o.99671.jpg', 'scripts/temp_secundar_99671.jpg');
  await download('https://fimgs.net/mdimg/perfume-social-cards/ar-p_c_79187.jpeg', 'scripts/temp_card_79187.jpg');
  await download('https://fimgs.net/mdimg/perfume/o.79187.jpg', 'scripts/temp_perfume_79187.jpg');
}

run();
