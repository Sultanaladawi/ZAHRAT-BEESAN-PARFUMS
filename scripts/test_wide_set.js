const sharp = require('sharp');

async function testWideSet() {
  const bgPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\luxury_ivory_wide_collection_1791217806211.jpg';
  const outPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\risk_collection_pedestal.jpg';
  const boxUrl = 'https://cdn.shopify.com/s/files/1/0621/8081/9111/files/image_2026-09-30_115050613.png?v=1790758254';

  console.log('Downloading Risk box set...');
  const res = await fetch(boxUrl);
  const buf = Buffer.from(await res.arrayBuffer());

  // Clean white background smoothly
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 244 && g > 244 && b > 244) {
      data[i + 3] = 0;
    } else if (r > 230 && g > 230 && b > 230) {
      data[i + 3] = Math.round(((255 - Math.max(r, g, b)) / 25) * 255);
    }
  }

  // Wide pedestal surface is at y: 740, width is around 760px
  const boxCleaned = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .trim()
    .resize({ width: 660, height: 420, fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });

  const bW = boxCleaned.info.width;
  const bH = boxCleaned.info.height;
  const left = Math.round((1024 - bW) / 2);
  const top = 745 - bH; // rests firmly on the wide marble platform!

  // Soft contact shadow on the platform
  const shadowSvg = `
  <svg width="${bW + 60}" height="40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${(bW + 60) / 2}" cy="20" rx="${bW * 0.46}" ry="14" fill="#2d2217" opacity="0.6" filter="blur(4px)" />
    <ellipse cx="${(bW + 60) / 2}" cy="20" rx="${bW * 0.35}" ry="7" fill="#140d07" opacity="0.85" filter="blur(2px)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const badgeSvg = `
  <svg width="420" height="38" xmlns="http://www.w3.org/2000/svg">
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
    <rect x="2" y="2" width="416" height="34" rx="17" fill="#ffffff" stroke="url(#goldBrd)" stroke-width="1.2" filter="url(#bShd)" />
    <circle cx="24" cy="19" r="3.5" fill="url(#goldBrd)" />
    <circle cx="396" cy="19" r="3.5" fill="url(#goldBrd)" />
    <text x="210" y="24" text-anchor="middle" font-family="'Tajawal', 'Amiri', sans-serif" font-size="13" font-weight="bold" fill="#6d583c" letter-spacing="1">مجموعة فاخرة أصلية 100% • وارد دار عساف</text>
  </svg>
  `;
  const badgeBuf = await sharp(Buffer.from(badgeSvg)).png().toBuffer();

  await sharp(bgPath)
    .resize(1024, 1024)
    .composite([
      {
        input: shadowBuf,
        left: Math.round(left - 30),
        top: 730
      },
      {
        input: boxCleaned.data,
        left: left,
        top: top
      },
      {
        input: badgeBuf,
        left: Math.round((1024 - 420) / 2),
        top: 945
      }
    ])
    .jpeg({ quality: 96 })
    .toFile(outPath);

  console.log('Saved Risk collection pedestal composite to:', outPath);
}

testWideSet().catch(console.error);
