const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const items = [
  { slug: 'EXKzNoQ', file: 'maj_0.jpg' },
  { slug: 'wARadPK', file: 'glory.jpg' },
  { slug: 'rRKPBPZ', file: 'exceptional.jpg' },
  { slug: 'vAgdGdo', file: 'imperial.jpg' },
  { slug: 'xvnOKOg', file: 'night.jpg' }
];

async function run() {
  for (const item of items) {
    const rawBuf = fs.readFileSync(path.join(__dirname, item.file));
    const inner = await sharp(rawBuf)
      .resize({ width: 920, height: 920, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();
    const outPath = path.join(PUBLIC_IMAGES_DIR, `laverne_${item.slug}.jpg`);
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 248, g: 246, b: 240, alpha: 1 }
      }
    })
      .composite([{ input: inner, gravity: 'center' }])
      .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
      .toFile(outPath);
    console.log(`Rendered flawless crystal bottle: laverne_${item.slug}.jpg`);
  }
}

run();
