// ══════════════════════════════════════════════════════════
// ✨ Store features: smart search with suggestions, sorting and
// "hide sold out", favourites drawer, recently viewed, "you may also like",
// free delivery progress and coupons in the bag.
// ══════════════════════════════════════════════════════════

const FREE_DELIVERY_JOD = 100;
// Analytics IDs: set them to start tracking (e.g. 'G-XXXXXXX', '1234567890').
const ANALYTICS = { googleId: '', metaPixelId: '' };
// Coupon codes: CODE -> percent off the bag total (after offers).
// Keep this list short-lived; anyone can read it in the page source.
const COUPONS = {};

// ── Smart search ──
// Arabic spelling variants (أ/إ/آ, ة/ه, ى/ي, ق/ج/غ for the Gulf "g") and
// tashkeel are folded, so "اروقيت", "أروجيت" and "Arrogate" all match.
function searchNorm(s) {
  return String(s || '').toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[قجغ]/g, 'ق')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function searchHaystack(p) {
  if (!p.__search) {
    p.__search = searchNorm([p.title, p.titleEn, p.brand, p.opening, p.heart, p.base, p.prominent,
      p.specs?.category, p.specs?.type, typeof getHouseLabel === 'function' ? getHouseLabel(p) : ''].join(' '));
  }
  return p.__search;
}

function searchMatches(p, q) {
  const hay = searchHaystack(p);
  return searchNorm(q).split(' ').filter(Boolean).every(word => hay.includes(word));
}

function allLoadedProducts() {
  const seen = new Set();
  const out = [];
  for (const [key, list] of Object.entries(catalogByHouse)) {
    if (key === 'all') continue;
    for (const p of list || []) if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
  }
  for (const p of perfumesData) if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
  return out;
}

function renderSearchSuggestions(q) {
  const box = document.getElementById('searchSuggest');
  if (!box) return;
  if (!q || q.trim().length < 2) { box.innerHTML = ''; box.classList.remove('is-open'); return; }
  const isAr = currentLang === 'ar';
  const hits = allLoadedProducts().filter(p => searchMatches(p, q))
    .sort((a, b) => (a.isAvailable === false) - (b.isAvailable === false)).slice(0, 6);
  box.innerHTML = hits.length
    ? hits.map(p => `
        <button type="button" class="suggest-item" onmousedown="event.preventDefault(); openProductModal('${p.id}'); hideSearchSuggestions()">
          <img src="${getCardThumb(p.image)}" alt="" loading="lazy">
          <span class="suggest-name">${isAr ? p.title : (p.titleEn || p.title)}</span>
          <span class="suggest-price">${getProductPrices(p).saleStr}</span>
        </button>`).join('')
    : `<div class="suggest-empty">${isAr ? 'لا توجد نتائج' : 'No results'}</div>`;
  box.classList.add('is-open');
}

function hideSearchSuggestions() {
  document.getElementById('searchSuggest')?.classList.remove('is-open');
}

// ── Sorting and "hide sold out" ──
let catalogSort = 'featured';
let catalogHideOut = false;
try {
  catalogSort = localStorage.getItem('zb_sort') || 'featured';
  catalogHideOut = localStorage.getItem('zb_hide_out') === '1';
} catch (e) { /* private mode */ }

function applyCatalogPreferences(list) {
  if (catalogHideOut) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].isAvailable === false || list[i].status === 'out') list.splice(i, 1);
    }
  }
  const price = p => Number(p.finalJod) || 0;
  const out = p => (p.isAvailable === false || p.status === 'out') ? 1 : 0;
  if (catalogSort === 'price-asc') list.sort((a, b) => out(a) - out(b) || price(a) - price(b));
  if (catalogSort === 'price-desc') list.sort((a, b) => out(a) - out(b) || price(b) - price(a));
  if (catalogSort === 'discount') {
    const pct = p => (Number(p.origJod) > price(p) ? 1 - price(p) / Number(p.origJod) : 0);
    list.sort((a, b) => out(a) - out(b) || pct(b) - pct(a));
  }
}

function setCatalogSort(value) {
  catalogSort = value;
  try { localStorage.setItem('zb_sort', value); } catch (e) {}
  renderCatalog(currentFilter, currentSearch);
}

function toggleHideOut(on) {
  catalogHideOut = on;
  try { localStorage.setItem('zb_hide_out', on ? '1' : '0'); } catch (e) {}
  renderCatalog(currentFilter, currentSearch);
}

function renderCatalogToolbar() {
  const bar = document.getElementById('catalogToolbar');
  if (!bar) return;
  const isAr = currentLang === 'ar';
  const opts = [
    ['featured', isAr ? 'المقترح' : 'Featured'],
    ['price-asc', isAr ? 'السعر: من الأقل' : 'Price: low to high'],
    ['price-desc', isAr ? 'السعر: من الأعلى' : 'Price: high to low'],
    ['discount', isAr ? 'أكبر خصم' : 'Biggest discount'],
  ];
  bar.innerHTML = `
    <label class="toolbar-sort">
      <span>${isAr ? 'الترتيب' : 'Sort'}</span>
      <select onchange="setCatalogSort(this.value)">
        ${opts.map(([v, l]) => `<option value="${v}" ${v === catalogSort ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </label>
    <label class="toolbar-toggle">
      <input type="checkbox" ${catalogHideOut ? 'checked' : ''} onchange="toggleHideOut(this.checked)">
      <span>${isAr ? 'المتوفر فقط' : 'In stock only'}</span>
    </label>`;
}

// ── Recently viewed ──
const RECENT_KEY = 'zb_recent';

function recentIds() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
}

function rememberViewed(id) {
  const ids = [id, ...recentIds().filter(x => x !== id)].slice(0, 12);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids)); } catch (e) {}
}

function recentProducts() {
  return recentIds().map(id => cartFindProduct(id)).filter(Boolean);
}

// ── You may also like ──
function similarProducts(p, n = 8) {
  const house = productHouseKey(p);
  const gender = s => /نسائ|women|femme/i.test(s) ? 'w' : /رجال|men|homme/i.test(s) ? 'm' : 'u';
  const g = gender(`${p.specs?.category || ''} ${p.title} ${p.titleEn || ''}`);
  return allLoadedProducts()
    .filter(x => x.id !== p.id && x.isAvailable !== false && x.status !== 'out' && x.categoryType === p.categoryType)
    .map(x => ({ x, score: (productHouseKey(x) === house ? 2 : 0)
      + (gender(`${x.specs?.category || ''} ${x.title} ${x.titleEn || ''}`) === g ? 2 : 0)
      + (Math.abs((Number(x.finalJod) || 0) - (Number(p.finalJod) || 0)) <= 8 ? 1 : 0) }))
    .sort((a, b) => b.score - a.score).slice(0, n).map(o => o.x);
}

function renderAlsoLike(p) {
  const container = document.getElementById('productModalContent');
  if (!container) return;
  const items = similarProducts(p);
  if (!items.length) return;
  const t = translations[currentLang] || translations.ar;
  const section = document.createElement('section');
  section.className = 'also-like';
  section.innerHTML = `
    <h2 class="home-heading">${currentLang === 'ar' ? 'قد يعجبك أيضاً' : 'You may also like'}</h2>
    <div class="home-rail">${items.map(x => renderProductCard(x, t)).join('')}</div>`;
  container.appendChild(section);
}

// ── Favourites drawer ──
function wishlistIds() {
  try { return JSON.parse(localStorage.getItem('zb_wishlist') || '[]'); } catch (e) { return []; }
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishCountBadge');
  if (!badge) return;
  const n = wishlistIds().length;
  badge.textContent = n;
  badge.classList.toggle('is-empty', n === 0);
}

function renderWishlist() {
  const body = document.getElementById('wishDrawerBody');
  if (!body) return;
  const isAr = currentLang === 'ar';
  document.getElementById('wishDrawerTitle').textContent = isAr ? 'المفضلة' : 'Favourites';
  const items = wishlistIds().map(id => cartFindProduct(id)).filter(Boolean);
  if (!items.length) {
    body.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🤍</div><p>${isAr ? 'لم تضف أي عطر للمفضلة بعد' : 'No favourites yet'}</p>
      <button type="button" class="cart-continue" onclick="closeWishlist()">${isAr ? 'تصفّح العطور' : 'Browse perfumes'}</button></div>`;
    return;
  }
  body.innerHTML = items.map(p => {
    const out = p.isAvailable === false || p.status === 'out';
    return `
      <div class="cart-line">
        <img class="cart-line-img" src="${getCardThumb(p.image)}" alt="">
        <div class="cart-line-info">
          <div class="cart-line-name" onclick="closeWishlist(); openProductModal('${p.id}')">${isAr ? p.title : (p.titleEn || p.title)}</div>
          <div class="cart-line-price">${getProductPrices(p).saleStr}</div>
          ${out ? `<div class="cart-line-hint">${isAr ? 'نفذت الكمية' : 'Sold out'}</div>`
            : `<button type="button" class="wish-add" onclick="addToCart('${p.id}')">${isAr ? 'أضف إلى السلة' : 'Add to bag'}</button>`}
        </div>
        <button type="button" class="cart-line-remove" onclick="toggleWishlist('${p.id}'); renderWishlist()" aria-label="${isAr ? 'إزالة' : 'Remove'}">✕</button>
      </div>`;
  }).join('');
}

function openWishlist() {
  renderWishlist();
  document.getElementById('wishDrawer')?.classList.add('is-open');
  document.getElementById('cartOverlay')?.classList.add('is-open');
  document.body.classList.add('cart-open');
}

function closeWishlist() {
  document.getElementById('wishDrawer')?.classList.remove('is-open');
  if (!document.getElementById('cartDrawer')?.classList.contains('is-open')) {
    document.getElementById('cartOverlay')?.classList.remove('is-open');
    document.body.classList.remove('cart-open');
  }
}

// ── Free delivery and coupons in the bag ──
function activeCoupon() {
  try {
    const code = localStorage.getItem('zb_coupon') || '';
    return COUPONS[code] ? { code, ...COUPONS[code] } : null;
  } catch (e) { return null; }
}

function applyCoupon() {
  const input = document.getElementById('couponInput');
  const code = (input?.value || '').trim().toUpperCase();
  const isAr = currentLang === 'ar';
  if (!COUPONS[code]) {
    showNotification(isAr ? 'كود الخصم غير صحيح' : 'Invalid coupon code', '⚠️');
    return;
  }
  try { localStorage.setItem('zb_coupon', code); } catch (e) {}
  showNotification(isAr ? `تم تطبيق الكود ${code}` : `Code ${code} applied`, '🎟️');
  cartRender();
}

function removeCoupon() {
  try { localStorage.removeItem('zb_coupon'); } catch (e) {}
  cartRender();
}

// Extra rows for the bag footer: coupon, free-delivery progress. Returns
// { html, discountJod } for a JOD subtotal.
function cartExtras(subtotalJod) {
  const isAr = currentLang === 'ar';
  const symbol = activeSymbol();
  const coupon = activeCoupon();
  const discountJod = coupon ? Math.round(subtotalJod * coupon.pct / 100) : 0;
  const afterJod = subtotalJod - discountJod;
  const left = FREE_DELIVERY_JOD - afterJod;
  const pct = Math.max(0, Math.min(100, Math.round(afterJod / FREE_DELIVERY_JOD * 100)));
  const delivery = left > 0
    ? `<div class="free-ship"><div class="free-ship-text">🚚 ${isAr ? `باقي ${jodToActive(left)} ${symbol} للتوصيل المجاني` : `${jodToActive(left)} ${symbol} away from free delivery`}</div><div class="free-ship-bar"><span style="width:${pct}%"></span></div></div>`
    : `<div class="free-ship is-done"><div class="free-ship-text">🎉 ${isAr ? 'مبروك! التوصيل مجاني لطلبك' : 'Your order ships free!'}</div></div>`;
  let couponHtml = '';
  if (Object.keys(COUPONS).length) {
    couponHtml = coupon
      ? `<div class="cart-saving"><span>🎟️ ${coupon.code} (${coupon.pct}٪) <button type="button" class="coupon-remove" onclick="removeCoupon()">✕</button></span><strong>− ${jodToActive(discountJod)} ${symbol}</strong></div>`
      : `<div class="coupon-row"><input id="couponInput" type="text" placeholder="${isAr ? 'كود الخصم' : 'Coupon code'}" autocomplete="off"><button type="button" onclick="applyCoupon()">${isAr ? 'تطبيق' : 'Apply'}</button></div>`;
  }
  return { html: delivery + couponHtml, discountJod, freeDelivery: left <= 0 };
}

// ── Shareable product links (/p/<id>) ──
function productUrl(id) {
  return `${location.origin}/p/${encodeURIComponent(id)}`;
}

function shareProduct(id) {
  const p = cartFindProduct(id);
  if (!p) return;
  const isAr = currentLang === 'ar';
  const url = productUrl(id);
  const title = isAr ? p.title : (p.titleEn || p.title);
  if (navigator.share) {
    navigator.share({ title, text: `${title} — ${getProductPrices(p).saleStr}`, url }).catch(() => {});
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} — ${getProductPrices(p).saleStr}\n${url}`)}`, '_blank', 'noopener');
  }
}

function addShareButton(p) {
  const grid = document.querySelector('#productModalContent .modal-actions-grid');
  if (!grid || grid.querySelector('.btn-share')) return;
  const isAr = currentLang === 'ar';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-share';
  btn.innerHTML = `<span>🔗</span><span>${isAr ? 'شارك العطر' : 'Share'}</span>`;
  btn.onclick = () => shareProduct(p.id);
  grid.insertAdjacentElement('afterend', btn);
}

function syncProductUrl(id) {
  const want = id ? `/p/${encodeURIComponent(id)}` : '/';
  if (location.pathname !== want) history.pushState({ p: id || null }, '', want);
}

// ── Analytics (loads only when IDs are set) ──
function loadAnalytics() {
  if (ANALYTICS.googleId) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.googleId}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', ANALYTICS.googleId);
  }
  if (ANALYTICS.metaPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', ANALYTICS.metaPixelId);
    fbq('track', 'PageView');
  }
}

function trackEvent(name, data) {
  if (window.gtag) gtag('event', name, data || {});
  const fbMap = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', search: 'Search' };
  if (window.fbq && fbMap[name]) fbq('track', fbMap[name], data || {});
}

// ── Wiring ──
(function wireFeatures() {
  const wrapAfter = (name, after) => {
    const original = window[name];
    if (typeof original !== 'function') return;
    window[name] = function (...args) {
      const result = original.apply(this, args);
      try { after(...args); } catch (e) { console.error(e); }
      return result;
    };
  };

  document.addEventListener('DOMContentLoaded', () => {
    wrapAfter('renderProductModalContent', p => { renderAlsoLike(p); addShareButton(p); });
    wrapAfter('openProductModal', id => { rememberViewed(id); if (!window.__fromPopstate) syncProductUrl(id); });
    wrapAfter('closeProductModal', () => { if (!window.__fromPopstate && location.pathname.startsWith('/p/')) syncProductUrl(null); });
    window.addEventListener('popstate', () => {
      window.__fromPopstate = true;
      const m = location.pathname.match(/^\/p\/(.+)$/);
      if (m) openProductModal(decodeURIComponent(m[1])); else if (activeModalPerfume) closeProductModal();
      window.__fromPopstate = false;
    });
    // A shared /p/<id> link opens that perfume once its house has loaded.
    const target = window.__OPEN_PRODUCT__ || (location.pathname.match(/^\/p\/(.+)$/) || [])[1];
    if (target) {
      const id = decodeURIComponent(target);
      let tries = 0;
      const timer = setInterval(() => {
        if (cartFindProduct(id) || ++tries > 60) {
          clearInterval(timer);
          if (cartFindProduct(id)) { window.__fromPopstate = true; openProductModal(id); window.__fromPopstate = false; }
        }
      }, 250);
    }
    wrapAfter('toggleWishlist', () => updateWishlistBadge());
    wrapAfter('renderCatalog', () => renderCatalogToolbar());
    wrapAfter('setLanguage', () => { renderCatalogToolbar(); renderWishlist(); });
    updateWishlistBadge();
    renderCatalogToolbar();
    loadAnalytics();
    wrapAfter('openProductModal', id => trackEvent('view_item', { item_id: id }));
    wrapAfter('addToCart', id => trackEvent('add_to_cart', { item_id: id }));
    wrapAfter('cartCheckout', () => trackEvent('begin_checkout'));

    const input = document.getElementById('mainSearchInput');
    if (input) {
      input.addEventListener('input', e => renderSearchSuggestions(e.target.value));
      input.addEventListener('focus', e => renderSearchSuggestions(e.target.value));
      input.addEventListener('blur', () => setTimeout(hideSearchSuggestions, 150));
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeWishlist(); hideSearchSuggestions(); } });
})();
