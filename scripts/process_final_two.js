const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const twoProducts = [
  {
    id: 'varna-single',
    name: 'عطر فارنا',
    title: 'عطر فارنا الملكي',
    titleEn: 'Varna Royal Eau De Parfum',
    url: 'https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%81%D8%A7%D8%B1%D9%86%D8%A7/p1536608353',
    sarPrice: 190,
    categoryType: 'perfume'
  },
  {
    id: 'bundle-heritage-collection',
    name: 'باقة مجموعة التراث',
    title: 'باقة مجموعة التراث الفاخرة',
    titleEn: 'Heritage Collection Luxury Gift Set',
    url: 'https://ghalati.com/ar/%D8%A8%D8%A7%D9%82%D8%A9-%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A9-%D8%A7%D9%84%D8%AA%D8%B1%D8%A7%D8%AB/p1251043721',
    sarPrice: 296,
    categoryType: 'bundle'
  }
];

async function run() {
  const perfumesPath = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
  const perfumes = JSON.parse(fs.readFileSync(perfumesPath, 'utf8'));
  const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
  const publicImagesDir = path.join(__dirname, '..', 'public', 'images');

  for (const item of twoProducts) {
    console.log(`Processing ${item.id}...`);
    const res = await fetch(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();

    const imgMatches = [...html.matchAll(/https:\/\/cdn\.salla\.sa\/Dqvgy\/[a-zA-Z0-9_\-\.]+\.(?:png|jpg|jpeg)/gi)].map(m => m[0]);
    const uniqueImgs = [...new Set(imgMatches)].filter(u => !u.includes('favicon') && !u.includes('store-logo'));
    const bottle1000 = uniqueImgs.find(i => i.includes('1000x1000'));
    const mainImgUrl = bottle1000 || uniqueImgs[0];

    const imgRes = await fetch(mainImgUrl);
    const imgBuf = Buffer.from(await imgRes.arrayBuffer());

    fs.writeFileSync(path.join(publicImagesDir, `original_${item.id}.png`), imgBuf);

    if (item.categoryType === 'bundle') {
      const inner = await sharp(imgBuf)
        .resize({ width: 940, height: 940, fit: 'contain', background: { r: 247, g: 245, b: 240, alpha: 1 } })
        .toBuffer();

      await sharp({
        create: { width: 1024, height: 1024, channels: 4, background: { r: 247, g: 245, b: 240, alpha: 1 } }
      })
      .composite([{ input: inner, gravity: 'center' }])
      .jpeg({ quality: 95 })
      .toFile(path.join(publicImagesDir, `ghalati_${item.id}.jpg`));
    } else {
      // Single bottle on pedestal
      const { data, info } = await sharp(imgBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const w = info.width, h = info.height;
      const isBg = (x, y) => {
        const idx = (y * w + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        return (r >= 238 && g >= 238 && b >= 238);
      };
      const visited = new Uint8Array(w * h);
      const queue = [];
      for (let x = 0; x < w; x++) {
        if (isBg(x, 0)) { queue.push(x, 0); visited[x] = 1; }
        if (isBg(x, h - 1)) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
      }
      for (let y = 0; y < h; y++) {
        if (isBg(0, y) && !visited[y * w]) { queue.push(0, y); visited[y * w] = 1; }
        if (isBg(w - 1, y) && !visited[y * w + w - 1]) { queue.push(w - 1, y); visited[y * w + w - 1] = 1; }
      }
      let head = 0;
      while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];
        const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (let i = 0; i < 4; i++) {
          const nx = neighbors[i][0], ny = neighbors[i][1];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nPos = ny * w + nx;
            if (!visited[nPos] && isBg(nx, ny)) {
              visited[nPos] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (visited[y * w + x]) data[(y * w + x) * 4 + 3] = 0;
        }
      }
      const cleanedPng = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
      const trimmed = await sharp(cleanedPng).trim().toBuffer({ resolveWithObject: true });
      const resized = await sharp(trimmed.data).resize({ height: 515, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
      const bW = resized.info.width, bH = resized.info.height;
      const left = Math.round((1024 - bW) / 2);
      const baseContactY = 746;
      const top = baseContactY - bH;
      const shadowW = bW + 60;
      const shadowSvg = `
      <svg width="${shadowW}" height="30" xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="f1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4.0"/></filter></defs>
        <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.44}" ry="8" fill="#1b1209" opacity="0.65" filter="url(#f1)"/>
      </svg>`;
      const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

      await sharp(masterBgPath)
        .composite([
          { input: shadowBuf, left: Math.round(left - 30), top: baseContactY - 14 },
          { input: resized.data, left: left, top: top }
        ])
        .jpeg({ quality: 95 })
        .toFile(path.join(publicImagesDir, `ghalati_${item.id}.jpg`));
    }

    const baseJod = Math.round(item.sarPrice / 5.29);
    const finalJod = baseJod + 12;

    perfumes.push({
      id: item.id,
      title: item.title,
      titleEn: item.titleEn,
      brand: 'دار غلاتي (Ghalati)',
      categoryType: item.categoryType,
      sarPrice: item.sarPrice,
      baseJod,
      finalJod,
      url: item.url,
      bottleUrl: mainImgUrl,
      overview: item.categoryType === 'bundle' ? 'باقة إهداء تراثية ملكية فاخرة تجمع بين الأصالة والتميز بأرقى ابتكارات دار غلاتي للعطور.' : 'عطر فارنا الملكي، إشراقة أرستقراطية فريدة تجمع بين خشب الصندل العريق، الباتشولي وخشب الأرز بفوحان وثبات يدوم طوال اليوم.',
      opening: 'برغموت منعش، زعفران ملكي، ونفحات حمضية نقية',
      heart: 'خشب الصندل، خشب الأرز الأطلسي، وزهور بيضاء',
      base: 'باتشولي، عنبر ملكي دافئ، ومسك نقي',
      prominent: 'الصندل، خشب الأرز، الباتشولي',
      specs: {
        origin: 'المملكة العربية السعودية',
        category: 'للجنسين',
        size: item.categoryType === 'bundle' ? 'مجموعة متكاملة' : '100 مل',
        type: item.categoryType === 'bundle' ? 'باقة إهداء ملكية' : 'عطر شرقي خشبي فاخر'
      },
      image: `images/ghalati_${item.id}.jpg`,
      originalImage: `images/original_${item.id}.png`,
      galleryImages: uniqueImgs.slice(0, 4),
      overviewEn: item.categoryType === 'bundle' ? 'A prestigious royal heritage gift bundle bringing together iconic fragrances of Dar Ghalati in an artistic presentation.' : 'Varna Royal Eau De Parfum, a magnificent aristocratic creation blending precious sandalwood, cedar, and velvety patchouli.',
      openingEn: 'Fresh Bergamot, Royal Saffron, Pure Citrus',
      heartEn: 'Sandalwood, Atlas Cedar, White Florals',
      baseEn: 'Patchouli, Royal Amber, Pure Musk',
      prominentEn: 'Sandalwood, Cedarwood, Patchouli',
      specsEn: {
        origin: 'Kingdom of Saudi Arabia',
        category: 'Unisex',
        size: item.categoryType === 'bundle' ? 'Full Set' : '100 ml',
        type: item.categoryType === 'bundle' ? 'Royal Gift Bundle' : 'Prestige Woody Oriental EDP'
      }
    });

    console.log(`Added ${item.id} (${finalJod} JOD)`);
  }

  fs.writeFileSync(perfumesPath, JSON.stringify(perfumes, null, 2), 'utf8');
  console.log(`DONE! Total store products now: ${perfumes.length}`);
}

run();
