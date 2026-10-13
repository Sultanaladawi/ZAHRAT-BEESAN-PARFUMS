const fs = require('fs');
const sharp = require('sharp');

(async () => {
  for (const b of ['assaf', 'laverne', 'thunayan', 'labonair', 'al-rehab']) {
    const svg = fs.readFileSync('public/images/brands/' + b + '.svg', 'utf8');
    const match = svg.match(/data:image\/[^;]+;base64,([^"]+)/);
    if (match) {
      const buf = Buffer.from(match[1], 'base64');
      const meta = await sharp(buf).metadata();
      console.log(b, 'current svg embedded image:', meta.format, meta.width + 'x' + meta.height);
      // save to scratch to view
      await sharp(buf).toFile('C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/scratch/' + b + '_old.png');
    }
  }
})();
