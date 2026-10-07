const sharp = require('sharp');

async function testLuxuryFramedOil() {
  // Take original 1024x1024 oil image
  const buf = await sharp('./scripts/sample_oil.png')
    .resize(1024, 1024, { fit: 'contain', background: '#f5f4f0' })
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile('./scripts/test_oil_studio.jpg');
  console.log('Saved ./scripts/test_oil_studio.jpg');
}

testLuxuryFramedOil().catch(console.error);
