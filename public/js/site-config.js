// ══════════════════════════════════════════════════════════
// ⚙️ What the dashboard decides for the site: hidden houses and products,
// prices, featured picks, offers, free delivery, coupons, the announcement
// bar and whether orders are open. The server puts it in the page as
// window.__SITE_CONFIG__; a static copy of the page fetches it instead.
// ══════════════════════════════════════════════════════════

const SITE_CONFIG_DEFAULTS = {
  ordersOpen: true, freeDeliveryJod: 100, couponsEnabled: false, showQuiz: true, showRecent: true,
  announcement: null, hiddenHouses: [], offers: {}, hidden: [], featured: [], prices: {},
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

function renderAnnouncement() {
  const a = SITE_CONFIG.announcement;
  let bar = document.getElementById('siteAnnouncement');
  const text = a ? (currentLang === 'ar' ? a.ar : (a.en || a.ar)) : '';
  if (!text) { if (bar) bar.remove(); return; }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'siteAnnouncement';
    bar.className = 'site-announcement';
    document.body.prepend(bar);
  }
  bar.textContent = text;
}

document.addEventListener('DOMContentLoaded', () => {
  siteConfigReady.then(() => { applyHiddenHouses(); renderAnnouncement(); });
  const original = window.setLanguage;
  if (typeof original === 'function') {
    window.setLanguage = function (...args) { const r = original.apply(this, args); renderAnnouncement(); return r; };
  }
});
