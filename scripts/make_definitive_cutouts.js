const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// BFS Largest Connected Component
async function cleanToLargestComponent(inPath, outPath, extraCleanFn = null) {
  const { data, info } = await sharp(inPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  if (extraCleanFn) {
    extraCleanFn(data, w, h);
  }

  const grid = new Int32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] > 25) grid[i] = -1; // unvisited foreground
    else grid[i] = 0; // background
  }

  let currentLabel = 0;
  const compSizes = {};

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (grid[idx] === -1) {
        currentLabel++;
        let size = 0;
        const queue = [x, y];
        grid[idx] = currentLabel;

        let qHead = 0;
        while (qHead < queue.length) {
          const cx = queue[qHead++];
          const cy = queue[qHead++];
          size++;

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx, ny = cy + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nidx = ny * w + nx;
                if (grid[nidx] === -1) {
                  grid[nidx] = currentLabel;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }
        compSizes[currentLabel] = size;
      }
    }
  }

  let maxSize = 0, maxLabel = 0;
  for (const [lbl, sz] of Object.entries(compSizes)) {
    if (sz > maxSize) {
      maxSize = sz;
      maxLabel = parseInt(lbl);
    }
  }

  for (let i = 0; i < w * h; i++) {
    if (grid[i] !== maxLabel) {
      data[i * 4 + 3] = 0;
    }
  }

  const cleaned = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(cleaned).trim().png().toBuffer();
  fs.writeFileSync(outPath, trimmed);
  console.log(`✓ Processed ${path.basename(outPath)} (comps: ${currentLabel}, main size: ${maxSize})`);
}

async function run() {
  console.log('Generating 10 definitive spotless cutouts...');

  // 1. Nowara - User provided pristine cutout
  await cleanToLargestComponent(
    path.join(__dirname, 'user_nowara.png'),
    path.join(__dirname, 'definitive_nowara.png')
  );

  // 2. Majestic Wood - User provided pristine cutout
  await cleanToLargestComponent(
    path.join(__dirname, 'user_majestic-wood.png'),
    path.join(__dirname, 'definitive_majestic-wood.png')
  );

  // 3. Amber Cashmere - High-res spotless cutout
  await cleanToLargestComponent(
    path.join(__dirname, 'spotless_amber-cashmere.png'),
    path.join(__dirname, 'definitive_amber-cashmere.png')
  );

  // 4. Rozana - High-res spotless with speck filtered
  await cleanToLargestComponent(
    path.join(__dirname, 'spotless_rozana.png'),
    path.join(__dirname, 'definitive_rozana.png')
  );

  // 5. Attraction - Clean shadow & artifact
  await cleanToLargestComponent(
    path.join(__dirname, 'spotless_attraction_final.png'),
    path.join(__dirname, 'definitive_attraction.png')
  );

  // 6. Purple Rose
  await cleanToLargestComponent(
    path.join(__dirname, 'spotless_purple-rose.png'),
    path.join(__dirname, 'definitive_purple-rose.png')
  );

  // 7. Liana
  await cleanToLargestComponent(
    path.join(__dirname, 'spotless_liana.png'),
    path.join(__dirname, 'definitive_liana.png')
  );

  // 8. Moudhi - Filter tiny speck on left neck
  await cleanToLargestComponent(
    path.join(__dirname, 'spotless_moudhi.png'),
    path.join(__dirname, 'definitive_moudhi.png'),
    (data, w, h) => {
      // Disconnect speck on left of neck
      for (let y = Math.round(h * 0.18); y < Math.round(h * 0.28); y++) {
        for (let x = 0; x < Math.round(w * 0.15); x++) {
          const idx = (y * w + x) * 4;
          const diff = Math.max(data[idx], data[idx+1], data[idx+2]) - Math.min(data[idx], data[idx+1], data[idx+2]);
          if (diff < 15 && data[idx] > 180) {
            data[idx + 3] = 0;
          }
        }
      }
    }
  );

  // 9. Oud Argent
  await cleanToLargestComponent(
    path.join(__dirname, 'spotless_oud-argent.png'),
    path.join(__dirname, 'definitive_oud-argent.png')
  );

  // 10. Emotion
  await cleanToLargestComponent(
    path.join(__dirname, 'spotless_emotion.png'),
    path.join(__dirname, 'definitive_emotion.png')
  );

  console.log('All 10 definitive cutouts ready!');
}

run().catch(console.error);
