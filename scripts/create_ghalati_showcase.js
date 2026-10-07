const sharp = require('sharp');
const path = require('path');

async function createGhalatiShowcase() {
  const bgPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\luxury_ivory_pedestal_bg_1791217271340.jpg';
  const outPath = 'C:\\Users\\ECC\\Documents\\antigravity\\dazzling-carson\\zahrat-beesan-perfumes\\public\\images\\ghalati_purple_rose.jpg';
  const outBrain = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\ghalati_purple_rose_showcase.jpg';

  const bottleUrl = 'https://cdn.salla.sa/Dqvgy/ad3f35da-dbed-4e0a-ab83-95793dbca1f2-500x500-k6OZpnOFUh6arAfm8lVaV44mqTXzgUyHR9TXsgwW.png';
  console.log('Downloading Ghalati Purple Rose bottle...');
  const res = await fetch(bottleUrl);
  const buf = Buffer.from(await res.arrayBuffer());

  // Ghalati image is already PNG, clean transparency
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 242 && g > 242 && b > 242) {
      data[i + 3] = 0;
    } else if (r > 225 && g > 225 && b > 225) {
      data[i + 3] = Math.round(((255 - Math.max(r, g, b)) / 30) * 255);
    }
  }

  const trimmed = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .trim()
    .resize({ width: 310, height: 420, fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });

  const bW = trimmed.info.width;
  const bH = trimmed.info.height;
  const left = Math.round((1024 - bW) / 2);
  const top = 800 - bH;

  // Contact shadow
  const shadowSvg = `
  <svg width="${bW + 80}" height="36" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${(bW + 80) / 2}" cy="18" rx="${bW * 0.44}" ry="12" fill="#241b12" opacity="0.65" filter="blur(4px)" />
    <ellipse cx="${(bW + 80) / 2}" cy="18" rx="${bW * 0.3}" ry="6" fill="#0d0905" opacity="0.9" filter="blur(2px)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  // Badge with Ghalati brand name!
  const badgeSvg = `
  <svg width="380" height="38" xmlns="http://www.w3.org/2000/svg">
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
    <rect x="2" y="2" width="376" height="34" rx="17" fill="#ffffff" stroke="url(#goldBrd)" stroke-width="1.2" filter="url(#bShd)" />
    <circle cx="24" cy="19" r="3.5" fill="url(#goldBrd)" />
    <circle cx="356" cy="19" r="3.5" fill="url(#goldBrd)" />
    <text x="190" y="24" text-anchor="middle" font-family="'Cinzel', 'Tajawal', sans-serif" font-size="14" font-weight="bold" fill="#6d583c" letter-spacing="2">GHALATI • غَلاتي</text>
  </svg>
  `;
  const badgeBuf = await sharp(Buffer.from(badgeSvg)).png().toBuffer();

  await sharp(bgPath)
    .resize(1024, 1024)
    .composite([
      { input: shadowBuf, left: Math.round(left - 40), top: 785 },
      { input: trimmed.data, left: left, top: top },
      { input: badgeBuf, left: Math.round((1024 - 380) / 2), top: 945 }
    ])
    .jpeg({ quality: 96 })
    .toFile(outPath);

  // Also copy to brain
  await sharp(outPath).toFile(outBrain);
  console.log('Saved Ghalati Purple Rose showcase to:', outPath);
}

createGhalatiShowcase().catch(console.error);
