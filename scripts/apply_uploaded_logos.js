const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const uploadedDir = 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/';
const brandsDir = path.join(__dirname, '..', 'public', 'images', 'brands');

const brands = [
  {
    id: 'ghalati',
    file: 'media_1791403494460.webp',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitWidth: 350,
    fitHeight: 350
  },
  {
    id: 'lattafa',
    file: 'media_1791403549387.png',
    bg: '#ffffff',
    stroke: '#D4AF37',
    fitWidth: 360,
    fitHeight: 360
  },
  {
    id: 'afnan',
    file: 'media_1791403613180.jpg',
    bg: '#0B1B3D',
    stroke: '#E2B855',
    fitWidth: 350,
    fitHeight: 350
  },
  {
    id: 'ahmed-al-maghribi',
    file: 'media_1791403631634.jpg',
    bg: '#ffffff',
    stroke: '#E5B842',
    fitWidth: 360,
    fitHeight: 360
  },
  {
    id: 'al-haramain',
    file: 'media_1791403677526.jpg',
    bg: '#ffffff',
    stroke: '#9E1B32',
    fitWidth: 360,
    fitHeight: 360
  }
];

async function run() {
  for (const b of brands) {
    const inputPath = path.join(uploadedDir, b.file);
    
    // 1. Process trimmed logo into high-res buffer
    const resizedLogoBuffer = await sharp(inputPath)
      .resize(b.fitWidth, b.fitHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // 2. Composite onto a 512x512 canvas with brand background
    const circleCanvas = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: b.bg
      }
    })
    .composite([
      { input: resizedLogoBuffer, gravity: 'center' }
    ])
    .png()
    .toBuffer();

    // Save 512x512 PNG
    fs.writeFileSync(path.join(brandsDir, `${b.id}.png`), circleCanvas);

    // 3. Create SVG embedding the exact high-res PNG as base64
    const b64 = circleCanvas.toString('base64');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <clipPath id="clip-${b.id}">
      <circle cx="50" cy="50" r="47"/>
    </clipPath>
  </defs>
  <!-- Circular Outer Medallion -->
  <circle cx="50" cy="50" r="48" fill="${b.bg}" stroke="${b.stroke}" stroke-width="2"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="${b.stroke}" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>
  <!-- Official Brand Image Logo -->
  <g clip-path="url(#clip-${b.id})">
    <image href="data:image/png;base64,${b64}" x="3" y="3" width="94" height="94" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>
`;

    fs.writeFileSync(path.join(brandsDir, `${b.id}.svg`), svg, 'utf8');
    console.log('Successfully created official medallion SVG & PNG for:', b.id);
  }
}

run().catch(console.error);
