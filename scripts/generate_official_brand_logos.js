const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const brands = [
  {
    id: 'thunayan',
    src: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791896611763_a3f08896.webp',
    type: 'white_text_alpha',
    maxWidth: 360,
    maxHeight: 140
  },
  {
    id: 'laverne',
    src: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791896672841_a2cff140.png',
    type: 'transparent_black',
    maxWidth: 340,
    maxHeight: 340
  },
  {
    id: 'assaf',
    src: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791896785840_c68faff3.webp',
    type: 'transparent_black',
    maxWidth: 340,
    maxHeight: 340
  },
  {
    id: 'labonair',
    src: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791896826938_cdfbb209.jpg',
    type: 'white_bg_trim',
    maxWidth: 360,
    maxHeight: 200
  },
  {
    id: 'al-rehab',
    src: 'C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/.user_uploaded/media_1791896855235_52c13d20.webp',
    type: 'transparent_black',
    maxWidth: 360,
    maxHeight: 160
  }
];

async function generate() {
  for (const b of brands) {
    let logoBuffer;

    if (b.type === 'white_text_alpha') {
      const { data, info } = await sharp(b.src).raw().toBuffer({ resolveWithObject: true });
      // Turn white pixels to dark royal espresso/black (#111111) while preserving exact alpha antialiasing
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 20;     // R
        data[i+1] = 18;   // G
        data[i+2] = 16;   // B
      }
      const blackPng = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
      const trimmed = await sharp(blackPng).trim().toBuffer();
      logoBuffer = await sharp(trimmed).resize({ width: b.maxWidth, height: b.maxHeight, fit: 'inside' }).toBuffer();
    } else if (b.type === 'white_bg_trim') {
      const trimmed = await sharp(b.src).trim({ background: { r: 255, g: 255, b: 255 } }).toBuffer();
      logoBuffer = await sharp(trimmed).resize({ width: b.maxWidth, height: b.maxHeight, fit: 'inside' }).toBuffer();
    } else {
      const trimmed = await sharp(b.src).trim().toBuffer();
      logoBuffer = await sharp(trimmed).resize({ width: b.maxWidth, height: b.maxHeight, fit: 'inside' }).toBuffer();
    }

    // 1. Create clean circular medallion PNG 512x512
    const finalPngBuffer = await sharp({
      create: { width: 512, height: 512, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    }).composite([{ input: logoBuffer, gravity: 'center' }]).png().toBuffer();

    // Save PNG to public/images/brands/
    fs.writeFileSync(`public/images/brands/${b.id}.png`, finalPngBuffer);

    // 2. Create SVG with medallion and base64 embedded image
    const base64Data = finalPngBuffer.toString('base64');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <clipPath id="clip-${b.id}">
      <circle cx="50" cy="50" r="47"/>
    </clipPath>
  </defs>
  <!-- Circular Outer Medallion -->
  <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#C5A880" stroke-width="2"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="#C5A880" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>
  <!-- Official Brand Image Logo -->
  <g clip-path="url(#clip-${b.id})">
    <image href="data:image/png;base64,${base64Data}" x="5" y="5" width="90" height="90" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>
`;
    fs.writeFileSync(`public/images/brands/${b.id}.svg`, svgContent, 'utf8');

    // Also render SVG to scratch to visually verify the rendered medallion
    const renderedSvg = await sharp(Buffer.from(svgContent)).png().toBuffer();
    fs.writeFileSync(`C:/Users/ECC/.gemini/antigravity/brain/cae38557-fc4c-4ef1-b1c0-cb4370487592/scratch/medallion_${b.id}.png`, renderedSvg);
    console.log(`Generated official brand assets for: ${b.id}`);
  }
}

generate().catch(console.error);
