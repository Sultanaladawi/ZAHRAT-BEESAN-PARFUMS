const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const scratchDir = path.join(__dirname, 'scratch_logos');
const brandsDir = path.join(__dirname, '..', 'public', 'images', 'brands');

if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
if (!fs.existsSync(brandsDir)) fs.mkdirSync(brandsDir, { recursive: true });

const brandList = [
  {
    id: 'almajed',
    name: 'الماجد للعود',
    url: 'https://cdn.salla.sa/OqeQlR/nXCR6C2cOFuSv1iTLqtEoGAdovWmzeLmjn14NvN5.png',
    bg: '#ffffff',
    stroke: '#1B4D3E', // Almajed Emerald Green / Gold
    fitW: 380,
    fitH: 380
  },
  {
    id: 'samam',
    name: 'شركة صمام للعطور',
    url: 'https://cdn.files.salla.network/theme/949982809/347b973d-8b42-47a4-a56d-d1ba7b00c0fe.webp',
    bg: '#ffffff',
    stroke: '#D4AF37',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'asq',
    name: 'عبد الصمد القرشي',
    url: 'https://images.seeklogo.com/logo-png/53/1/abdulsamad-al-qurashi-logo-png_seeklogo-538301.png',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'al-rehab',
    name: 'شركة الرحاب',
    url: 'https://alrehab.com/wp-content/uploads/2020/08/logo.png',
    bg: '#ffffff',
    stroke: '#D4AF37',
    fitW: 400,
    fitH: 260
  },
  {
    id: 'oud-elite',
    name: 'شركة نخبة العود',
    url: 'https://cdn.salla.sa/wWORaV/w7rG7JtxSIcfpJV5fS7eaUlBAeM2N6pu5LS4yxYa.png',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'dokhoun',
    name: 'دخون الإماراتية',
    url: 'https://media.zid.store/706d9094-6596-4a2d-a51c-684cae1ad600/11c64dc7-44ac-4b68-bcfd-4ea5a9e8c07a.png',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'al-ezz',
    name: 'شركة العز للعود',
    url: 'https://cdn.files.salla.network/theme/1119422688/65a7e5ae-6eff-4faa-8d8a-48db025f9fce_500x178.png',
    bg: '#ffffff',
    stroke: '#8A5D3B',
    fitW: 420,
    fitH: 240
  },
  {
    id: 'banafa',
    name: 'شركة بنافع للعود',
    url: 'https://cdn.files.salla.network/theme/1344866184/2db67083-0bef-4d00-b6b2-8d772e209f03.png',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 400,
    fitH: 300
  },
  {
    id: 'labonair',
    name: 'شركة لابونير',
    url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=478,fit=crop,q=95/Aq2vgoxxR1sKVEG1/sin-tatulo-mePv2Q4NMMcO7Ev0.png',
    bg: '#ffffff',
    stroke: '#1A1A1A',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'thunayan',
    name: 'شركة ثنيان',
    url: 'https://cdn.salla.sa/gRaBw/bexszze1SFQZytwduH0cOgUiNhfxnDnk97aWLXMj.png',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'sadr-al-khaleej',
    name: 'شركة صدر الخليج',
    url: 'http://sedralkhaleej.com/cdn/shop/files/Sedr_Al-Khaleej.png?v=1725173645&width=2048',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'shams',
    name: 'شركة شمس',
    url: 'https://cdn.salla.sa/vmkiTAPUJZ7FKXf4ydHqGZxL2ohlgShk7z8iZ55O.jpg',
    bg: '#ffffff',
    stroke: '#D4AF37',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'osma',
    name: 'شركة أوسما',
    url: 'https://cdn.salla.sa/YNEym/uU1jT6EewuMP45wtjgH7hKHB3OEb2fGcLGGxE5AU.png',
    bg: '#ffffff',
    stroke: '#1A1A1A',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'assaf',
    name: 'عطور عساف',
    url: 'https://cdn.files.salla.network/homepage/935113581/c957040d-845b-4e7b-82d9-98249c2fbfbc.webp',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'laverne',
    name: 'عطور لافيرن',
    url: 'https://cdn.files.salla.network/theme/504871843/6fe42ea1-952d-4310-99b0-8e4e7c7f4693_500x111.png',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 420,
    fitH: 220
  },
  {
    id: 'arabian-oud',
    name: 'العربية للعود',
    url: 'https://cdn.salla.sa/doPqe/XdgfhIIbvIli1UgPMujV8ZAYnP8asdkgUsoPhJnO.png',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'dokhoun-perfumes',
    name: 'دخون للعطور',
    url: 'http://dkhoun.com/cdn/shop/files/Group_3951.png?v=1778096000',
    bg: '#ffffff',
    stroke: '#8A5D3B',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'ibrahim-al-qurashi',
    name: 'إبراهيم القرشي',
    url: 'https://cdn.files.salla.network/other/2084701115/ab139722-93e7-4ea0-b942-68759ef2e55b-original.webp',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'atyab-al-marshoud',
    name: 'أطياب المرشود',
    url: 'http://www.atyabalmarshoud.com/cdn/shop/files/square_logo_Black_dfffc233-42bd-4169-bc74-808baab03c39_2133x2133.jpg?v=1787218761',
    bg: '#ffffff',
    stroke: '#1A1A1A',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'gissah',
    name: 'عطور قصة',
    url: 'https://kw.gissah.com/gissah_website_design/static/src/img/homepage/MenuLogo.svg',
    bg: '#ffffff',
    stroke: '#1A1A1A',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'areeb',
    name: 'أريب للعطور',
    url: 'https://cdn.salla.sa/lOyr/ZTwcZBjwUaIfK7xRhMjVSqyRhw5T9ADTznWehTgA.png',
    bg: '#ffffff',
    stroke: '#D4AF37',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'swiss-arabian',
    name: 'سويس أربيان',
    url: 'https://images.seeklogo.com/logo-png/25/2/swiss-arabian-logo-png_seeklogo-257200.png',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 400,
    fitH: 260
  },
  {
    id: 'ajmal',
    name: 'أجمل للعطور',
    url: 'https://images.seeklogo.com/logo-png/54/2/ajmal-perfumes-logo-png_seeklogo-545296.png',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'ard-al-zaafaran',
    name: 'أرض الزعفران',
    url: 'https://fimgs.net/mdimg/dizajneri/o.2917.jpg',
    bg: '#ffffff',
    stroke: '#C5A880',
    fitW: 380,
    fitH: 380
  },
  {
    id: 'surrati',
    name: 'سرتي للعطور',
    url: 'https://cdn.salla.sa/pmwEP/P7k9mRn75RuiNe6zKJ6MpZd4dWEbnUbpUhVNjSBm.png',
    bg: '#ffffff',
    stroke: '#8A5D3B',
    fitW: 380,
    fitH: 380
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 10000
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFile(res.headers.location, dest).then(resolve);
        }
        if (res.statusCode !== 200) return resolve(false);
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch(e) {
      resolve(false);
    }
  });
}

async function processAll() {
  console.log(`Starting download and medallion generation for all ${brandList.length} houses...`);

  for (const b of brandList) {
    const rawDest = path.join(scratchDir, `${b.id}_raw`);
    
    // Check if we already have it in scratch_logos or download it
    let localPath = null;
    const extensions = ['.png', '.jpg', '.webp', '.svg'];
    for (const ext of extensions) {
      const p = path.join(scratchDir, b.id + ext);
      if (fs.existsSync(p) && fs.statSync(p).size > 200) {
        localPath = p;
        break;
      }
    }

    if (!localPath) {
      console.log(`Downloading [${b.id}] from ${b.url}...`);
      const ext = b.url.includes('.svg') ? '.svg' : b.url.includes('.webp') ? '.webp' : b.url.includes('.jpg') ? '.jpg' : '.png';
      const dest = path.join(scratchDir, b.id + ext);
      const ok = await downloadFile(b.url, dest);
      if (ok && fs.existsSync(dest) && fs.statSync(dest).size > 200) {
        localPath = dest;
      } else {
        console.error(`Failed to download ${b.id}`);
        continue;
      }
    }

    console.log(`Processing medallion for [${b.id}] using ${localPath}...`);

    try {
      // 1. Process resized logo with transparent/contained padding
      let resizedLogo;
      if (localPath.endsWith('.svg')) {
        resizedLogo = await sharp(localPath)
          .resize(b.fitW, b.fitH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
      } else {
        resizedLogo = await sharp(localPath)
          .resize(b.fitW, b.fitH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
      }

      // 2. Composite onto 512x512 canvas
      const circleCanvas = await sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: b.bg
        }
      })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toBuffer();

      // Save PNG
      fs.writeFileSync(path.join(brandsDir, `${b.id}.png`), circleCanvas);

      // 3. Create SVG medallion
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
      console.log(`✓ [${b.id}] Medallion PNG and SVG successfully created!`);
    } catch(err) {
      console.error(`Error processing ${b.id}:`, err.message);
    }
  }

  console.log('\nAll 25 brand medallions finished processing!');
}

processAll();
