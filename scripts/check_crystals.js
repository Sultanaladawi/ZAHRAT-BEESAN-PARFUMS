const fs = require('fs');

const items = [
  { name: 'glory', url: 'https://cdn.salla.sa/XzOPD/brBWD7IjQW5AfhfPoPcMKRsHJ25OUfYQjEoxB4SO.jpg' },
  { name: 'exceptional', url: 'https://cdn.salla.sa/XzOPD/o2QFwDqTVTgqQCR2xmUUPVlci8pmiGx2dKPp2B4E.jpg' },
  { name: 'imperial', url: 'https://cdn.salla.sa/XzOPD/fEWQXwbavW1NcO8Q8SktXxRIHDjvlLnIBEyKzH5D.jpg' },
  { name: 'night', url: 'https://cdn.salla.sa/XzOPD/4wBPBiQtQ4bgYOcAToBq9deabuO8JRygNyX6pF8f.jpg' }
];

async function run() {
  for (const it of items) {
    const res = await fetch(it.url);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(`scripts/${it.name}.jpg`, buf);
    console.log(`Saved ${it.name}.jpg (${buf.length} bytes)`);
  }
}

run();
