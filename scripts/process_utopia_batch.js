const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const uploadDir = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded';

async function processAll() {
  console.log('--- Processing Utopia Batch ---');

  // 1. Box for Utopia Ideal (media_1791368527953.png - 660x900 alpha)
  const idealBoxSrc = path.join(uploadDir, 'media_1791368527953.png');
  await sharp(idealBoxSrc)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_utopia-ideal.jpg'));
  console.log('✓ Saved box_utopia-ideal.jpg');

  // 2. Box for Utopia Gist (scripts/raw_utopia_gist_box.jpg - 1772x1417)
  const gistBoxSrc = path.join(__dirname, 'raw_utopia_gist_box.jpg');
  await sharp(gistBoxSrc)
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_utopia-gist.jpg'));
  console.log('✓ Saved box_utopia-gist.jpg');

  // 3. Card for Utopia Gist (media_1791368595755.jpg - 1024x1024)
  const gistCardSrc = path.join(uploadDir, 'media_1791368595755.jpg');
  await sharp(gistCardSrc)
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'card_utopia-gist.jpg'));
  console.log('✓ Saved card_utopia-gist.jpg');

  // 4. Card for Utopia Platinum (media_1791368622542.jpg - 1024x1024)
  const platCardSrc = path.join(uploadDir, 'media_1791368622542.jpg');
  await sharp(platCardSrc)
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'card_utopia-platinum.jpg'));
  console.log('✓ Saved card_utopia-platinum.jpg');

  // 5. Box for Utopia Essence (media_1791368486181.png - 750x750 alpha)
  const essenceBoxSrc = path.join(uploadDir, 'media_1791368486181.png');
  await sharp(essenceBoxSrc)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicImagesDir, 'box_utopia-essence.jpg'));
  console.log('✓ Saved box_utopia-essence.jpg');

  // 6. Update public/data/perfumes.json
  const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

  // Utopia Ideal
  const ideal = perfumes.find(p => p.id === 'utopia-ideal');
  if (ideal) {
    ideal.boxImage = 'images/box_utopia-ideal.jpg';
    console.log('✓ Updated utopia-ideal boxImage');
  }

  // Utopia Gist
  const gist = perfumes.find(p => p.id === 'utopia-gist');
  if (gist) {
    gist.boxImage = 'images/box_utopia-gist.jpg';
    gist.fragranticaCard = 'images/card_utopia-gist.jpg';
    console.log('✓ Updated utopia-gist boxImage and fragranticaCard');
  }

  // Utopia Platinum
  const plat = perfumes.find(p => p.id === 'utopia-platinum');
  if (plat) {
    plat.fragranticaCard = 'images/card_utopia-platinum.jpg';
    console.log('✓ Updated utopia-platinum fragranticaCard');
  }

  // Utopia Essence
  const essence = perfumes.find(p => p.id === 'utopia-essence');
  if (essence) {
    essence.boxImage = 'images/box_utopia-essence.jpg';
    console.log('✓ Updated utopia-essence boxImage');
  }

  // Deduplication check
  perfumes.forEach(p => {
    const seen = new Set();
    if (p.image) seen.add(p.image);
    if (p.boxImage) {
      if (seen.has(p.boxImage)) p.boxImage = null;
      else seen.add(p.boxImage);
    }
    if (p.originalImage) {
      if (seen.has(p.originalImage)) p.originalImage = null;
      else seen.add(p.originalImage);
    }
    if (p.fragranticaCard) {
      if (seen.has(p.fragranticaCard)) p.fragranticaCard = null;
      else seen.add(p.fragranticaCard);
    }
    if (Array.isArray(p.galleryImages)) {
      p.galleryImages = p.galleryImages.filter(img => {
        if (!img || seen.has(img)) return false;
        seen.add(img);
        return true;
      });
    }
  });

  fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
  console.log('✓ Saved updated perfumes.json');
}

processAll().catch(console.error);
