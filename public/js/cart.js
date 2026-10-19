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
  if (activeCurrency.code === 'SAR') return { value: Number(p.sarPrice) || Math.round(jod * activeCurrency.rate), symbol: isAr ? '﷼' : 'SAR' };
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

  let total = 0;
  let symbol = '';
  body.innerHTML = lines.map(({ p, qty }) => {
    const unit = cartUnitPrice(p);
    total += unit.value * qty;
    symbol = unit.symbol;
    const name = isAr ? p.title : (p.titleEn || p.title);
    const house = typeof getHouseLabel === 'function' ? getHouseLabel(p) : '';
    return `
      <div class="cart-line">
        <img class="cart-line-img" src="${getCardThumb(p.image)}" alt="" onerror="this.onerror=null;this.src='${p.image}'">
        <div class="cart-line-info">
          <div class="cart-line-name" onclick="closeCart(); openProductModal('${p.id}')">${name}</div>
          ${house ? `<div class="cart-line-house">${house}</div>` : ''}
          <div class="cart-line-price">${unit.value * qty} ${unit.symbol}</div>
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
    <div class="cart-total"><span>${isAr ? 'المجموع' : 'Total'}</span><strong>${total} ${symbol}</strong></div>
    <p class="cart-note">${isAr ? 'التوصيل يُحسب حسب المدينة ويُؤكَّد معك على واتساب.' : 'Delivery depends on your city and is confirmed with you on WhatsApp.'}</p>
    <button type="button" class="cart-checkout" onclick="cartCheckout()">
      <span>💬</span> ${isAr ? 'أكمل الطلب عبر واتساب' : 'Complete order on WhatsApp'}
    </button>`;
}

function cartCheckout() {
  const isAr = currentLang === 'ar';
  const lines = cartLines();
  if (!lines.length) return;
  let total = 0;
  let symbol = '';
  const rows = lines.map(({ p, qty }, n) => {
    const unit = cartUnitPrice(p);
    total += unit.value * qty;
    symbol = unit.symbol;
    return `${n + 1}. ${p.title} × ${qty} = ${unit.value * qty} ${unit.symbol}`;
  });
  const text = (isAr
    ? ['مرحباً، أود طلب العطور التالية من زهرة بيسان:', '', ...rows, '', `المجموع: ${total} ${symbol}`, '', 'الاسم:', 'المدينة والعنوان:']
    : ['Hello, I would like to order these perfumes from Zahrat Beesan:', '', ...rows, '', `Total: ${total} ${symbol}`, '', 'Name:', 'City & address:']
  ).join('\n');
  window.open(`https://wa.me/${CART_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
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
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
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
