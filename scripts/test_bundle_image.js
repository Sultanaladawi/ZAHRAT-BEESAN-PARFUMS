const sharp = require('sharp');
const fs = require('fs');

async function testBundleImage() {
  const url = 'https://cdn.salla.sa/Dqvgy/4jyjXEtDiKI7lcbFwLbGpIYvLrtJV8CGcgkwB0my.jpg';
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());

  // Save original
  fs.writeFileSync('public/images/original_bundle-sadu.png', buf);

  // Studio presentation canvas: 1024x1024 warm luxury studio backdrop
  const inner = await sharp(buf)
    .resize({ width: 940, height: 940, fit: 'contain', background: { r: 247, g: 245, b: 240, alpha: 1 } })
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 247, g: 245, b: 240, alpha: 1 }
    }
  })
  .composite([
    { input: inner, gravity: 'center' }
  ])
  .jpeg({ quality: 95 })
  .toFile('public/images/ghalati_bundle-sadu.jpg');

  console.log('Saved public/images/ghalati_bundle-sadu.jpg successfully!');
}

testBundleImage();
