// ══════════════════════════════════════════════════════════
// ⚙️ What the dashboard decides for the site: hidden houses and products,
// prices, featured picks, offers, free delivery, coupons, the announcement
// bar and whether orders are open. The server puts it in the page as
// window.__SITE_CONFIG__; a static copy of the page fetches it instead.
// ══════════════════════════════════════════════════════════

const SITE_CONFIG_DEFAULTS = {
  ordersOpen: true, freeDeliveryJod: 100, couponsEnabled: false, showQuiz: true, showRecent: true,
  announcement: null, hiddenHouses: [], offers: {}, hidden: [], featured: [], prices: {},
  reviewsEnabled: true, ratings: {}, homeReviews: [],
};
let SITE_CONFIG = { ...SITE_CONFIG_DEFAULTS, ...(window.__SITE_CONFIG__ || {}) };

const siteConfigReady = window.__SITE_CONFIG__
  ? Promise.resolve(SITE_CONFIG)
  : fetch('/api/site-config').then(r => (r.ok ? r.json() : null)).then(cfg => {
    if (cfg) SITE_CONFIG = { ...SITE_CONFIG_DEFAULTS, ...cfg };
    return SITE_CONFIG;
  }).catch(() => SITE_CONFIG);

// Houses switched off in the dashboard leave the menu.
function applyHiddenHouses() {
  for (let i = FRAGRANCE_HOUSES.length - 1; i >= 0; i--) {
    if (SITE_CONFIG.hiddenHouses.includes(FRAGRANCE_HOUSES[i].id)) FRAGRANCE_HOUSES.splice(i, 1);
  }
}
applyHiddenHouses();

// Hidden products drop out, changed prices and featured picks apply.
// Safe to run twice: products already adjusted are marked.
async function applySiteOverrides(list) {
  await siteConfigReady;
  if (!Array.isArray(list)) return list;
  const hidden = new Set(SITE_CONFIG.hidden);
  const featured = new Set(SITE_CONFIG.featured);
  // Duplicates (tools/dedupe.js) stay in the data but never show.
  return list.filter(p => p && !p.duplicateOf && !hidden.has(String(p.id))).map(p => {
    const id = String(p.id);
    const price = SITE_CONFIG.prices[id];
    if ((!price || p.priceOverridden) && (!featured.has(id) || p.featured)) return p;
    const out = { ...p };
    if (price && !p.priceOverridden) {
      if (!out.origJod || out.origJod < out.finalJod) out.origJod = out.finalJod;
      out.finalJod = price;
      out.priceOverridden = true;
    }
    if (featured.has(id)) out.featured = true;
    return out;
  });
}

// The gold strip above the header scrolls through everything on offer: the
// dashboard's announcement, every supplier offer switched on in the
// dashboard (a tap opens that house), free delivery and authenticity.
const TICKER_HOUSES = {
  assaf: { id: 'assaf', ar: 'عساف', en: 'Assaf' },
  ghalati: { id: 'ghalati', ar: 'غلاتي', en: 'Ghalati' },
  thnyan: { id: 'thunayan', ar: 'ثنيان', en: 'Thnyan' },
  rasasi: { id: 'rasasi', ar: 'الرصاصي', en: 'Rasasi' },
};

function tickerItems(isAr) {
  const items = [];
  const a = SITE_CONFIG.announcement;
  const custom = a ? (isAr ? a.ar : (a.en || a.ar)) : '';
  if (custom) items.push({ text: custom, star: true });
  const rules = typeof OFFER_RULES !== 'undefined' ? OFFER_RULES : [];
  for (const rule of rules) {
    const house = TICKER_HOUSES[rule.house];
    if (!house || SITE_CONFIG.hiddenHouses.includes(house.id)) continue;
    if ((SITE_CONFIG.offers[rule.key] || {}).enabled === false) continue;
    items.push({ label: isAr ? house.ar : house.en, text: isAr ? rule.ar : rule.en, house: house.id, badge: isAr ? 'عرض' : 'Offer' });
  }
  const free = Number(SITE_CONFIG.freeDeliveryJod) || 0;
  if (free) items.push({ text: isAr ? `توصيل مجاني للطلبات فوق ${free} د.أ` : `Free delivery on orders over ${free} JOD` });
  items.push({ text: isAr ? 'عطور أصلية 100% بختم المصنع' : '100% authentic, factory sealed' });
  return items;
}

function tickerItemHtml(it) {
  const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const body = `${it.label ? `<strong>${esc(it.label)}:</strong> ` : ''}${esc(it.text)}${it.badge ? ` <span class="ticker-badge">${esc(it.badge)}</span>` : ''}`;
  const tag = it.house ? `button type="button" class="ticker-item ticker-link" data-house="${esc(it.house)}"` : 'span class="ticker-item"';
  return `<${tag}>${body}</${tag.split(' ')[0]}><span class="ticker-sep" aria-hidden="true">✦</span>`;
}

function renderAnnouncement() {
  const strip = document.getElementById('promoStrip');
  if (!strip) return;
  const isAr = currentLang === 'ar';
  const items = tickerItems(isAr);
  const run = items.map(tickerItemHtml).join('');
  // The run is written twice so the loop has no gap; the copy is hidden from screen readers.
  strip.innerHTML = `<div class="ticker" dir="${isAr ? 'rtl' : 'ltr'}"><div class="ticker-track">`
    + `<div class="ticker-run">${run}</div><div class="ticker-run" aria-hidden="true">${run}</div></div></div>`;
  strip.classList.add('promo-ticker');
  const track = strip.querySelector('.ticker-track');
  const width = strip.querySelector('.ticker-run').scrollWidth;
  track.style.animationDuration = `${Math.max(18, Math.round(width / 70))}s`; // about 70px a second
  strip.querySelectorAll('.ticker-run[aria-hidden] .ticker-link').forEach(b => { b.tabIndex = -1; });
}

document.addEventListener('click', e => {
  const link = e.target.closest && e.target.closest('.ticker-link');
  if (!link || typeof selectHouse !== 'function') return;
  selectHouse(link.dataset.house);
});

document.addEventListener('DOMContentLoaded', () => {
  siteConfigReady.then(() => { applyHiddenHouses(); renderAnnouncement(); });
  const original = window.setLanguage;
  if (typeof original === 'function') {
    window.setLanguage = function (...args) { const r = original.apply(this, args); renderAnnouncement(); return r; };
  }
});
