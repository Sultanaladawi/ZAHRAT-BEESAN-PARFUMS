/**
 * Al-Rehab "Pens" boxes (اقلام 8 مل - 48 حبة) — dedicated studio-grade pipeline.
 *
 * These are wide display cartons (often WHITE on a WHITE studio backdrop) so the
 * flood-fill used for bottles eats holes into them and leaves stray pens / reflections.
 * Here we use the AI matting model (@imgly) + refineCutout v2, then seat the carton
 * ON the marble podium (not hovering behind it) with a wide contact shadow.
 *
 * Usage:  node scripts/fix_alrehab_pens.js            -> all pens
 *         node scripts/fix_alrehab_pens.js 787844081  -> only the given salla ids
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');
const { refineCutout } = require('./lib/refine_cutout');

const ROOT = path.join(__dirname, '..');
const IMAGES = path.join(ROOT, 'public', 'images');
const DATA = path.join(ROOT, 'public', 'data', 'alrehab_perfumes.json');
const BG = path.join(IMAGES, 'alrehab_master_bg.jpg');
const RAW_CACHE = path.join(__dirname, 'raw_bottles', 'alrehab_pens');
if (!fs.existsSync(RAW_CACHE)) fs.mkdirSync(RAW_CACHE, { recursive: true });

// Carton geometry on the 1024x1024 template
const MAX_W = 590;          // podium top is ~685px wide
const MAX_H = 440;
const SEAT_Y = 806;         // front-bottom edge of the carton rests on the marble top
const CENTER_X = 512;

async function getOriginal(item) {
  const file = path.join(RAW_CACHE, `${item.sallaId}.jpg`);
  if (fs.existsSync(file) && fs.statSync(file).size > 2000) return fs.readFileSync(file);
  const url = item.originalImage || item.bottleUrl;
  let res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  return buf;
}

async function cutCarton(buf) {
  // flatten on white (avoids odd alpha from source) and cap the size for the matting model
  const flat = await sharp(buf)
    .flatten({ background: '#ffffff' })
    .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
  const blob = new Blob([flat], { type: 'image/png' });
  const out = Buffer.from(await (await removeBackground(blob)).arrayBuffer());

  // Keep the carton + the loose pen(s) that belong to it, drop dust/reflections
  const refined = await refineCutout(out, { erode: 0, feather: 0, hazeCut: 26, keepMultipleComponents: true });
  const solidAlpha = await solidifyCarton(refined);
  // Colours always come from the real photo, only the silhouette (alpha) is repaired
  const withRealColours = await applyOriginalColours(solidAlpha, flat);
  const final = await refineCutout(withRealColours, { erode: 1, feather: 0.8, hazeCut: 10, keepMultipleComponents: true });
  return sharp(final).trim().toBuffer();
}

async function applyOriginalColours(alphaPng, originalBuf) {
  const a = await sharp(alphaPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = await sharp(originalBuf).resize(a.info.width, a.info.height, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  const n = a.info.width * a.info.height;
  for (let i = 0; i < n; i++) {
    a.data[i * 4] = o[i * 3];
    a.data[i * 4 + 1] = o[i * 3 + 1];
    a.data[i * 4 + 2] = o[i * 3 + 2];
  }
  return sharp(a.data, { raw: { width: a.info.width, height: a.info.height, channels: 4 } }).png().toBuffer();
}

/**
 * White cartons on a white backdrop: the matting model "eats" parts of them
 * (holes inside white labels, a ragged bottom edge, nibbled corners).
 * We repair the SILHOUETTE only (alpha); colours stay those of the real photo:
 *   1) close short horizontal / vertical gaps,
 *   2) regularise the bottom edge (running-max + median) so the carton sits flat.
 */
async function solidifyCarton(pngBuf) {
  const { data, info } = await sharp(pngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] > 110 ? 1 : 0;

  // --- label connected components, find the main carton ---
  const comp = new Int32Array(w * h);
  const sizes = [0];
  const q = new Int32Array(w * h);
  let nComp = 0;
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || comp[s]) continue;
    nComp++;
    let head = 0, tail = 0, size = 0;
    q[tail++] = s; comp[s] = nComp;
    while (head < tail) {
      const p = q[head++]; size++;
      const x = p % w;
      if (x > 0 && mask[p - 1] && !comp[p - 1]) { comp[p - 1] = nComp; q[tail++] = p - 1; }
      if (x < w - 1 && mask[p + 1] && !comp[p + 1]) { comp[p + 1] = nComp; q[tail++] = p + 1; }
      if (p >= w && mask[p - w] && !comp[p - w]) { comp[p - w] = nComp; q[tail++] = p - w; }
      if (p < w * (h - 1) && mask[p + w] && !comp[p + w]) { comp[p + w] = nComp; q[tail++] = p + w; }
    }
    sizes[nComp] = size;
  }
  let main = 1;
  for (let c = 1; c <= nComp; c++) if (sizes[c] > sizes[main]) main = c;

  // --- bottom edge of the MAIN carton: low-percentile profile => flat, clean base ---
  const bottom = new Int32Array(w).fill(-1);
  for (let x = 0; x < w; x++) for (let y = h - 1; y >= 0; y--) if (comp[y * w + x] === main) { bottom[x] = y; break; }
  const R = 45;
  const target = new Int32Array(w).fill(-1);
  for (let x = 0; x < w; x++) {
    if (bottom[x] < 0) continue;
    const vals = [];
    for (let k = Math.max(0, x - R); k <= Math.min(w - 1, x + R); k++) if (bottom[k] >= 0) vals.push(bottom[k]);
    vals.sort((a, b) => a - b);
    target[x] = vals[Math.floor(vals.length * 0.15)];
  }
  // light smoothing of the target line
  const tSmooth = new Int32Array(w).fill(-1);
  for (let x = 0; x < w; x++) {
    if (target[x] < 0) continue;
    let sum = 0, n = 0;
    for (let k = Math.max(0, x - 6); k <= Math.min(w - 1, x + 6); k++) if (target[k] >= 0) { sum += target[k]; n++; }
    tSmooth[x] = Math.round(sum / n);
  }
  for (let x = 0; x < w; x++) {
    if (tSmooth[x] < 0) continue;
    for (let y = tSmooth[x] + 1; y <= bottom[x]; y++) if (comp[y * w + x] === main) mask[y * w + x] = 0;   // trim fade tail
    for (let y = bottom[x] + 1; y <= tSmooth[x]; y++) mask[y * w + x] = 1;                                   // fill nibbled base
  }

  const closeGaps = (isRow, maxGap) => {
    const outer = isRow ? h : w, inner = isRow ? w : h;
    for (let o = 0; o < outer; o++) {
      let last = -1;
      for (let i = 0; i < inner; i++) {
        const idx = isRow ? o * w + i : i * w + o;
        if (mask[idx]) {
          if (last >= 0 && i - last > 1 && i - last <= maxGap) {
            for (let k = last + 1; k < i; k++) mask[isRow ? o * w + k : k * w + o] = 1;
          }
          last = i;
        }
      }
    }
  };
  closeGaps(true, 46);
  closeGaps(false, 130);

  for (let i = 0; i < w * h; i++) data[i * 4 + 3] = mask[i] ? 255 : 0;
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

function shadowSvg(cx, y, rx) {
  return Buffer.from(`
  <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="a" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgb(24,16,8)" stop-opacity="0.50"/>
        <stop offset="55%" stop-color="rgb(28,19,10)" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="rgb(28,19,10)" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="c" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgb(10,6,3)" stop-opacity="0.66"/>
        <stop offset="60%" stop-color="rgb(16,10,5)" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="rgb(16,10,5)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${cx}" cy="${y + 3}" rx="${rx}" ry="24" fill="url(#a)"/>
    <ellipse cx="${cx}" cy="${y}" rx="${Math.round(rx * 0.78)}" ry="9" fill="url(#c)"/>
  </svg>`);
}

async function compose(cut, outPath) {
  const resized = await sharp(cut)
    .resize({ width: MAX_W, height: MAX_H, fit: 'inside', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.8, m1: 0.6, m2: 1.3 })
    .toBuffer({ resolveWithObject: true });
  const w = resized.info.width, h = resized.info.height;

  // horizontal centre of the carton BASE (ignores a loose pen sticking out on one side)
  const raw = await sharp(resized.data).ensureAlpha().raw().toBuffer();
  let minX = w, maxX = 0;
  for (let y = Math.floor(h * 0.80); y < h; y++) {
    let rowMin = w, rowMax = -1;
    for (let x = 0; x < w; x++) if (raw[(y * w + x) * 4 + 3] > 120) { if (x < rowMin) rowMin = x; if (x > rowMax) rowMax = x; }
    if (rowMax >= 0) { minX = Math.min(minX, rowMin); maxX = Math.max(maxX, rowMax); }
  }
  const baseCx = maxX >= minX ? Math.round((minX + maxX) / 2) : Math.round(w / 2);
  const baseW = maxX >= minX ? maxX - minX + 1 : w;

  const left = Math.max(0, Math.min(1024 - w, Math.round(CENTER_X - baseCx)));
  const top = SEAT_Y - h;

  await sharp(BG)
    .composite([
      { input: shadowSvg(left + baseCx, SEAT_Y, Math.min(330, Math.round(baseW * 0.58))), left: 0, top: 0 },
      { input: resized.data, left, top }
    ])
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

(async () => {
  const only = new Set(process.argv.slice(2));
  const items = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(p => (p.subCategory === 'pens' || /اقلام/.test(p.title)) && (!only.size || only.has(String(p.sallaId))));
  console.log(`Fixing ${items.length} Al-Rehab pen cartons...`);
  let n = 0;
  for (const it of items) {
    try {
      const cut = await getOriginal(it).then(cutCarton);
      const out = process.env.PENS_OUT_DIR ? path.join(process.env.PENS_OUT_DIR, `alrehab_${it.sallaId}.jpg`) : path.join(IMAGES, `alrehab_${it.sallaId}.jpg`);
      await compose(cut, out);
      n++;
      console.log(`  [${n}/${items.length}] ${it.sallaId} ✓`);
    } catch (e) {
      console.warn(`  ✗ ${it.sallaId}: ${e.message}`);
    }
  }
  console.log('Done.');
})();
