const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const uploadedDir = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/';
const brandsDir = path.join(__dirname, '..', 'public', 'images', 'brands');

async function processLogos() {
  // Ensure target directory exists
  if (!fs.existsSync(brandsDir)) {
    fs.mkdirSync(brandsDir, { recursive: true });
  }

  // 1. Rasasi
  {
    console.log('Processing Rasasi...');
    const cropped = await sharp(path.join(uploadedDir, 'media_1791403994648.webp'))
      .extract({ left: 100, top: 90, width: 820, height: 340 })
      .resize(400, 260, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    const circleCanvas = await sharp({
      create: { width: 512, height: 512, channels: 4, background: '#ffffff' }
    })
      .composite([{ input: cropped, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(brandsDir, 'rasasi.png'), circleCanvas);

    const b64 = circleCanvas.toString('base64');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <clipPath id="clip-rasasi">
      <circle cx="50" cy="50" r="47"/>
    </clipPath>
  </defs>
  <!-- Circular Outer Medallion -->
  <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#C5A880" stroke-width="2"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="#C5A880" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>
  <!-- Official Brand Image Logo -->
  <g clip-path="url(#clip-rasasi)">
    <image href="data:image/png;base64,${b64}" x="3" y="3" width="94" height="94" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>
`;
    fs.writeFileSync(path.join(brandsDir, 'rasasi.svg'), svg, 'utf8');
    console.log('Successfully created rasasi.png and rasasi.svg');
  }

  // 2. Zimaya
  {
    console.log('Processing Zimaya...');
    const cropped = await sharp(path.join(uploadedDir, 'media_1791404026587.webp'))
      .extract({ left: 50, top: 80, width: 915, height: 320 })
      .resize(400, 260, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    const circleCanvas = await sharp({
      create: { width: 512, height: 512, channels: 4, background: '#ffffff' }
    })
      .composite([{ input: cropped, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(brandsDir, 'zimaya.png'), circleCanvas);

    const b64 = circleCanvas.toString('base64');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <clipPath id="clip-zimaya">
      <circle cx="50" cy="50" r="47"/>
    </clipPath>
  </defs>
  <!-- Circular Outer Medallion -->
  <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#D4AF37" stroke-width="2"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>
  <!-- Official Brand Image Logo -->
  <g clip-path="url(#clip-zimaya)">
    <image href="data:image/png;base64,${b64}" x="3" y="3" width="94" height="94" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>
`;
    fs.writeFileSync(path.join(brandsDir, 'zimaya.svg'), svg, 'utf8');
    console.log('Successfully created zimaya.png and zimaya.svg');
  }

  // 3. Al Dakheel Oud
  {
    console.log('Processing Al Dakheel Oud...');
    const cropped = await sharp(path.join(uploadedDir, 'media_1791404058260.jpg'))
      .extract({ left: 10, top: 80, width: 720, height: 200 })
      .resize(420, 220, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    const circleCanvas = await sharp({
      create: { width: 512, height: 512, channels: 4, background: '#ffffff' }
    })
      .composite([{ input: cropped, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(brandsDir, 'al-dakheel.png'), circleCanvas);

    const b64 = circleCanvas.toString('base64');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <clipPath id="clip-al-dakheel">
      <circle cx="50" cy="50" r="47"/>
    </clipPath>
  </defs>
  <!-- Circular Outer Medallion -->
  <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#6B1D2F" stroke-width="2"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="#6B1D2F" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>
  <!-- Official Brand Image Logo -->
  <g clip-path="url(#clip-al-dakheel)">
    <image href="data:image/png;base64,${b64}" x="3" y="3" width="94" height="94" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>
`;
    fs.writeFileSync(path.join(brandsDir, 'al-dakheel.svg'), svg, 'utf8');
    console.log('Successfully created al-dakheel.png and al-dakheel.svg');
  }

  // 4. Deraah Perfumes
  {
    console.log('Processing Deraah...');
    const dImg = sharp(path.join(uploadedDir, 'media_1791404085914.jpg'));
    const { data } = await dImg.raw().toBuffer({ resolveWithObject: true });
    // Fill LinkedIn avatar anti-aliased corners with Deraah brand pink
    for (let y = 0; y < 200; y++) {
      for (let x = 0; x < 200; x++) {
        const idx = (y * 200 + x) * 3;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const isCorner = (x < 25 || x > 175) && (y < 25 || y > 175);
        if (isCorner && !(r > 180 && g < 50 && b > 90)) {
          data[idx] = 205;
          data[idx+1] = 26;
          data[idx+2] = 118;
        }
      }
    }
    const cleaned = await sharp(data, { raw: { width: 200, height: 200, channels: 3 } })
      .resize(420, 420, { fit: 'contain' })
      .png()
      .toBuffer();

    const circleCanvas = await sharp({
      create: { width: 512, height: 512, channels: 4, background: '#CD1A76' }
    })
      .composite([{ input: cleaned, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(brandsDir, 'deraah.png'), circleCanvas);

    const b64 = circleCanvas.toString('base64');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <clipPath id="clip-deraah">
      <circle cx="50" cy="50" r="47"/>
    </clipPath>
  </defs>
  <!-- Circular Outer Medallion -->
  <circle cx="50" cy="50" r="48" fill="#CD1A76" stroke="#D4AF37" stroke-width="2"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>
  <!-- Official Brand Image Logo -->
  <g clip-path="url(#clip-deraah)">
    <image href="data:image/png;base64,${b64}" x="3" y="3" width="94" height="94" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>
`;
    fs.writeFileSync(path.join(brandsDir, 'deraah.svg'), svg, 'utf8');
    console.log('Successfully created deraah.png and deraah.svg');
  }

  // 5. Reef Perfumes
  {
    console.log('Processing Reef...');
    const cropped = await sharp(path.join(uploadedDir, 'media_1791404142039.png'))
      .extract({ left: 24, top: 20, width: 172, height: 190 })
      .resize(360, 360, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    const circleCanvas = await sharp({
      create: { width: 512, height: 512, channels: 4, background: '#ffffff' }
    })
      .composite([{ input: cropped, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(brandsDir, 'reef.png'), circleCanvas);

    const b64 = circleCanvas.toString('base64');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <clipPath id="clip-reef">
      <circle cx="50" cy="50" r="47"/>
    </clipPath>
  </defs>
  <!-- Circular Outer Medallion -->
  <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#E5744C" stroke-width="2"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="#E5744C" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>
  <!-- Official Brand Image Logo -->
  <g clip-path="url(#clip-reef)">
    <image href="data:image/png;base64,${b64}" x="3" y="3" width="94" height="94" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>
`;
    fs.writeFileSync(path.join(brandsDir, 'reef.svg'), svg, 'utf8');
    console.log('Successfully created reef.png and reef.svg');
  }

  console.log('\nAll 5 brand logos processed and medallions generated successfully!');
}

processLogos().catch(err => {
  console.error('Fatal error during logo processing:', err);
  process.exit(1);
});
