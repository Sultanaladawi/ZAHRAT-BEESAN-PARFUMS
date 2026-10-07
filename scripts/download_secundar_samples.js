const fs = require('fs');
const { execSync } = require('child_process');

if (!fs.existsSync('scripts/secundar_samples')) {
  fs.mkdirSync('scripts/secundar_samples');
}

for (let i = 99665; i <= 99685; i++) {
  const target = `scripts/secundar_samples/o.${i}.jpg`;
  if (!fs.existsSync(target)) {
    try {
      execSync(`curl.exe -s -L "https://fimgs.net/mdimg/secundar/o.${i}.jpg" -o "${target}"`);
      console.log(`Downloaded o.${i}.jpg (${fs.statSync(target).size} bytes)`);
    } catch(e) {}
  }
}
