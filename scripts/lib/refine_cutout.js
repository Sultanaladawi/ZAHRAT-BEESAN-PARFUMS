const sharp = require('sharp');

/**
 * يستقبل PNG بقناة ألفا (من imgly) ويرجع PNG نظيف الحواف بالكامل:
 * 1) إزالة أي شوائب أو بقع منفصلة عن جسم الزجاجة الرئيسي (Connected-Component Despeckling).
 * 2) تحديد الخلفية الخارجية الحقيقية (Flood-Fill من الحواف) وقفل شفافية وألوان داخل الزجاجة والغطاء على 255 (لمنع شفافية الأغطية البيضاء أو الملصقات).
 * 3) تآكل خفيف (erode) لحلقة الحافة الخارجية فقط.
 * 4) تعويض ألوان الحافة من البكسلات الداخلية الصافية (Inward RGB Propagation) + إزالة بقايا الخلفية البيضاء من الحواف الداكنة بدون تغميق الأجزاء البيضاء.
 * 5) تنعيم الحواف (feather) للداخل فقط (Clamped Inward Feathering) لمنع تسرب الهالات الرمادية للخارج.
 */
async function refineCutout(
  pngBuf,
  {
    erode = 1,
    feather = 0.8,
    bg = [255, 255, 255],
    hazeCut = 18,
    keepMultipleComponents = false
  } = {}
) {
  const { data, info } = await sharp(pngBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const total = w * h;

  // 1) الألفا الأصلي وقتل الغباش الخفيف جداً
  let alpha = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const a = data[i * 4 + 3];
    alpha[i] = a < hazeCut ? 0 : a;
  }
  const origAlpha = Uint8Array.from(alpha);

  // 2) إزالة الشوائب والجزر المنفصلة الصغيرة (Connected Components)
  // لضمان عمل sharp().trim() بدقة وعدم انزياح الزجاجة أو ارتفاعها عن المنصة
  const compId = new Int32Array(total);
  const compSizes = [0];
  let currentId = 0;
  const queue = new Int32Array(total);

  for (let i = 0; i < total; i++) {
    if (alpha[i] > 0 && compId[i] === 0) {
      currentId++;
      let head = 0;
      let tail = 0;
      queue[tail++] = i;
      compId[i] = currentId;
      let size = 0;

      while (head < tail) {
        const p = queue[head++];
        size++;
        const x = p % w;
        const y = (p - x) / w;

        if (x > 0 && alpha[p - 1] > 0 && compId[p - 1] === 0) {
          compId[p - 1] = currentId;
          queue[tail++] = p - 1;
        }
        if (x < w - 1 && alpha[p + 1] > 0 && compId[p + 1] === 0) {
          compId[p + 1] = currentId;
          queue[tail++] = p + 1;
        }
        if (y > 0 && alpha[p - w] > 0 && compId[p - w] === 0) {
          compId[p - w] = currentId;
          queue[tail++] = p - w;
        }
        if (y < h - 1 && alpha[p + w] > 0 && compId[p + w] === 0) {
          compId[p + w] = currentId;
          queue[tail++] = p + w;
        }
      }
      compSizes[currentId] = size;
    }
  }

  let maxCompSize = 0;
  for (let c = 1; c <= currentId; c++) {
    if (compSizes[c] > maxCompSize) maxCompSize = compSizes[c];
  }

  if (maxCompSize > 0) {
    const minKeepRatio = keepMultipleComponents ? 0.008 : 0.12;
    const minKeepSize = Math.floor(maxCompSize * minKeepRatio);
    for (let i = 0; i < total; i++) {
      const cid = compId[i];
      if (cid > 0 && compSizes[cid] < minKeepSize) {
        alpha[i] = 0;
        origAlpha[i] = 0;
      }
    }
  }

  // 3) تحديد الخلفية الخارجية الحقيقية عبر Flood-Fill من أطراف الصورة الأربعة
  // هذا يضمن أن أي منطقة بيضاء داخل الزجاجة أو الغطاء (مثل الفستان الأبيض أو الملصق) تصبح صلبة 100% (alpha=255)
  const isExterior = new Uint8Array(total);
  let qHead = 0;
  let qTail = 0;
  const exteriorThreshold = Math.max(hazeCut, 36);

  const tryPushExterior = (idx) => {
    if (!isExterior[idx] && alpha[idx] < exteriorThreshold) {
      isExterior[idx] = 1;
      queue[qTail++] = idx;
    }
  };

  for (let x = 0; x < w; x++) {
    tryPushExterior(x);
    tryPushExterior((h - 1) * w + x);
  }
  for (let y = 1; y < h - 1; y++) {
    tryPushExterior(y * w);
    tryPushExterior(y * w + (w - 1));
  }

  while (qHead < qTail) {
    const p = queue[qHead++];
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) tryPushExterior(p - 1);
    if (x < w - 1) tryPushExterior(p + 1);
    if (y > 0) tryPushExterior(p - w);
    if (y < h - 1) tryPushExterior(p + w);
  }

  // كل بكسل خارجي نصفره، وكل بكسل داخلي محاط بالزجاجة بعيد عن الحافة الخارجية بأكثر من بكسلين نقفله على 255
  for (let i = 0; i < total; i++) {
    if (isExterior[i]) {
      alpha[i] = 0;
    } else if (alpha[i] > 0) {
      // نفحص إن كان قريباً من الخلفية الخارجية (ضمن مسافة 2 بكسل)
      const x = i % w;
      const y = (i - x) / w;
      let nearExterior = false;
      for (let dy = -2; dy <= 2 && !nearExterior; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) {
          nearExterior = true;
          break;
        }
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w || isExterior[ny * w + nx]) {
            nearExterior = true;
            break;
          }
        }
      }
      if (!nearExterior) {
        alpha[i] = 255;
      }
    }
  }

  // 4) تآكل (erode) للحافة الخارجية لإزالة حلقة الخلفية
  for (let n = 0; n < erode; n++) {
    const next = Uint8Array.from(alpha);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        if (alpha[p] === 0) continue;
        next[p] = Math.min(
          alpha[p],
          alpha[p - 1],
          alpha[p + 1],
          alpha[p - w],
          alpha[p + w]
        );
      }
    }
    alpha = next;
  }

  // 5) تنظيف ألوان الحافة (Inward RGB Propagation + Smart Defringing)
  // أولاً: للبكسلات على الحافة التي كانت شبه شفافة، ننسخ لون أقرب بكسل داخلي صلب (أعلى ألفا)
  // لمنع ظهور الهالات الرمادية/الزرقاء التي يتركها imgly في البكسلات منخفضة الشفافية
  const cleanRgb = Uint8Array.from(data);
  const propAlpha = Uint8Array.from(origAlpha);

  for (let pass = 0; pass < 3; pass++) {
    const nextRgb = Uint8Array.from(cleanRgb);
    const nextPropA = Uint8Array.from(propAlpha);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        if (propAlpha[p] >= 245) continue;
        let bestA = propAlpha[p];
        let bestQ = -1;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const q = (y + dy) * w + (x + dx);
            if (propAlpha[q] > bestA) {
              bestA = propAlpha[q];
              bestQ = q;
            }
          }
        }
        if (bestQ !== -1 && bestA >= 180) {
          nextRgb[p * 4] = cleanRgb[bestQ * 4];
          nextRgb[p * 4 + 1] = cleanRgb[bestQ * 4 + 1];
          nextRgb[p * 4 + 2] = cleanRgb[bestQ * 4 + 2];
          nextPropA[p] = bestA;
        }
      }
    }
    cleanRgb.set(nextRgb);
    propAlpha.set(nextPropA);
  }

  // تطبيق اللون المنظف وإزالة بقايا الأبيض فقط إذا كانت حافة الزجاجة داكنة/ملونة (وليست بيضاء أصلاً)
  for (let i = 0; i < total; i++) {
    if (alpha[i] === 0) continue;
    const rIn = cleanRgb[i * 4];
    const gIn = cleanRgb[i * 4 + 1];
    const bIn = cleanRgb[i * 4 + 2];
    const lum = 0.299 * rIn + 0.587 * gIn + 0.114 * bIn;

    const a0 = origAlpha[i] / 255;
    if (a0 > 0.08 && a0 < 0.96 && lum < 210) {
      // الحافة داكنة أو ملونة: نزيل مساهمة الخلفية البيضاء مع الاستناد للون الداخلي
      const a = Math.max(a0, 0.35);
      for (let c = 0; c < 3; c++) {
        const decontam = (data[i * 4 + c] - (1 - a0) * bg[c]) / a;
        const blended = 0.65 * cleanRgb[i * 4 + c] + 0.35 * Math.max(0, Math.min(255, decontam));
        data[i * 4 + c] = Math.max(0, Math.min(255, Math.round(blended)));
      }
    } else {
      // الحافة فاتحة/بيضاء أو داخلية: نستخدم اللون الداخلي الصافي مباشرة بدون تغميق
      data[i * 4] = rIn;
      data[i * 4 + 1] = gIn;
      data[i * 4 + 2] = bIn;
    }
  }

  // 6) تنعيم الحواف (Clamped Inward Feather) على قناة الألفا فقط
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

  for (let i = 0; i < total; i++) {
    // Math.min(alpha[i], ...) يمنع تسرب التنعيم خارج حدود الماسك المتآكل نهائياً
    const blurredVal = alphaBuf[i * ch];
    const finalA = alpha[i] === 255 && blurredVal > 240 ? 255 : Math.min(alpha[i], blurredVal);
    data[i * 4 + 3] = finalA < hazeCut ? 0 : finalA;

    if (data[i * 4 + 3] === 0) {
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
    }
  }

  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

module.exports = { refineCutout };
