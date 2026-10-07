const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const brandsDir = path.join(__dirname, '../public/images/brands');
if (!fs.existsSync(brandsDir)) {
  fs.mkdirSync(brandsDir, { recursive: true });
}

// Known official CDN logo URLs for these top houses
const logoSources = {
  'ghalati': 'https://cdn.salla.sa/ZpmqZ/c84138e4-18fa-4e78-a28a-aa2daec31393-500x500-14g0DfgU0rOsnkU54Fv5Nq6uC0w0kF7r3F7aKqjW.png',
  'deraah': 'https://www.deraahstore.com/media/logo/stores/1/deraah_logo_gold.png',
  'almajed': 'https://cdn.salla.sa/wPQpG/dDq5oO7kH13M2Cj8b5f3uA1q1.png',
  'reef': 'https://reefperfumes.com/wp-content/uploads/2021/04/reef-logo.png',
  'lattafa': 'https://lattafa.com/wp-content/uploads/2022/02/lattafa-logo-1.png',
  'asq': 'https://store.asqgrp.com/static/version1710323385/frontend/Magento/luma/ar_SA/images/logo.svg',
  'rasasi': 'https://www.rasasi.com/images/logo.png',
  'arabian-oud': 'https://arabianoud.com/media/logo/default/logo.png',
  'oud-elite': 'https://oudelite.com/media/logo/default/logo.png',
  'al-rehab': 'https://alrehab.com/wp-content/uploads/2020/09/al-rehab-logo.png',
  'assaf': 'https://assafperfumes.com/wp-content/uploads/2021/08/assaf-logo.png',
  'laverne': 'https://laverne.com/wp-content/uploads/2021/11/logo.png',
  'dokhoun': 'https://dokhoun.com/images/logo.png',
  'banafa': 'https://banafaforoud.com/wp-content/uploads/2022/03/logo.png',
  'afnan': 'https://afnan.com/images/logo.png'
};

function downloadImage(url, dest) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 8000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadImage(res.headers.location, dest).then(resolve);
        }
        if (res.statusCode !== 200) {
          return resolve(false);
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(dest);
          if (stats.size > 200) {
            resolve(true);
          } else {
            try { fs.unlinkSync(dest); } catch(e){}
            resolve(false);
          }
        });
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch(e) {
      resolve(false);
    }
  });
}

async function main() {
  console.log('Testing downloads...');
  for (const [id, url] of Object.entries(logoSources)) {
    const ext = url.endsWith('.svg') ? 'svg' : 'png';
    const dest = path.join(brandsDir, `${id}.${ext}`);
    const ok = await downloadImage(url, dest);
    console.log(`${id}: ${ok ? 'DOWNLOADED' : 'FAILED'}`);
  }
}

main();
