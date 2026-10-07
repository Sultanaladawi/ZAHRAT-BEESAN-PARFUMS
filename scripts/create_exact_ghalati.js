const sharp = require('sharp');
const path = require('path');

async function createExactGhalati() {
  // 1. The EXACT master background from the Laverne Tobacco image
  const masterBgPath = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\luxury_ivory_pedestal_bg_1791217271340.jpg';
  const outPath = 'C:\\Users\\ECC\\Documents\\antigravity\\dazzling-carson\\zahrat-beesan-perfumes\\public\\images\\ghalati_exact_template.jpg';
  const outBrain = 'C:\\Users\\ECC\\.gemini\\antigravity\\brain\\cae38557-fc4c-4ef1-b1c0-cb4370487592\\ghalati_exact_template.jpg';

  // 2. Fetch Ghalati Purple Rose bottle
  const bottleUrl = 'https://cdn.salla.sa/Dqvgy/ad3f35da-dbed-4e0a-ab83-95793dbca1f2-500x500-k6OZpnOFUh6arAfm8lVaV44mqTXzgUyHR9TXsgwW.png';
  console.log('Downloading Ghalati bottle...');
  const res = await fetch(bottleUrl);
  const buf = Buffer.from(await res.arrayBuffer());

  // Clean transparency
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 240 && g > 240 && b > 240) {
      data[i + 3] = 0;
    } else if (r > 222 && g > 222 && b > 222) {
      data[i + 3] = Math.round(((255 - Math.max(r, g, b)) / 33) * 255);
    }
  }

  // Trim transparent borders & resize bottle to match Laverne proportions (~ 270x370)
  const trimmed = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .trim()
    .resize({ width: 280, height: 380, fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });

  const bW = trimmed.info.width;
  const bH = trimmed.info.height;
  const left = Math.round((1024 - bW) / 2);
  const top = 792 - bH; // Sits firmly on the marble podium, exactly like Laverne!

  // Soft contact shadow on marble
  const shadowSvg = `
  <svg width="${bW + 80}" height="36" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${(bW + 80) / 2}" cy="18" rx="${bW * 0.44}" ry="12" fill="#241b12" opacity="0.6" filter="blur(4px)" />
    <ellipse cx="${(bW + 80) / 2}" cy="18" rx="${bW * 0.28}" ry="6" fill="#0d0905" opacity="0.85" filter="blur(2px)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  // Exactly the same 3D gold pill badge from the Laverne image!
  // Width: 380, Height: 64, Pill radius: 32
  const badgeSvg = `
  <svg width="400" height="66" viewBox="0 0 400 66" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Metallic Gold Gradient -->
      <linearGradient id="goldBevel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fdf4db" />
        <stop offset="15%" stop-color="#dfc083" />
        <stop offset="50%" stop-color="#b89354" />
        <stop offset="85%" stop-color="#8f6e35" />
        <stop offset="100%" stop-color="#5a4118" />
      </linearGradient>

      <!-- Inner Pill Background Gradient -->
      <linearGradient id="innerPill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="60%" stop-color="#fcf9f2" />
        <stop offset="100%" stop-color="#f2ebe0" />
      </linearGradient>

      <!-- Gold Text Gradient -->
      <linearGradient id="goldText" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#80622d" />
        <stop offset="100%" stop-color="#543c16" />
      </linearGradient>

      <filter id="pillShadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#55442f" flood-opacity="0.22" />
      </filter>
    </defs>

    <!-- Outer Gold Metallic Bevel Frame -->
    <g filter="url(#pillShadow)">
      <rect x="4" y="3" width="392" height="56" rx="28" fill="url(#goldBevel)" />
      <!-- Inner Clean Surface -->
      <rect x="7" y="6" width="386" height="50" rx="25" fill="url(#innerPill)" />
      <!-- Delicate Inner Gold Line -->
      <rect x="10" y="9" width="380" height="44" rx="22" fill="none" stroke="#d8ba82" stroke-width="0.8" opacity="0.6" />
    </g>

    <!-- Decorative Gold Dots -->
    <circle cx="34" cy="31" r="3" fill="#a07d42" />
    <circle cx="366" cy="31" r="3" fill="#a07d42" />

    <!-- Brand Text: GHALATI • غلاتي -->
    <text x="200" y="38" text-anchor="middle" font-family="'Cinzel', 'Playfair Display', 'Tajawal', sans-serif" font-size="20" font-weight="700" fill="url(#goldText)" letter-spacing="3">
      GHALATI  •  غَـلاتـي
    </text>
  </svg>
  `;
  const badgeBuf = await sharp(Buffer.from(badgeSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .resize(1024, 1024)
    .composite([
      // 1. Contact shadow on marble
      {
        input: shadowBuf,
        left: Math.round(left - 40),
        top: 778
      },
      // 2. Ghalati bottle standing on marble
      {
        input: trimmed.data,
        left: left,
        top: top
      },
      // 3. Exact 3D Gold Pill Badge at the bottom
      {
        input: badgeBuf,
        left: Math.round((1024 - 400) / 2),
        top: 928
      }
    ])
    .jpeg({ quality: 96 })
    .toFile(outPath);

  // Save copy to brain folder
  await sharp(outPath).toFile(outBrain);
  console.log('Saved EXACT Ghalati template to:', outPath);
}

createExactGhalati().catch(console.error);
