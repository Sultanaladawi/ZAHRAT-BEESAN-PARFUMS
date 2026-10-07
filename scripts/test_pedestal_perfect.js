const sharp = require('sharp');
const path = require('path');

async function testAdjustedPedestal() {
  const bgPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\luxury_ivory_pedestal_bg_1791217271340.jpg';
  const bottlePath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\laverne_tobacco_sample.jpg';
  const outPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\laverne_pedestal_perfect.jpg';

  // 1. Remove background cleanly (ignore the wall shadow if desired or keep subtle)
  const { data, info } = await sharp(bottlePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Key out white studio background
    if (r > 242 && g > 242 && b > 242) {
      data[i + 3] = 0;
    } else if (r > 228 && g > 228 && b > 228) {
      data[i + 3] = Math.round(((255 - Math.max(r, g, b)) / 27) * 255);
    }
  }

  // 2. Resize bottle to 300px wide, max 430px high
  const bottleCleaned = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .trim()
    .resize({ width: 310, height: 420, fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });

  // Marble podium surface is at y = 770
  const bW = bottleCleaned.info.width;
  const bH = bottleCleaned.info.height;
  const left = Math.round((1024 - bW) / 2);
  const top = Math.round(762 - bH); // rests firmly inside the gold rim!

  // Ground contact shadow
  const shadowSvg = `
  <svg width="${bW + 100}" height="40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${(bW + 100) / 2}" cy="20" rx="${bW * 0.42}" ry="12" fill="#2b2116" opacity="0.6" filter="blur(4px)" />
    <ellipse cx="${(bW + 100) / 2}" cy="20" rx="${bW * 0.28}" ry="6" fill="#140e09" opacity="0.8" filter="blur(2px)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  // Bottom luxury pill badge
  const badgeSvg = `
  <svg width="400" height="38" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldBrd" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b8935c" />
        <stop offset="50%" stop-color="#ecd7b3" />
        <stop offset="100%" stop-color="#8a6f44" />
      </linearGradient>
      <filter id="bShd" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#806d58" flood-opacity="0.22" />
      </filter>
    </defs>
    <rect x="2" y="2" width="396" height="34" rx="17" fill="#ffffff" stroke="url(#goldBrd)" stroke-width="1.2" filter="url(#bShd)" />
    <circle cx="24" cy="19" r="3.5" fill="url(#goldBrd)" />
    <circle cx="376" cy="19" r="3.5" fill="url(#goldBrd)" />
    <text x="200" y="24" text-anchor="middle" font-family="'Tajawal', 'Amiri', sans-serif" font-size="13" font-weight="bold" fill="#6d583c" letter-spacing="1">عطر أصلي 100% • وارد دار لافيرن الرسمية</text>
  </svg>
  `;
  const badgeBuf = await sharp(Buffer.from(badgeSvg)).png().toBuffer();

  await sharp(bgPath)
    .resize(1024, 1024)
    .composite([
      {
        input: shadowBuf,
        left: Math.round(left - 50),
        top: Math.round(750)
      },
      {
        input: bottleCleaned.data,
        left: left,
        top: top
      },
      {
        input: badgeBuf,
        left: Math.round((1024 - 400) / 2),
        top: 945
      }
    ])
    .jpeg({ quality: 96 })
    .toFile(outPath);

  console.log('Saved perfect pedestal composite to:', outPath);
}

testAdjustedPedestal().catch(console.error);
