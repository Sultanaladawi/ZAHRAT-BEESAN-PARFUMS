// ══════════════════════════════════════════════════════════
// 🃏 Perfume card: a 1080×1350 image drawn in the browser for each product
// (title, house, the podium bottle, the main notes as coloured bars and the
// fragrance pyramid with a round photo per ingredient). It is added to the
// product gallery after the supplier's photos, so it works in the thumbnails,
// the main viewer and the lightbox like any other picture. Notes come from
// notes.js; products without at least two real notes get no card.
// ══════════════════════════════════════════════════════════

const ZB_CARD = { W: 1080, H: 1350 };
const zbCardCache = new Map(); // product id + language → blob URL

const ZB_CARD_HOUSES = {
  ghalati: ['غلاتي', 'GHALATI'], assaf: ['عساف', 'ASSAF'], thnyan: ['ثنيان', 'THNYAN'],
  rasasi: ['الرصاصي', 'RASASI'], alrehab: ['الرحاب', 'AL REHAB'], lebonheur: ['لو بانهور', 'LE BONHEUR'],
  laverne: ['لافيرن', 'LAVERNE'], deraah: ['درعة', 'DERAAH'], oudelite: ['نخبة العود', 'OUD ELITE'],
};
const ZB_BAR_COLORS = [['#7a4a1a', '#ffffff'], ['#ecdcc8', '#1a1a1a'], ['#e3d6ea', '#1a1a1a'], ['#f7efc4', '#1a1a1a'], ['#dfe9dc', '#1a1a1a']];

function zbCardHouse(p) {
  const id = String(p.id || '');
  const key = p.house === 'thunayan' || id.startsWith('thnyan-') ? 'thnyan'
    : p.house === 'al-rehab' || id.startsWith('alrehab-') ? 'alrehab'
    : p.house === 'labonair' || id.startsWith('lebonheur-') ? 'lebonheur'
    : (Object.keys(ZB_CARD_HOUSES).find(k => p.house === k || id.startsWith(k + '-')) || 'ghalati');
  return ZB_CARD_HOUSES[key];
}

function zbLoadImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    // Our own files only: a foreign image would block exporting the canvas.
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function zbRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function zbFitText(ctx, text, maxWidth, font, startSize, minSize) {
  let size = startSize;
  for (; size > minSize; size -= 2) {
    ctx.font = font.replace('{s}', size);
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  ctx.font = font.replace('{s}', size);
  return size;
}

// Draws an image cropped to fill a box (object-fit: cover).
function zbDrawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s, sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function zbDrawNotePhoto(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(120, 85, 35, 0.22)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    zbDrawCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, '#f3e3c3');
    g.addColorStop(1, '#c5a880');
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(r * 0.9)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', cx, cy + 2);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#e5cda8';
  ctx.lineWidth = 2;
  ctx.stroke();
}

async function zbRenderPerfumeCard(p, lang) {
  const N = window.PerfumeNotes;
  if (!N) return null;
  const notes = N.perfumeNotes(p);
  if (notes.count < 2) return null;

  const isAr = lang !== 'en';
  const { W, H } = ZB_CARD;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.direction = isAr ? 'rtl' : 'ltr';
  // x measured from the reading start (right in Arabic, left in English).
  const X = v => (isAr ? W - v : v);
  const start = isAr ? 'right' : 'left';
  const end = isAr ? 'left' : 'right';

  await Promise.all(['700 40px Amiri', '400 40px Amiri', '600 30px Cinzel', '800 30px Tajawal', '500 30px Tajawal']
    .map(f => document.fonts.load(f).catch(() => {})));

  const allNotes = [...notes.prominent, ...notes.opening, ...notes.heart, ...notes.base];
  const photoSrc = n => (n.key ? `images/notes/${n.key}.webp` : null);
  const photos = new Map(await Promise.all([...new Set(allNotes.map(photoSrc).filter(Boolean))]
    .map(async src => [src, await zbLoadImage(src)])));
  const bottle = /^(images\/|\/images\/)/.test(p.image || '') ? await zbLoadImage(p.image) : null;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fbf7f0');
  bg.addColorStop(1, '#f3eadb');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Top band: names, house, category and size
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = '#e5cda8';
  ctx.fillRect(0, 208, W, 2);
  const [houseAr, houseEn] = zbCardHouse(p);
  const titleEn = String(p.titleEn || p.title || '').replace(/\s*(Eau De Parfum|Eau de Parfum|EDP|Perfume|Parfum)\s*$/i, '').trim();
  const titleAr = String(p.title || '').replace(/^عطر\s+/, '').trim();
  const bigTitle = isAr ? titleEn : titleEn;
  const smallTitle = isAr ? titleAr : titleAr;
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = start;
  ctx.textBaseline = 'alphabetic';
  ctx.direction = 'ltr';
  zbFitText(ctx, bigTitle, 640, '700 {s}px Amiri', 78, 40);
  ctx.textAlign = start;
  ctx.fillText(bigTitle, X(70), 112);
  ctx.direction = 'rtl';
  ctx.fillStyle = '#a6865d';
  zbFitText(ctx, smallTitle, 640, '400 {s}px Amiri', 40, 26);
  ctx.textAlign = start;
  ctx.fillText(smallTitle, X(70), 168);
  ctx.direction = isAr ? 'rtl' : 'ltr';

  const specs = p.specs || {};
  ctx.textAlign = end;
  ctx.fillStyle = '#a6865d';
  ctx.font = '600 30px Cinzel';
  ctx.direction = 'ltr';
  ctx.fillText(houseEn, X(W - 70), 98);
  ctx.direction = 'rtl';
  ctx.fillStyle = '#4a4a4a';
  ctx.font = '500 26px Tajawal';
  const real = v => (v && !/حسب المنتج|see product/i.test(v) ? v : '');
  const meta = isAr
    ? [real(specs.category), real(specs.size)].filter(Boolean).join(' · ')
    : [real((p.specsEn || {}).category), real((p.specsEn || {}).size) || real(specs.size)].filter(Boolean).join(' · ');
  ctx.direction = isAr ? 'rtl' : 'ltr';
  ctx.fillText(meta || (isAr ? houseAr : houseEn), X(W - 70), 142);

  // Bottle on our podium
  const bx = isAr ? W - 60 - 440 : 60;
  ctx.save();
  ctx.shadowColor = 'rgba(80, 55, 20, 0.28)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  zbRoundRect(ctx, bx, 250, 440, 520, 26);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  ctx.save();
  zbRoundRect(ctx, bx, 250, 440, 520, 26);
  ctx.clip();
  // Packs and sets keep the supplier's photo on white: show all of it.
  const whole = p.imageLayout === 'original' || (!p.imageLayout && ['bundle', 'gift_set', 'bakhoor'].includes(p.categoryType));
  if (bottle && whole) {
    const s = Math.min(440 / bottle.width, 520 / bottle.height);
    const w = bottle.width * s, h = bottle.height * s;
    ctx.drawImage(bottle, bx + (440 - w) / 2, 250 + (520 - h) / 2, w, h);
  } else if (bottle) zbDrawCover(ctx, bottle, bx, 250, 440, 520);
  ctx.restore();

  // Card boxes
  const box = (x, y, w, h) => {
    ctx.save();
    ctx.shadowColor = 'rgba(80, 55, 20, 0.16)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    zbRoundRect(ctx, x, y, w, h, 22);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  };
  const heading = (text, x, y) => {
    ctx.textAlign = start;
    ctx.fillStyle = '#7a7a7a';
    ctx.font = '800 28px Tajawal';
    ctx.fillText(text, x, y);
  };

  // Main notes as bars, each with its photo
  const ax = isAr ? 60 : W - 60 - 500;
  box(ax, 250, 500, 520);
  heading(isAr ? 'أبرز النوتات' : 'Main notes', isAr ? ax + 500 - 30 : ax + 30, 302);
  const bars = notes.prominent.slice(0, 5);
  const barH = Math.min(76, Math.floor(400 / Math.max(bars.length, 1)) - 16);
  const barsTop = 330 + Math.max(0, (420 - bars.length * (barH + 16)) / 2);
  bars.forEach((n, i) => {
    const y = barsTop + i * (barH + 16);
    const w = Math.round(440 * (1 - i * 0.12));
    const [fill, color] = ZB_BAR_COLORS[i % ZB_BAR_COLORS.length];
    const x = isAr ? ax + 500 - 30 - w : ax + 30;
    zbRoundRect(ctx, x, y, w, barH, 14);
    ctx.fillStyle = fill;
    ctx.fill();
    const r = barH / 2 - 7;
    const cx = isAr ? x + w - 7 - r : x + 7 + r;
    zbDrawNotePhoto(ctx, photos.get(photoSrc(n)), cx, y + barH / 2, r);
    ctx.fillStyle = color;
    ctx.font = `800 ${Math.min(30, barH * 0.46)}px Tajawal`;
    ctx.textAlign = start;
    ctx.textBaseline = 'middle';
    ctx.fillText(isAr ? n.ar : n.en, isAr ? cx - r - 16 : cx + r + 16, y + barH / 2 + 2);
    ctx.textBaseline = 'alphabetic';
  });

  // Fragrance pyramid: a round photo per note with its name underneath
  const rows = [
    [isAr ? 'الافتتاحية' : 'Top', notes.opening],
    [isAr ? 'القلب' : 'Heart', notes.heart],
    [isAr ? 'القاعدة' : 'Base', notes.base],
  ].filter(([, list]) => list.length);
  const py = 810;
  const rowH = 132;
  const boxH = 74 + rows.length * rowH;
  box(60, py, W - 120, boxH);
  heading(isAr ? 'الهرم العطري' : 'Fragrance pyramid', X(90), py + 50);
  rows.forEach(([label, list], i) => {
    const top = py + 70 + i * rowH;
    if (i > 0) {
      ctx.fillStyle = '#f0e6d6';
      ctx.fillRect(90, top - 4, W - 180, 2);
    }
    ctx.fillStyle = '#a6865d';
    ctx.font = '700 32px Amiri';
    ctx.textAlign = start;
    ctx.textBaseline = 'middle';
    ctx.fillText(label, X(90), top + 52);
    const items = list.slice(0, 6);
    const step = 128;
    items.forEach((n, j) => {
      const cx = X(90 + 170 + 52 + j * step);
      zbDrawNotePhoto(ctx, photos.get(photoSrc(n)), cx, top + 42, 42);
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      zbFitText(ctx, isAr ? n.ar : n.en, step - 8, '700 {s}px Tajawal', 22, 14);
      ctx.fillText(isAr ? n.ar : n.en, cx, top + 114);
    });
    ctx.textBaseline = 'alphabetic';
  });

  // Footer
  const fy = Math.max(py + boxH + 60, H - 52);
  ctx.textAlign = start;
  ctx.fillStyle = '#4a4a4a';
  ctx.font = '500 24px Tajawal';
  const s = isAr ? specs : (p.specsEn || specs);
  // The supplier often names the house as the perfumer; show real noses only.
  const perfumer = s.perfumer && !/دار|شركة|perfumes|house|عطور|parfums|elite|النخبة|نخبة|laverne|لافيرن|assaf|عساف|ghalati|غلاتي|rasasi|رصاصي|deraah|درع|rehab|رحاب|thnyan|ثنيان|bonheur/i.test(s.perfumer) ? s.perfumer : '';
  const footer = [s.type, perfumer && `${isAr ? 'العطّار' : 'Perfumer'}: ${perfumer}`].filter(Boolean).join(' · ');
  ctx.fillText(footer, X(70), Math.min(fy, H - 40));
  ctx.textAlign = end;
  ctx.fillStyle = '#a6865d';
  ctx.font = '600 24px Cinzel';
  ctx.direction = 'ltr';
  ctx.fillText('ZAHRAT BEESAN', X(W - 70), Math.min(fy, H - 40));

  return new Promise(resolve => canvas.toBlob(b => resolve(b ? URL.createObjectURL(b) : null), 'image/jpeg', 0.9));
}

// Adds the card after the gallery's last photo once it is drawn.
async function zbAttachPerfumeCard(p) {
  const lang = typeof currentLang !== 'undefined' && currentLang === 'en' ? 'en' : 'ar';
  const cacheKey = `${p.id}:${lang}`;
  let url = zbCardCache.get(cacheKey);
  if (url === undefined) {
    try { url = await zbRenderPerfumeCard(p, lang); } catch (e) { url = null; }
    zbCardCache.set(cacheKey, url);
  }
  if (!url || typeof activeModalPerfume === 'undefined' || !activeModalPerfume || activeModalPerfume.id !== p.id) return;
  const row = document.querySelector('#productModalContent .modal-thumbs-row');
  const items = window.__activeGalleryItems;
  if (!row || !Array.isArray(items) || items.some(i => i.src === url)) return;
  const label = lang === 'en' ? 'Perfume card' : 'بطاقة العطر';
  const idx = items.length;
  items.push({ src: url, label, isFlacon: true });
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'modal-thumb-btn';
  btn.title = label;
  btn.innerHTML = `<img src="${url}" alt="${label}">`;
  btn.addEventListener('click', () => switchModalImage(url, true, label, btn, idx));
  row.appendChild(btn);
}
