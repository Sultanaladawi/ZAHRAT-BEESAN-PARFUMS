const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');

async function download(url, out) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(out, buf);
      console.log('✓ Downloaded:', out, 'size:', buf.length);
      return true;
    }
  } catch (e) {
    console.error('Error downloading:', url, e.message);
  }
  return false;
}

// Convert transparent PNG or white background into clean high-quality JPEG
async function processBox(inputPath, outputPath) {
  const meta = await sharp(inputPath).metadata();
  console.log(`Processing ${path.basename(outputPath)} from ${path.basename(inputPath)} (${meta.width}x${meta.height}, alpha: ${meta.hasAlpha})`);

  // If it has alpha, composite onto white background for clean crisp presentation
  if (meta.hasAlpha) {
    await sharp(inputPath)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
      .toFile(outputPath);
  } else {
    await sharp(inputPath)
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
      .toFile(outputPath);
  }
  const outMeta = await sharp(outputPath).metadata();
  console.log(`✓ Saved ${path.basename(outputPath)} (${outMeta.width}x${outMeta.height})`);
}

async function main() {
  // Download Dama, Exotic Wood & Honest
  await download('https://assets.goldenscent.com/catalog/product/6/2/6287015125704-ghalati-dama_2.png', 'scripts/raw_dama_box.png');
  await download('https://assets.goldenscent.com/catalog/product/6/2/6287015125377-ghalati-exotic-wood_2.png', 'scripts/raw_exotic-wood_box.png');
  await download('https://assets.goldenscent.com/catalog/product/6/2/6287015125315-ghalati-honest_2.png', 'scripts/raw_honest_box.png');

  // Save current box_rozana.jpg as rozana_notes.jpg (ingredients card) before overwriting
  const currentRozanaBox = path.join(publicImagesDir, 'box_rozana.jpg');
  const rozanaNotes = path.join(publicImagesDir, 'rozana_notes.jpg');
  if (fs.existsSync(currentRozanaBox) && !fs.existsSync(rozanaNotes)) {
    fs.copyFileSync(currentRozanaBox, rozanaNotes);
    console.log('✓ Preserved goldenwings notes artwork as rozana_notes.jpg');
  }

  // 1. Rozana official box
  if (fs.existsSync('scripts/raw_rosanna_box.png')) {
    await processBox('scripts/raw_rosanna_box.png', path.join(publicImagesDir, 'box_rozana.jpg'));
  }

  // 2. Emotion official box
  const emotionUploaded = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791367917583.png';
  if (fs.existsSync(emotionUploaded)) {
    await processBox(emotionUploaded, path.join(publicImagesDir, 'box_emotion.jpg'));
  }

  // 3. Shades official box
  if (fs.existsSync('scripts/raw_shades_box.png')) {
    await processBox('scripts/raw_shades_box.png', path.join(publicImagesDir, 'box_shades.jpg'));
  }

  // 4. Bois Noir official box
  if (fs.existsSync('scripts/raw_bois-noir_box.png')) {
    await processBox('scripts/raw_bois-noir_box.png', path.join(publicImagesDir, 'box_bois-noir.jpg'));
  }

  // 5. Utopia Essence official box
  if (fs.existsSync('scripts/raw_utopia-essence_box.png')) {
    await processBox('scripts/raw_utopia-essence_box.png', path.join(publicImagesDir, 'box_utopia-essence.jpg'));
  }

  // 6. Dama official box
  if (fs.existsSync('scripts/raw_dama_box.png')) {
    await processBox('scripts/raw_dama_box.png', path.join(publicImagesDir, 'box_dama.jpg'));
  }

  // 7. Exotic Wood official box
  if (fs.existsSync('scripts/raw_exotic-wood_box.png')) {
    await processBox('scripts/raw_exotic-wood_box.png', path.join(publicImagesDir, 'box_exotic-wood.jpg'));
  }

  // 8. Honest official box
  if (fs.existsSync('scripts/raw_honest_box.png')) {
    await processBox('scripts/raw_honest_box.png', path.join(publicImagesDir, 'box_honest.jpg'));
  }

  console.log('\n--- ALL NEW BOXES PROCESSED SUCCESSFULLY ---');
}

main().catch(console.error);
