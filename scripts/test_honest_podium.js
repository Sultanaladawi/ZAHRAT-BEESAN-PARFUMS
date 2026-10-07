const sharp = require('sharp');
const fs = require('fs');

async function testFlawlessCutout() {
  const url = 'https://cdn.salla.sa/Dqvgy/ada2c258-6e50-4b80-b7f7-2bc2dc369352-1000x1000-Yph90F1R1zG5iTA7araP6fmIW1jbDYQ3puES1n9a.png';
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());

  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Find centerX
  let sumX = 0, count = 0;
  for (let y = Math.round(h * 0.3); y < Math.round(h * 0.7); y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r < 230 || g < 230 || b < 230) {
        sumX += x;
        count++;
      }
    }
  }
  const centerX = count > 0 ? Math.round(sumX / count) : 500;

  // Background predicate: pure white OR studio gray shadow on the outside
  const isBg = (x, y) => {
    const idx = (y * w + x) * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    
    // Pure white or near white
    if (r >= 238 && g >= 238 && b >= 238) return true;

    // Neutral gray studio drop shadow on left or right
    const diff = Math.max(r, g, b) - Math.min(r, g, b);
    if (diff <= 8) {
      if ((x < centerX - 120 || x > centerX + 120) && r >= 90) return true;
      if (y > h * 0.88 && r >= 100) return true;
    }

    return false;
  };

  const visited = new Uint8Array(w * h);
  const queue = [];

  // Seed borders
  for (let x = 0; x < w; x++) {
    if (isBg(x, 0)) { queue.push(x, 0); visited[x] = 1; }
    if (isBg(x, h - 1)) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
  }
  for (let y = 0; y < h; y++) {
    if (isBg(0, y) && !visited[y * w]) { queue.push(0, y); visited[y * w] = 1; }
    if (isBg(w - 1, y) && !visited[y * w + w - 1]) { queue.push(w - 1, y); visited[y * w + w - 1] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];

    const neighbors = [
      [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nPos = ny * w + nx;
        if (!visited[nPos] && isBg(nx, ny)) {
          visited[nPos] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  // Apply alpha mask
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      const idx = pos * 4;
      if (visited[pos]) {
        data[idx + 3] = 0;
      }
    }
  }

  const cleanedPng = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();

  const trimmed = await sharp(cleanedPng).trim().toBuffer({ resolveWithObject: true });
  fs.writeFileSync('public/images/original_honest.png', trimmed.data);

  const targetH = 515;
  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 60;
  const shadowH = 30;
  const shadowSvg = `
  <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4.0" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.44}" ry="8" fill="#1b1209" opacity="0.65" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.28}" ry="4" fill="#080503" opacity="0.9" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const masterBg = 'public/images/ghalati_master_bg.jpg';
  await sharp(masterBg)
    .composite([
      { input: shadowBuf, left: Math.round(left - 30), top: baseContactY - 14 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 95 })
    .toFile('public/images/ghalati_honest.jpg');

  console.log('Saved public/images/ghalati_honest.jpg');
}

testFlawlessCutout();
