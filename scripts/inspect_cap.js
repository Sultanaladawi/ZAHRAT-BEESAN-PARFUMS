const sharp = require('sharp');

async function inspectCap() {
  const { data, info } = await sharp('scripts/imgly_vintage.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Let's sample row y = 200 (around the cap)
  const y = 200;
  console.log('Sample row y =', y);
  for (let x = 250; x < 550; x += 10) {
    const idx = (y * w + x) * 4;
    const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
    const diff = Math.max(r, g, b) - Math.min(r, g, b);
    console.log(`x=${x}: R=${r} G=${g} B=${b} A=${a} diff=${diff}`);
  }
}

inspectCap();
