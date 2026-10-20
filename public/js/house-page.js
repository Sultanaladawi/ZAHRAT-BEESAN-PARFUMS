// ══════════════════════════════════════════════════════════
// 🏛 House page: a card with the house's logo, name, how many products are
// in stock and its offers, shown above the filters when a house is open.
// ══════════════════════════════════════════════════════════

function renderHouseCard() {
  const section = document.getElementById('catalog');
  if (!section) return;
  let card = document.getElementById('houseCard');
  const house = activeHouse && activeHouse !== 'all' ? getHouseById(activeHouse) : null;
  document.body.classList.toggle('house-view', !!house);
  if (!house) { if (card) card.remove(); return; }
  if (!card) {
    card = document.createElement('div');
    card.id = 'houseCard';
    card.className = 'house-card';
    const anchor = document.getElementById('catalogFilters');
    section.insertBefore(card, anchor);
  }
  const isAr = currentLang === 'ar';
  const list = catalogByHouse[activeHouse] || perfumesData || [];
  const available = list.filter(p => p.isAvailable !== false && p.status !== 'out');
  const onOffer = typeof offerRuleFor === 'function' ? available.filter(p => offerRuleFor(p)).length : 0;
  const name = isAr ? house.nameAr : house.nameEn;
  const stats = isAr
    ? `${list.length} منتج · ${available.length} متوفر${onOffer ? ` · عروض على ${onOffer} منتج` : ''}`
    : `${list.length} products · ${available.length} in stock${onOffer ? ` · ${onOffer} on offer` : ''}`;
  card.innerHTML = `
    <span class="house-card-logo"><img src="${house.logo}?v=10" alt="" loading="lazy"></span>
    <div class="house-card-text">
      <h2>${name}</h2>
      <p>${stats}</p>
    </div>
    ${onOffer ? `<button type="button" class="house-card-btn" onclick="filterCatalog('offers')">${isAr ? `عروض ${name} فقط` : `${name} offers only`}</button>` : ''}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const original = window.renderCatalog;
  if (typeof original === 'function') {
    window.renderCatalog = function (...args) {
      const r = original.apply(this, args);
      try { renderHouseCard(); } catch (e) { console.error(e); }
      return r;
    };
  }
});
