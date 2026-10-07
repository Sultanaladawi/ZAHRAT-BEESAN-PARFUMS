const sharp = require('sharp');
const path = require('path');

async function testLaverneOnPedestal() {
  const bgPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\luxury_ivory_pedestal_bg_1791217271340.jpg';
  const bottlePath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\laverne_tobacco_sample.jpg';
  const outPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\laverne_pedestal_showcase.jpg';

  // Remove white background from Laverne image
  const { data, info } = await sharp(bottlePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // If pixel is pure white or near white (background)
    if (r > 248 && g > 248 && b > 248) {
      data[i + 3] = 0;
    } else if (r > 238 && g > 238 && b > 238) {
      // smooth alpha feather
      data[i + 3] = Math.round(((255 - Math.max(r, g, b)) / 17) * 255);
    }
  }

  // Resize cleaned bottle
  const bottleCleaned = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .trim()
    .resize({ width: 340, height: 490, fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((1024 - bottleCleaned.info.width) / 2);
  const top = Math.round(765 - bottleCleaned.info.height);

  // Soft natural contact shadow on the marble
  const shadowSvg = `
  <svg width="${bottleCleaned.info.width + 120}" height="60" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${(bottleCleaned.info.width + 120) / 2}" cy="30" rx="${bottleCleaned.info.width * 0.4}" ry="16" fill="#3d3023" opacity="0.45" filter="blur(6px)" />
    <ellipse cx="${(bottleCleaned.info.width + 120) / 2}" cy="30" rx="${bottleCleaned.info.width * 0.25}" ry="9" fill="#1f1810" opacity="0.65" filter="blur(3px)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  // Subtle luxury badge on the card (bottom center)
  const badgeSvg = `
  <svg width="420" height="42" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldBrd" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b8935c" />
        <stop offset="50%" stop-color="#ecd7b3" />
        <stop offset="100%" stop-color="#8a6f44" />
      </linearGradient>
      <filter id="bShd" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#806d58" flood-opacity="0.25" />
      </filter>
    </defs>
    <rect x="2" y="2" width="416" height="38" rx="19" fill="#ffffff" stroke="url(#goldBrd)" stroke-width="1.2" filter="url(#bShd)" />
    <circle cx="28" cy="21" r="4" fill="url(#goldBrd)" />
    <circle cx="392" cy="21" r="4" fill="url(#goldBrd)" />
    <text x="210" y="26" text-anchor="middle" font-family="'Tajawal', 'Amiri', sans-serif" font-size="14" font-weight="bold" fill="#6d583c" letter-spacing="1">عطر أصلي 100% • وارد دار لافيرن الرسمية</text>
  </svg>
  `;
  const badgeBuf = await sharp(Buffer.from(badgeSvg)).png().toBuffer();

  await sharp(bgPath)
    .resize(1024, 1024)
    .composite([
      // Contact shadow
      {
        input: shadowBuf,
        left: Math.round(left - 60),
        top: Math.round(745)
      },
      // Bottle sitting on marble pedestal
      {
        input: bottleCleaned.data,
        left: left,
        top: top
      },
      // Authenticity badge at the bottom
      {
        input: badgeBuf,
        left: Math.round((1024 - 420) / 2),
        top: 940
      }
    ])
    .jpeg({ quality: 96 })
    .toFile(outPath);

  console.log('Saved Laverne pedestal showcase to:', outPath);
}

testLaverneOnPedestal().catch(console.error);
