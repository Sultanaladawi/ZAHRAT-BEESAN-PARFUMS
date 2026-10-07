const sharp = require('sharp');

async function inspectPixels() {
  const { data, info } = await sharp('scripts/raw_rasayil-shawq.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Let's sample along a horizontal line across the shadow and bottle, say at y = 300
  const y = 300;
  console.log('Sample row y =', y);
  for (let x = 380; x < 520; x += 5) {
    const idx = (y * w + x) * 4;
    console.log(`x=${x}: R=${data[idx]} G=${data[idx+1]} B=${data[idx+2]} A=${data[idx+3]} | diff=${Math.max(data[idx], data[idx+1], data[idx+2]) - Math.min(data[idx], data[idx+1], data[idx+2])}`);
  }
}

inspectPixels();
