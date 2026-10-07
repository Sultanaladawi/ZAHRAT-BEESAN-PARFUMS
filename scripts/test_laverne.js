const sharp = require('sharp');
const path = require('path');

async function testLaverne() {
  const url = 'https://cdn.salla.sa/XzOPD/6fcf988e-23e3-4e9a-9ef6-9b84fc13dbca-484.55598455598x500-ElgDQ2P21avYmqhCXz1KXIOr9LhFRPWk419NNxCP.jpg';
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const outPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\laverne_tobacco_sample.jpg';
  await sharp(buf).toFile(outPath);
  console.log('Saved Laverne sample to:', outPath);
}
testLaverne().catch(console.error);
