const sharp = require('sharp');

/**
 * يستقبل PNG بقناة ألفا (من imgly) ويرجع PNG نظيف الحواف.
 * bg = لون الخلفية الأصلية للصورة (أبيض غالباً) عشان نشيله من الحواف.
 */
async function refineCutout(pngBuf, { erode = 1, feather = 0.8, bg = [255, 255, 255], hazeCut = 14 } = {}) {
  const { data, info } = await sharp(pngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // 1) الألفا الأصلي
  let alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = data[i * 4 + 3];
  const origAlpha = Uint8Array.from(alpha);

  // 2) قتل الغباش الخفيف جداً
  for (let i = 0; i < alpha.length; i++) if (alpha[i] < hazeCut) alpha[i] = 0;

  // 3) تآكل (erode) بكسل أو اثنين لإزالة حلقة الخلفية
  for (let n = 0; n < erode; n++) {
    const next = Uint8Array.from(alpha);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        let m = alpha[p];
        m = Math.min(m, alpha[p - 1], alpha[p + 1], alpha[p - w], alpha[p + w]);
        next[p] = m;
      }
    }
    alpha = next;
  }

  // 4) إزالة لون الخلفية من البكسلات نصف الشفافة:  F = (C - (1-a)*B) / a
  for (let i = 0; i < w * h; i++) {
    const a0 = origAlpha[i] / 255;
    if (a0 > 0.08 && a0 < 0.98) {
      const a = Math.max(a0, 0.25); // نتجنب القسمة على قيم صغيرة جداً
      for (let c = 0; c < 3; c++) {
        const v = (data[i * 4 + c] - (1 - a0) * bg[c]) / a;
        data[i * 4 + c] = Math.max(0, Math.min(255, Math.round(v)));
      }
    }
  }

  // 5) تنعيم الحواف (feather) على قناة الألفا فقط (مع الحفاظ على قناة واحدة b-w)
  let alphaBuf = Buffer.from(alpha);
  let ch = 1;
  if (feather > 0) {
    const blurred = await sharp(alphaBuf, { raw: { width: w, height: h, channels: 1 } })
      .toColourspace('b-w')
      .blur(feather)
      .raw()
      .toBuffer({ resolveWithObject: true });
    alphaBuf = blurred.data;
    ch = blurred.info.channels;
  }

  for (let i = 0; i < w * h; i++) {
    const aVal = alphaBuf[i * ch];
    data[i * 4 + 3] = aVal < hazeCut ? 0 : aVal;
    // توحيد البكسلات الشفافة تماماً إلى [0,0,0,0] لضمان عمل sharp().trim() بدقة 100%
    if (data[i * 4 + 3] === 0) {
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
    }
  }

  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

module.exports = { refineCutout };
