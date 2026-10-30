'use strict';
// One place for the "profit + delivery" fee added on top of the supplier's
// price (finalJod = baseJod + feeJod). The browser copy of these rules lives in
// public/js/app.js (getClientDeliveryFeeJod); keep the two in step.
//
//   several bottles in one product ....... count × 4 + 10
//   small oils (tola, Al-Rehab dehn) ..... SMALL_OIL_FEE_JOD
//   mini perfumes (single, small) ........ MINI_FEE_JOD
//   everything else ...................... BASE_FEE_JOD

const BASE_FEE_JOD = 12;
const SMALL_OIL_FEE_JOD = 5;
const MINI_FEE_JOD = 5; // change this one number to re-price every mini perfume
const MINI_MAX_ML = 50; // a single perfume up to this size is a mini

const TOLA_RE = /تول(?:ة|ه|ات)(?=$|[\s\/)\-،,])/;
// Not minis even when small: oils, hair/body mists, diffusers.
const NOT_MINI_RE = /دهن|زيت|شعر|hair|body\s*mist|معطر|فواحة|ملطف|diffuser/i;
const MINI_WORD_RE = /ميني|mini/i;

function sizeMl(item) {
  const text = `${(item && item.specs && item.specs.size) || ''} ${(item && item.title) || ''}`;
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(?:مل|ml)(?![a-z\d])/i);
  return m ? Number(m[1].replace(',', '.')) : null;
}

function bottles(item) {
  const n = Number(item && item.bottleCount);
  return n >= 1 ? n : 1;
}

function isTolaItem(item) {
  const text = `${(item && item.title) || ''} ${(item && item.specs && item.specs.size) || ''}`;
  if (TOLA_RE.test(text)) return true;
  const rehab = (item && item.house) === 'al-rehab' || String((item && item.id) || '').startsWith('alrehab-');
  const ml = sizeMl(item);
  return rehab && (item.categoryType === 'oil' || /دهن|زيت عطري/.test(item.title || '')) && ml > 0 && ml <= 20;
}

// A mini perfume: one small bottle of perfume, not a set, oil or hair mist.
// Mini = 50 ml or less (owner's rule), titled ميني/mini, or in a house's own mini
// line (Al-Rehab subCategory "mini", Laverne categoryType "mini").
function isMini(item) {
  if (!item || bottles(item) > 1) return false;
  const cat = item.categoryType;
  if (cat !== 'perfume' && cat !== 'mini') return false;
  if (isTolaItem(item)) return false;
  const title = item.title || '';
  if (NOT_MINI_RE.test(title)) return false;
  if (cat === 'mini' || item.subCategory === 'mini') return true;
  if (MINI_WORD_RE.test(title)) return true;
  const ml = sizeMl(item);
  return ml !== null && ml >= 8 && ml <= MINI_MAX_ML;
}

function feeFor(item) {
  const count = bottles(item);
  if (count > 1) return count * 4 + 10;
  if (isTolaItem(item)) return SMALL_OIL_FEE_JOD;
  if (isMini(item)) return MINI_FEE_JOD;
  return BASE_FEE_JOD;
}

module.exports = { BASE_FEE_JOD, SMALL_OIL_FEE_JOD, MINI_FEE_JOD, MINI_MAX_ML, sizeMl, isTolaItem, isMini, feeFor };
