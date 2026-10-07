const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');

async function testOrder() {
  console.log('Testing require order: sharp first, imgly second...');
  const blob = await removeBackground('scripts/raw_vintage.jpg');
  const buffer = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync('scripts/imgly_vintage.png', buffer);
  console.log('SUCCESS! Imgly ran and saved imgly_vintage.png, size:', buffer.length);
}

testOrder();
