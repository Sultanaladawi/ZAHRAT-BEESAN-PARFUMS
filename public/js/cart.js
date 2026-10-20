// ══════════════════════════════════════════════════════════
// 🛍️ Shopping bag: a side drawer with the chosen perfumes, quantities and
// total, saved in the browser. Checkout sends the whole order to WhatsApp.
// ══════════════════════════════════════════════════════════

const CART_KEY = 'zb_cart_v1';
const CART_WHATSAPP = '962796697413';

function cartLoad() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(items) ? items.filter(i => i && i.id && i.qty > 0) : [];
  } catch (e) {
    return [];
  }
}

function cartSave(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* private mode */ }
}

function cartFindProduct(idOrName) {
  const lists = [perfumesData, ...Object.values(catalogByHouse)];
  for (const list of lists) {
    const p = (list || []).find(x => x.id === idOrName || x.title === idOrName || x.titleEn === idOrName);
    if (p) return p;
  }
  return null;
}

// Price of one unit in the active currency, as a number plus its symbol.
function cartUnitPrice(p) {
  const isAr = currentLang === 'ar';
  const jod = Number(p.finalJod) || (Math.round((Number(p.sarPrice) || 95) / 5.29) + 12);
  if (activeCurrency.code === 'JOD') return { value: jod, symbol: isAr ? activeCurrency.symbol : activeCurrency.symbolEn };
  if (activeCurrency.code === 'SAR') return { value: Math.round(jod * activeCurrency.rate), symbol: isAr ? '﷼' : 'SAR' };
  return { value: Math.round(jod * activeCurrency.rate), symbol: isAr ? activeCurrency.symbol : activeCurrency.symbolEn };
}

function cartCount() {
  return cartLoad().reduce((n, i) => n + i.qty, 0);
}

function cartUpdateBadge(bump) {
  const badge = document.getElementById('cartCountBadge');
  if (!badge) return;
  const n = cartCount();
  badge.textContent = n;
  badge.classList.toggle('is-empty', n === 0);
  if (bump) {
    badge.style.transform = 'scale(1.3)';
    setTimeout(() => { badge.style.transform = 'scale(1)'; }, 250);
  }
}

function addToCart(idOrName) {
  const p = cartFindProduct(idOrName);
  if (!p) return;
  if (p.isAvailable === false || p.status === 'out') {
    showNotification(currentLang === 'ar' ? 'هذا العطر غير متوفر حالياً' : 'This perfume is currently out of stock', '🔔');
    return;
  }
  const items = cartLoad();
  const line = items.find(i => i.id === p.id);
  if (line) line.qty += 1;
  else items.push({ id: p.id, qty: 1 });
  cartSave(items);
  cartUpdateBadge(true);
  cartRender();
  const name = currentLang === 'ar' ? p.title : (p.titleEn || p.title);
  showNotification(currentLang === 'ar' ? `تمت إضافة "${name}" إلى السلة` : `"${name}" added to your bag`, '🛍️');
}

function cartSetQty(id, qty) {
  let items = cartLoad();
  const line = items.find(i => i.id === id);
  if (!line) return;
  line.qty = Math.max(0, Math.min(20, qty));
  items = items.filter(i => i.qty > 0);
  cartSave(items);
  cartUpdateBadge(false);
  cartRender();
}

function cartLines() {
  return cartLoad().map(i => ({ ...i, p: cartFindProduct(i.id) })).filter(l => l.p);
}

// ── Supplier "buy N, get 1 free" offers ──
// Pricing rule (owner): for a full offer group the customer pays the
// supplier's price of the paid bottles (the dearest ones; the cheapest
// is the free one, as the supplier does), plus 4 JOD per bottle in the
// group, plus a fixed profit per group.
const OFFER_RULES = [
  // house, how the supplier writes it, bottles in a group, profit per group (JOD)
  { key: 'assaf-3+1', house: 'assaf', match: /3\s*\+\s*1/, size: 4, profit: 10, ar: 'اشترِ 3 والرابع مجاناً', en: 'Buy 3, get 1 free' },
  { key: 'assaf-2+1', house: 'assaf', match: /2\s*\+\s*1|1\s*\+\s*2/, size: 3, profit: 10, ar: 'اشترِ 2 والثالث مجاناً', en: 'Buy 2, get 1 free' },
  // Fixed-price groups: the supplier sells the whole group for groupSar.
  // Product lists are the suppliers' offer categories (Ghalati c1389534759
  // "اختر ٢ بـ 96 ريال", Thnyan c214031821 "اشتر اربع عطور بـ199 ريال").
  { key: 'ghalati-2', house: 'ghalati', sallaIds: ["1249911952", "1089182563", "1569128723", "113450693", "625338571", "25373017", "1942806396", "64193430", "214279369", "1757606131", "704485665", "1859126740", "1487856502", "133723763", "1781279602"], size: 2, groupSar: 96, profit: 10, ar: 'أي عطرين بسعر مميز', en: 'Any 2 for a special price' },
  // Rasasi runs a store-wide "buy 2, get 1 free" (promotion title "اشتري 2+1 مجانًا").
  { key: 'rasasi-2+1', house: 'rasasi', match: /2\s*\+\s*1/, size: 3, profit: 10, ar: 'اشترِ 2 والثالث مجاناً', en: 'Buy 2, get 1 free' },
  { key: 'thnyan-4', house: 'thnyan', sallaIds: ["144017218", "1373419763", "1978166384", "402320647", "1013392673", "1494531800", "1981620511", "604656001", "1303768509", "1072057445", "1812897358", "1253372737", "637775795", "732847010", "402914932"], size: 4, groupSar: 199, profit: 15, ar: 'أي 4 عطور بسعر مميز', en: 'Any 4 for a special price' },
];
const OFFER_FEE_PER_BOTTLE = 4;

function productHouseKey(p) {
  const id = String(p.id || '');
  if (p.house === 'assaf' || id.startsWith('assaf-')) return 'assaf';
  if (p.house === 'thunayan' || id.startsWith('thnyan-')) return 'thnyan';
  if (id.startsWith('alrehab-') || id.startsWith('rasasi-') || id.startsWith('laverne-') || id.startsWith('deraah-') || id.startsWith('lebonheur-') || id.startsWith('oudelite-')) return id.split('-')[0];
  return 'ghalati';
}

// The sync refreshes which products are in each fixed-price group
// (public/data/offers.json); the lists above are the fallback.
fetch('data/offers.json').then(r => (r.ok ? r.json() : null)).then(lists => {
  if (!lists) return;
  for (const rule of OFFER_RULES) {
    if (rule.sallaIds && Array.isArray(lists[rule.key]) && lists[rule.key].length) rule.sallaIds = lists[rule.key];
  }
}).catch(() => {});

function offerRuleFor(p) {
  if (p.isAvailable === false || p.status === 'out') return null;
  const key = productHouseKey(p);
  // Suppliers write offers with Arabic digits too ("٢+١").
  const txt = String(p.promotionTitle || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const sid = String(p.sallaId || '');
  return OFFER_RULES.find(r => r.house === key && offerSetting(r).enabled !== false
    && (r.sallaIds ? r.sallaIds.includes(sid) : r.match.test(txt))) || null;
}

// Switches and profit set in the dashboard.
function offerSetting(rule) {
  return (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.offers && SITE_CONFIG.offers[rule.key]) || {};
}
function offerProfit(rule) {
  const v = offerSetting(rule).profit;
  return v === undefined || v === null || !Number.isFinite(Number(v)) ? rule.profit : Number(v);
}

const supplierJod = p => Number(p.baseJod) || Math.round((Number(p.sarPrice) || 0) / 5.29);
const normalJod = p => Number(p.finalJod) || (supplierJod(p) + 12);

// Splits the bag into offer groups. Returns the JOD total, the normal JOD
// total and one summary row per applied group.
function cartPriceJod(lines) {
  let total = 0, normal = 0;
  const applied = [];
  const pools = new Map();
  for (const { p, qty } of lines) {
    normal += normalJod(p) * qty;
    const rule = offerRuleFor(p);
    if (!rule) { total += normalJod(p) * qty; continue; }
    if (!pools.has(rule)) pools.set(rule, []);
    for (let i = 0; i < qty; i++) pools.get(rule).push(p);
  }
  for (const [rule, units] of pools) {
    units.sort((a, b) => supplierJod(b) - supplierJod(a));
    const groups = Math.floor(units.length / rule.size);
    for (let g = 0; g < groups; g++) {
      const grp = units.slice(g * rule.size, (g + 1) * rule.size);
      // Buy X get 1: the paid bottles at their normal price, plus the free
      // bottle's delivery fee and the offer profit (3 × 31 at 2+1 = 62 + 12 + 10).
      // Fixed-price groups: the supplier's group price, a fee per bottle and the profit.
      const free = grp[grp.length - 1];
      const price = rule.groupSar
        ? Math.round(rule.groupSar / 5.29) + OFFER_FEE_PER_BOTTLE * rule.size + offerProfit(rule)
        : grp.slice(0, rule.size - 1).reduce((n, p) => n + normalJod(p), 0)
          + (Number(free.feeJod) || 12) + offerProfit(rule);
      total += price;
      applied.push({ rule, price, normal: grp.reduce((n, p) => n + normalJod(p), 0) });
    }
    for (const p of units.slice(groups * rule.size)) total += normalJod(p);
  }
  return { total, normal, applied };
}

function jodToActive(jod) {
  return activeCurrency.code === 'JOD' ? jod : Math.round(jod * activeCurrency.rate);
}

function activeSymbol() {
  const isAr = currentLang === 'ar';
  if (activeCurrency.code === 'SAR') return isAr ? '﷼' : 'SAR';
  return isAr ? activeCurrency.symbol : activeCurrency.symbolEn;
}

// Hint shown under an offer product in the bag when its group is not full yet.
function offerHint(lines, rule) {
  const count = lines.filter(l => offerRuleFor(l.p) === rule).reduce((n, l) => n + l.qty, 0);
  const left = (rule.size - (count % rule.size)) % rule.size;
  if (!left) return '';
  const isAr = currentLang === 'ar';
  return isAr ? `أضف ${left} ${left === 1 ? 'عطراً' : 'عطور'} من نفس العرض ليُطبَّق عرض "${rule.ar}"` : `Add ${left} more from this offer to apply "${rule.en}"`;
}

function cartRender() {
  const body = document.getElementById('cartDrawerBody');
  const foot = document.getElementById('cartDrawerFoot');
  if (!body || !foot) return;
  const isAr = currentLang === 'ar';
  const lines = cartLines();
  document.getElementById('cartDrawerTitle').textContent = isAr ? 'حقيبة التسوق' : 'Shopping bag';

  if (!lines.length) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛍️</div>
        <p>${isAr ? 'حقيبتك فارغة حالياً' : 'Your bag is empty'}</p>
        <button type="button" class="cart-continue" onclick="closeCart()">${isAr ? 'تصفّح العطور' : 'Browse perfumes'}</button>
      </div>`;
    foot.innerHTML = '';
    return;
  }

  const priced = cartPriceJod(lines);
  const symbol = activeSymbol();
  const extras = typeof cartExtras === 'function' ? cartExtras(priced.total) : { html: '', discountJod: 0 };
  const total = jodToActive(priced.total - extras.discountJod);
  const saved = jodToActive(priced.normal - priced.total);
  body.innerHTML = lines.map(({ p, qty }) => {
    const unit = cartUnitPrice(p);
    const name = isAr ? p.title : (p.titleEn || p.title);
    const house = typeof getHouseLabel === 'function' ? getHouseLabel(p) : '';
    const rule = offerRuleFor(p);
    const hint = rule ? offerHint(lines, rule) : '';
    return `
      <div class="cart-line">
        <img class="cart-line-img" src="${getCardThumb(p.image)}" alt="" onerror="this.onerror=null;this.src='${p.image}'">
        <div class="cart-line-info">
          <div class="cart-line-name" onclick="closeCart(); openProductModal('${p.id}')">${name}</div>
          ${house ? `<div class="cart-line-house">${house}</div>` : ''}
          ${rule ? `<div class="cart-line-offer">🎁 ${isAr ? rule.ar : rule.en}</div>` : ''}
          <div class="cart-line-price">${unit.value * qty} ${unit.symbol}</div>
          ${hint ? `<div class="cart-line-hint">${hint}</div>` : ''}
          <div class="cart-qty">
            <button type="button" onclick="cartSetQty('${p.id}', ${qty - 1})" aria-label="-">−</button>
            <span>${qty}</span>
            <button type="button" onclick="cartSetQty('${p.id}', ${qty + 1})" aria-label="+">+</button>
          </div>
        </div>
        <button type="button" class="cart-line-remove" onclick="cartSetQty('${p.id}', 0)" aria-label="${isAr ? 'إزالة' : 'Remove'}">✕</button>
      </div>`;
  }).join('');

  foot.innerHTML = `
    ${priced.applied.length ? `<div class="cart-saving"><span>🎁 ${isAr ? 'وفّرت بالعروض' : 'Offer savings'}</span><strong>− ${saved} ${symbol}</strong></div>` : ''}
    ${extras.html}
    <div class="cart-total"><span>${isAr ? 'المجموع' : 'Total'}</span><strong>${total} ${symbol}</strong></div>
    <p class="cart-note">${isAr ? 'التوصيل يُحسب حسب المدينة ويُؤكَّد معك على واتساب.' : 'Delivery depends on your city and is confirmed with you on WhatsApp.'}</p>
    ${typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.ordersOpen === false
      ? `<div class="cart-closed">${isAr ? 'استقبال الطلبات متوقف مؤقتاً، رح نرجع قريباً 🌙' : 'We are not taking orders right now, back soon 🌙'}</div>`
      : `<button type="button" class="cart-checkout" onclick="cartCheckout()">
      <span>💬</span> ${isAr ? 'أكمل الطلب عبر واتساب' : 'Complete order on WhatsApp'}
    </button>`}`;
}

// Short order number the customer and the dashboard both see.
function cartOrderRef() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(5);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(bytes) : bytes.forEach((_, i) => { bytes[i] = Math.random() * 256; });
  return 'ZB-' + [...bytes].map(b => abc[b % abc.length]).join('');
}

// Step 1 of checkout: the customer's name, phone and address, remembered
// on this device for the next order.
function cartCheckout() {
  const isAr = currentLang === 'ar';
  if (!cartLines().length) return;
  if (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.ordersOpen === false) return;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('zb_contact') || '{}'); } catch (e) { /* none yet */ }
  const esc = v => String(v || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const foot = document.getElementById('cartDrawerFoot');
  foot.innerHTML = `
    <form class="checkout-form" id="checkoutForm" onsubmit="event.preventDefault(); cartSendOrder()">
      <h4>${isAr ? 'معلومات التوصيل' : 'Delivery details'}</h4>
      <div class="checkout-row">
        <input name="name" required maxlength="60" placeholder="${isAr ? 'الاسم' : 'Name'}" value="${esc(saved.name)}" autocomplete="name">
        <input name="phone" required maxlength="30" inputmode="tel" dir="ltr" placeholder="${isAr ? 'رقم الهاتف' : 'Phone'}" value="${esc(saved.phone)}" autocomplete="tel">
      </div>
      <div class="checkout-delivery">
        <label><input type="radio" name="delivery" value="delivery"${saved.delivery !== 'pickup' ? ' checked' : ''}> ${isAr ? 'توصيل' : 'Delivery'}</label>
        <label><input type="radio" name="delivery" value="pickup"${saved.delivery === 'pickup' ? ' checked' : ''}> ${isAr ? 'استلام من المتجر' : 'Pick up'}</label>
      </div>
      <input name="city" maxlength="40" placeholder="${isAr ? 'المدينة' : 'City'}" value="${esc(saved.city)}" autocomplete="address-level2">
      <input name="address" maxlength="200" placeholder="${isAr ? 'العنوان بالتفصيل (المنطقة، الشارع، أقرب معلم)' : 'Address (area, street, landmark)'}" value="${esc(saved.address)}" autocomplete="street-address">
      <textarea name="notes" rows="2" maxlength="300" placeholder="${isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}"></textarea>
      <button type="submit" class="cart-checkout"><span>💬</span> ${isAr ? 'إرسال الطلب عبر واتساب' : 'Send order on WhatsApp'}</button>
      <button type="button" class="checkout-back" onclick="cartRender()">${isAr ? '→ رجوع للحقيبة' : '← Back to bag'}</button>
    </form>`;
  foot.querySelector('input[name="name"]').focus();
}

function cartSendOrder() {
  const isAr = currentLang === 'ar';
  const lines = cartLines();
  const form = document.getElementById('checkoutForm');
  if (!lines.length || !form) return;
  const f = new FormData(form);
  const contact = {
    name: String(f.get('name') || '').trim(), phone: String(f.get('phone') || '').trim(),
    city: String(f.get('city') || '').trim(), address: String(f.get('address') || '').trim(),
    notes: String(f.get('notes') || '').trim(), delivery: f.get('delivery') === 'pickup' ? 'pickup' : 'delivery',
  };
  if (contact.delivery === 'delivery' && !contact.city) {
    showNotification(isAr ? 'اكتب المدينة حتى نوصلك الطلب' : 'Please add your city for delivery', '📍');
    return;
  }
  try { localStorage.setItem('zb_contact', JSON.stringify({ ...contact, notes: '' })); } catch (e) { /* private mode */ }
  const ref = cartOrderRef();
  const priced = cartPriceJod(lines);
  const symbol = activeSymbol();
  const rows = lines.map(({ p, qty }, n) => {
    const rule = offerRuleFor(p);
    return `${n + 1}. ${p.title} × ${qty}${rule ? ` (${rule.ar})` : ''}`;
  });
  const offers = priced.applied.map(a => `🎁 ${a.rule.ar}: ${jodToActive(a.price)} ${symbol}`);
  const extras = typeof cartExtras === 'function' ? cartExtras(priced.total) : { discountJod: 0 };
  const coupon = extras.coupon || null;
  if (coupon) offers.push(`🎟️ ${isAr ? 'كود الخصم' : 'Coupon'} ${coupon.code}: − ${jodToActive(extras.discountJod)} ${symbol}`);
  if (extras.freeDelivery) offers.push(isAr ? '🚚 توصيل مجاني' : '🚚 Free delivery');
  const subtotalJod = priced.total;
  priced.total -= extras.discountJod;
  const text = (isAr
    ? [`مرحباً، أود طلب العطور التالية من زهرة بيسان (رقم الطلب ${ref}):`, '', ...rows, ...(offers.length ? ['', ...offers] : []), '', `المجموع: ${jodToActive(priced.total)} ${symbol}`, '',
      `الاسم: ${contact.name}`, `الهاتف: ${contact.phone}`, contact.delivery === 'pickup' ? 'الاستلام: من المتجر' : `التوصيل: ${contact.city}${contact.address ? ` – ${contact.address}` : ''}`, ...(contact.notes ? [`ملاحظات: ${contact.notes}`] : [])]
    : [`Hello, I would like to order these perfumes from Zahrat Beesan (order ${ref}):`, '', ...rows, ...(offers.length ? ['', ...offers] : []), '', `Total: ${jodToActive(priced.total)} ${symbol}`, '',
      `Name: ${contact.name}`, `Phone: ${contact.phone}`, contact.delivery === 'pickup' ? 'Pick up from the store' : `Delivery: ${contact.city}${contact.address ? ` – ${contact.address}` : ''}`, ...(contact.notes ? [`Notes: ${contact.notes}`] : [])]
  ).join('\n');
  window.open(`https://wa.me/${CART_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  // Logged for the dashboard; the order itself is confirmed on WhatsApp.
  fetch('/api/orders', {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref,
      lines: lines.map(({ p, qty }) => ({ id: p.id, title: p.title, qty, unitJod: normalJod(p) })),
      subtotalJod, discountJod: extras.discountJod || 0, totalJod: priced.total,
      coupon: coupon ? coupon.code : null, freeDelivery: !!extras.freeDelivery, currency: activeCurrency.code, contact,
    }),
  }).catch(() => {});
  cartRender();
}

function openCart() {
  cartRender();
  document.getElementById('cartDrawer')?.classList.add('is-open');
  document.getElementById('cartOverlay')?.classList.add('is-open');
  document.body.classList.add('cart-open');
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('is-open');
  document.getElementById('cartOverlay')?.classList.remove('is-open');
  document.body.classList.remove('cart-open');
}

(function wireCart() {
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); if (typeof closePolicyModal === 'function') closePolicyModal(); } });
  document.addEventListener('DOMContentLoaded', () => {
    cartUpdateBadge(false);
    // Re-price the drawer when the language or currency changes.
    for (const name of ['setLanguage', 'setCurrency']) {
      const original = window[name];
      if (typeof original === 'function') {
        window[name] = function (...args) {
          const result = original.apply(this, args);
          cartRender();
          return result;
        };
      }
    }
  });
})();

// ── Footer policy pages (guarantee, order tracking) ──
const POLICIES = {
  // Same terms as the Zahrat Beesan abaya store, adapted to perfumes.
  returns: {
    icon: '🔄',
    ar: { title: 'سياسة الاستبدال والاسترجاع', body: [
      ['1. المعاينة والاستبدال عند التسليم (داخل الأردن فقط)', 'الاستبدال والإرجاع متاح داخل المملكة الأردنية الهاشمية فقط، ويتم فوراً أثناء تواجد كابتن التوصيل عند باب المنزل؛ حيث يبقى الكابتن حتى تعاين العطر وتتأكد من سلامة العبوة والختم وأنه مطابق لطلبك.'],
      ['2. رسوم التوصيل عند الاستبدال أو الإرجاع', 'رسوم التوصيل غير قابلة للاسترداد وتكون على حساب العميل في حال الاستبدال أو الإرجاع داخل الأردن، حيث تُدفع للكابتن مقابل خدمة النقل.'],
      ['3. الطلبات والشحنات الخارجية (خارج الأردن)', 'جميع الشحنات إلى خارج المملكة الأردنية الهاشمية نهائية، ولا يوجد لها استبدال أو إرجاع نظراً لإجراءات الجمارك والشحن الدولي.'],
      ['4. انتهاء مهلة الاستبدال والإرجاع', 'بمجرد انتهاء المعاينة ومغادرة كابتن التوصيل وتأكيد الاستلام، يُعتبر الطلب مكتملاً ونهائياً ولا يُتاح الاستبدال أو الإرجاع بعد مغادرة الكابتن.'],
    ] },
    en: { title: 'Exchange & returns', body: [
      ['1. Check and exchange on delivery (Jordan only)', 'Exchanges and returns are available inside Jordan only, on the spot while the courier is at your door: the courier waits while you check the perfume, its seal and packaging, and that it matches your order.'],
      ['2. Delivery fees on exchange or return', 'Delivery fees are not refundable and are paid by the customer for an exchange or return inside Jordan, as they cover the courier\'s delivery service.'],
      ['3. Orders shipped outside Jordan', 'All shipments outside Jordan are final and cannot be exchanged or returned, due to customs and international shipping procedures.'],
      ['4. End of the exchange window', 'Once you have checked the order, confirmed delivery and the courier has left, the order is complete and final; exchanges and returns are no longer possible.'],
    ] },
  },
  guarantee: {
    icon: '👑',
    ar: { title: 'ضمان الأصالة 100%', body: [
      ['عطور أصلية ومختومة', 'كل عطورنا أصلية 100% ومستوردة من الدور الرسمية مباشرة، وتصلك مختومة بختم المصنع.'],
      ['من المصدر الرسمي', 'نتعامل فقط مع الدور المعتمدة (غلاتي، عساف، درعة، الرصاصي، الرحاب، ثنيان، لافيرن، لو بانهور، نخبة العود).'],
      ['أي استفسار', 'تواصل معنا على واتساب في أي وقت للتأكد من أي منتج قبل الطلب.'],
    ] },
    en: { title: '100% authenticity guarantee', body: [
      ['Genuine & sealed', 'All our perfumes are 100% genuine, imported directly from the official houses and delivered factory-sealed.'],
      ['Official sources only', 'We only work with authorized houses (Ghalati, Assaf, Deraah, Rasasi, Al-Rehab, Thnyan, Laverne, Le Bonheur, Oud Elite).'],
      ['Questions', 'Message us on WhatsApp any time to check a product before you order.'],
    ] },
  },
  tracking: {
    icon: '📦',
    ar: { title: 'تتبع الطلب', body: [
      ['داخل الأردن', 'نتواصل معك على واتساب لتأكيد الطلب وموعد التوصيل.'],
      ['الشحن الدولي', 'نرسل لك رقم البوليصة على واتساب فور الشحن لتتبع شحنتك.'],
    ] },
    en: { title: 'Order tracking', body: [
      ['Within Jordan', 'We confirm your order and delivery time with you on WhatsApp.'],
      ['International', 'We send your tracking number on WhatsApp as soon as the order ships.'],
    ] },
  },
};

function openPolicyModal(key) {
  const pol = POLICIES[key];
  if (!pol) return;
  const c = currentLang === 'ar' ? pol.ar : pol.en;
  document.getElementById('policyModalIcon').textContent = pol.icon;
  document.getElementById('policyModalTitle').textContent = c.title;
  document.getElementById('policyModalBody').innerHTML = c.body.map(([h, t]) =>
    `<div class="shipping-feature-box"><h4>${h}</h4><p>${t}</p></div>`).join('') +
    `<a class="cart-checkout" style="text-decoration:none;margin-top:14px" href="https://wa.me/${CART_WHATSAPP}" target="_blank" rel="noopener">💬 ${currentLang === 'ar' ? 'تواصل معنا عبر واتساب' : 'Message us on WhatsApp'}</a>`;
  document.getElementById('policyModal').style.display = 'flex';
}

function closePolicyModal() {
  const m = document.getElementById('policyModal'); if (m) m.style.display = 'none';
}
