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
  return list.filter(p => p && !hidden.has(String(p.id))).map(p => {
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

// The gold strip above the header: the dashboard's announcement when set,
// otherwise free delivery and authenticity.
function renderAnnouncement() {
  const el = document.getElementById('promoStripText');
  if (!el) return;
  const isAr = currentLang === 'ar';
  const a = SITE_CONFIG.announcement;
  const custom = a ? (isAr ? a.ar : (a.en || a.ar)) : '';
  const free = Number(SITE_CONFIG.freeDeliveryJod) || 0;
  el.textContent = custom || (isAr
    ? `${free ? `توصيل مجاني للطلبات فوق ${free} د.أ · ` : ''}عطور أصلية 100% بختم المصنع`
    : `${free ? `Free delivery on orders over ${free} JOD · ` : ''}100% authentic, factory sealed`);
}

document.addEventListener('DOMContentLoaded', () => {
  siteConfigReady.then(() => { applyHiddenHouses(); renderAnnouncement(); });
  const original = window.setLanguage;
  if (typeof original === 'function') {
    window.setLanguage = function (...args) { const r = original.apply(this, args); renderAnnouncement(); return r; };
  }
});
