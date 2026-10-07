const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createOverviewGrid() {
  const ids = [
    'purple-rose', 'majestic-wood', 'oud-argent', 'amber-cashmere', 'liana',
    'nowara', 'moudhi', 'rozana', 'emotion', 'attraction'
  ];

  const colCount = 5;
  const rowCount = 2;
  const cellW = 380;
  const cellH = 380;
  const gap = 16;
  const padding = 20;

  const totalW = padding * 2 + colCount * cellW + (colCount - 1) * gap;
  const totalH = padding * 2 + rowCount * cellH + (rowCount - 1) * gap;

  const composites = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const col = i % colCount;
    const row = Math.floor(i / colCount);

    const left = padding + col * (cellW + gap);
    const top = padding + row * (cellH + gap);

    const imgPath = path.join(__dirname, '..', 'public', 'images', `ghalati_${id}.jpg`);
    const resized = await sharp(imgPath).resize(cellW, cellH).toBuffer();

    composites.push({
      input: resized,
      left: left,
      top: top
    });
  }

  // Create luxury background for the grid
  const gridBuffer = await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 3,
      background: { r: 246, g: 243, b: 236 } // luxury cream background
    }
  })
    .composite(composites)
    .jpeg({ quality: 95 })
    .toBuffer();

  const outPathPublic = path.join(__dirname, '..', 'public', 'images', 'ghalati_all_10_grid.jpg');
  const outPathArtifact = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/ghalati_all_10_grid.jpg';

  fs.writeFileSync(outPathPublic, gridBuffer);
  fs.writeFileSync(outPathArtifact, gridBuffer);
  console.log(`Grid created: ${totalW}x${totalH} -> ${outPathPublic}`);
}

createOverviewGrid().catch(console.error);
