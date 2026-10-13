const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PUBLIC_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'laverne_perfumes.json');
const ARCHIVE_DATA_PATH = path.join(__dirname, '..', 'data', 'laverne_master_archive.json');

const targets = [
  {
    sallaId: 'oZdXBGY',
    url: 'https://cdn.salla.sa/XzOPD/54fC8wDg8HdYmnxFhkNz9CXYmvGZzAYxDlZ0Ug0O.jpg',
    categoryType: 'bundle'
  },
  {
    sallaId: 'EZaEoWZ',
    url: 'https://cdn.salla.sa/XzOPD/ULA5Hmmnb3LSOo2NSbtKR7NwrLGQLfcVx2Wv8Twc.jpg',
    categoryType: 'bundle'
  },
  {
    sallaId: 'Azgvgme',
    url: 'https://cdn.salla.sa/XzOPD/DWVYTu6ZsIkN5JUDgfi3jiGdpnVM6fnhrPNsPifv.jpg',
    categoryType: 'bundle'
  },
  {
    sallaId: 'zowPGRA',
    url: 'https://cdn.salla.sa/XzOPD/roVIm1Y9RXGcphO4knGEvQBuoZiQZZycOhSDfmDX.jpg',
    categoryType: 'perfume'
  },
  {
    sallaId: 'EXKzNoQ',
    url: 'https://cdn.salla.sa/XzOPD/q0Ws6n1Ol4IjCjE7rBVKqkloqgypnW60b6DIE7l4.jpg',
    categoryType: 'bundle'
  },
  {
    sallaId: 'wARadPK',
    url: 'https://cdn.salla.sa/XzOPD/brBWD7IjQW5AfhfPoPcMKRsHJ25OUfYQjEoxB4SO.jpg',
    categoryType: 'bundle'
  },
  {
    sallaId: 'rRKPBPZ',
    url: 'https://cdn.salla.sa/XzOPD/o2QFwDqTVTgqQCR2xmUUPVlci8pmiGx2dKPp2B4E.jpg',
    categoryType: 'bundle'
  },
  {
    sallaId: 'vAgdGdo',
    url: 'https://cdn.salla.sa/XzOPD/fEWQXwbavW1NcO8Q8SktXxRIHDjvlLnIBEyKzH5D.jpg',
    categoryType: 'bundle'
  },
  {
    sallaId: 'xvnOKOg',
    url: 'https://cdn.salla.sa/XzOPD/4wBPBiQtQ4bgYOcAToBq9deabuO8JRygNyX6pF8f.jpg',
    categoryType: 'bundle'
  }
];

async function updateAll() {
  const prods = JSON.parse(fs.readFileSync(PUBLIC_DATA_PATH, 'utf8'));

  for (const item of targets) {
    const prod = prods.find(p => p.sallaId === item.sallaId);
    if (prod) {
      prod.bottleUrl = item.url;
      prod.originalImage = item.url;
      prod.categoryType = item.categoryType;
    }

    if (item.categoryType === 'bundle') {
      const res = await fetch(item.url);
      const rawBuf = Buffer.from(await res.arrayBuffer());
      const inner = await sharp(rawBuf)
        .resize({ width: 920, height: 920, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer();
      const outPath = path.join(PUBLIC_IMAGES_DIR, `laverne_${item.sallaId}.jpg`);
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
      console.log(`Rendered framed studio image for ${item.sallaId}`);
    }
  }

  fs.writeFileSync(PUBLIC_DATA_PATH, JSON.stringify(prods, null, 2));
  fs.writeFileSync(ARCHIVE_DATA_PATH, JSON.stringify(prods, null, 2));
  console.log('Updated JSON catalogs successfully!');
}

updateAll().catch(console.error);
