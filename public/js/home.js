// ══════════════════════════════════════════════════════════
// 🏠 Storefront home page: hero slider, house circles, category tiles
// and product rails. Shown only on the "all houses" view with no filter
// or search; picking a house, a filter or searching shows the catalog.
// ══════════════════════════════════════════════════════════

const HOME_HOUSES = ['ghalati', 'assaf', 'laverne', 'rasasi', 'deraah', 'al-rehab', 'thunayan', 'labonair'];

const HOME_SLIDES = [
  {
    productId: 'alrehab-209357139',
    eyebrowAr: 'دار زهرة بيسان للعطور', eyebrowEn: 'Zahrat Beesan Parfums',
    titleAr: 'عطور أصلية من أعرق الدور الخليجية', titleEn: 'Authentic perfumes from the finest Gulf houses',
    textAr: 'أكثر من 1,800 عطر وبخور وتولة من 8 دور معتمدة، بضمان الأصالة وتوصيل لكل الأردن والخليج.',
    textEn: '1,800+ perfumes, bakhoor and oils from 8 authorized houses, delivered across Jordan and the Gulf.',
    ctaAr: 'تسوّق الآن', ctaEn: 'Shop now', action: 'catalog',
  },
  {
    productId: 'rasasi-604456049',
    eyebrowAr: 'الرصاصي', eyebrowEn: 'Rasasi',
    titleAr: 'فخامة الرصاصي بين يديك', titleEn: 'The luxury of Rasasi',
    textAr: 'تشكيلة الرصاصي الكاملة من العطور ودهن العود والبخور.',
    textEn: 'The full Rasasi range of perfumes, oud oils and bakhoor.',
    ctaAr: 'اكتشف الرصاصي', ctaEn: 'Discover Rasasi', action: 'house:rasasi',
  },
  {
    productId: 'assaf-2017195362',
    eyebrowAr: 'عساف', eyebrowEn: 'Assaf',
    titleAr: 'عطور عساف الأكثر طلباً', titleEn: "Assaf's most wanted",
    textAr: 'أتاكس، وايلد كولت، أروقيت وأكثر — بأسعار خاصة.',
    textEn: 'Attacks, Wild Colt, Arrogate and more — at special prices.',
    ctaAr: 'تسوّق عساف', ctaEn: 'Shop Assaf', action: 'house:assaf',
  },
];

const HOME_CATEGORIES = [
  { filter: 'men', ar: 'عطور رجالية', en: "Men's perfumes", match: p => /رجال|men\b|pour homme/i.test(`${p.title} ${p.titleEn} ${JSON.stringify(p.specs || {})}`) },
  { filter: 'women', ar: 'عطور نسائية', en: "Women's perfumes", match: p => /نسائ|women|femme/i.test(`${p.title} ${p.titleEn} ${JSON.stringify(p.specs || {})}`) },
  { filter: 'unisex', ar: 'للجنسين', en: 'Unisex', match: p => /للجنسين|unisex/i.test(`${p.title} ${p.titleEn} ${JSON.stringify(p.specs || {})}`) },
  { filter: 'bundles', ar: 'هدايا وباقات', en: 'Gifts & sets', match: p => p.categoryType === 'bundle' || p.categoryType === 'gift_set' },
  { filter: 'bakhoor', ar: 'بخور ومعمول وعود', en: 'Bakhoor & oud', match: p => p.categoryType === 'bakhoor' },
  { filter: 'oils', ar: 'تولات وزيوت', en: 'Perfume oils', match: p => p.categoryType === 'oil' },
];

let homeSlideIndex = 0;
let homeSlideTimer = null;

const homeIsAr = () => currentLang === 'ar';
const homeText = (o, key) => (homeIsAr() ? o[`${key}Ar`] : o[`${key}En`]);
const homeAvailable = p => p && p.isAvailable !== false && p.status !== 'out' && p.image;

function homeHouseMeta(id) {
  return (typeof FRAGRANCE_HOUSES !== 'undefined' && FRAGRANCE_HOUSES.find(h => h.id === id)) || { id, nameAr: id, nameEn: id };
}

function homeFindProduct(id) {
  for (const h of HOME_HOUSES) {
    const p = (catalogByHouse[h] || []).find(x => x.id === id);
    if (p) return p;
  }
  return null;
}

function homeGo(action) {
  if (action === 'catalog') {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  } else if (action.startsWith('house:')) {
    selectHouse(action.slice(6));
  }
}

function homeShowCategory(filter) {
  const btn = document.querySelector(`.catalog-filter-btn[data-filter="${filter}"]`);
  filterCatalog(filter, btn);
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
}

function renderHomeHero() {
  const slides = HOME_SLIDES.map((s, i) => {
    const p = homeFindProduct(s.productId);
    const img = p ? p.image : 'images/template_empty_podium.jpg';
    return `
      <article class="home-slide ${i === homeSlideIndex ? 'is-active' : ''}" aria-hidden="${i !== homeSlideIndex}">
        <div class="home-slide-copy">
          <span class="home-eyebrow">${homeText(s, 'eyebrow')}</span>
          <h1 class="home-slide-title">${homeText(s, 'title')}</h1>
          <p class="home-slide-text">${homeText(s, 'text')}</p>
          <button type="button" class="home-cta" onclick="homeGo('${s.action}')">${homeText(s, 'cta')}</button>
        </div>
        <div class="home-slide-media">
          <img src="${img}" alt="${p ? (homeIsAr() ? p.title : p.titleEn) : ''}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
        </div>
      </article>`;
  }).join('');
  const dots = HOME_SLIDES.map((_, i) => `
    <button type="button" class="home-dot ${i === homeSlideIndex ? 'is-active' : ''}" onclick="homeSetSlide(${i})" aria-label="${i + 1}"></button>`).join('');
  return `<section class="home-hero" aria-roledescription="carousel">${slides}<div class="home-dots">${dots}</div></section>`;
}

function homeSetSlide(i) {
  homeSlideIndex = (i + HOME_SLIDES.length) % HOME_SLIDES.length;
  document.querySelectorAll('.home-slide').forEach((el, idx) => {
    el.classList.toggle('is-active', idx === homeSlideIndex);
    el.setAttribute('aria-hidden', String(idx !== homeSlideIndex));
  });
  document.querySelectorAll('.home-dot').forEach((el, idx) => el.classList.toggle('is-active', idx === homeSlideIndex));
  clearInterval(homeSlideTimer);
  homeSlideTimer = setInterval(() => homeSetSlide(homeSlideIndex + 1), 6000);
}

function renderHomeHouses() {
  const items = HOME_HOUSES.map(id => {
    const h = homeHouseMeta(id);
    const name = homeIsAr() ? h.nameAr : h.nameEn;
    return `
      <button type="button" class="home-house" onclick="selectHouse('${id}')">
        <span class="home-house-logo"><img src="${h.logo}?v=10" alt="${name}" loading="lazy"></span>
        <span class="home-house-name">${name}</span>
      </button>`;
  }).join('');
  return `
    <section class="home-section">
      <h2 class="home-heading">${homeIsAr() ? 'تسوّق حسب الدار' : 'Shop by house'}</h2>
      <div class="home-houses">${items}</div>
    </section>`;
}

function renderHomeCategories(all) {
  const tiles = HOME_CATEGORIES.map(c => {
    const p = all.find(x => homeAvailable(x) && c.match(x));
    const img = p ? p.image : 'images/template_empty_podium.jpg';
    return `
      <button type="button" class="home-tile" onclick="homeShowCategory('${c.filter}')">
        <img src="${img}" alt="" loading="lazy">
        <span class="home-tile-label">${homeIsAr() ? c.ar : c.en}</span>
      </button>`;
  }).join('');
  return `
    <section class="home-section">
      <h2 class="home-heading">${homeIsAr() ? 'تسوّق حسب الفئة' : 'Shop by category'}</h2>
      <div class="home-tiles">${tiles}</div>
    </section>`;
}

function renderHomeRail(title, products, action) {
  const t = translations[currentLang] || translations.ar;
  if (!products.length) return '';
  const more = action
    ? `<button type="button" class="home-more" onclick="homeGo('${action}')">${homeIsAr() ? 'عرض الكل' : 'View all'}</button>`
    : '';
  return `
    <section class="home-section">
      <div class="home-heading-row">
        <h2 class="home-heading">${title}</h2>${more}
      </div>
      <div class="home-rail">${products.map(p => renderProductCard(p, t)).join('')}</div>
    </section>`;
}

function renderHomePromo() {
  return `
    <section class="home-promo">
      <div class="home-promo-copy">
        <h2>${homeIsAr() ? 'توصيل لكل الأردن والخليج' : 'Delivery across Jordan and the Gulf'}</h2>
        <p>${homeIsAr() ? 'اطلب عطرك المفضل مباشرة عبر واتساب، ونوصله لباب بيتك مختوماً بختم المصنع.' : 'Order your favourite perfume on WhatsApp and get it factory-sealed at your door.'}</p>
      </div>
      <a class="home-cta home-cta-light" href="https://wa.me/962796697413" target="_blank" rel="noopener noreferrer">${homeIsAr() ? 'اطلب عبر واتساب' : 'Order on WhatsApp'}</a>
    </section>`;
}

async function renderHome() {
  const root = document.getElementById('homeStorefront');
  if (!root) return;
  root.innerHTML = renderHomeHero() + '<div class="home-skeleton"></div>';
  homeSetSlide(homeSlideIndex);

  await Promise.all(HOME_HOUSES.map(h => ensureHouseCatalogLoaded(h)));
  const byHouse = Object.fromEntries(HOME_HOUSES.map(h => [h, (catalogByHouse[h] || []).filter(homeAvailable)]));
  const all = HOME_HOUSES.flatMap(h => byHouse[h]);
  const singles = list => list.filter(p => !['bundle', 'gift_set', 'bakhoor'].includes(p.categoryType));

  const bestsellers = HOME_HOUSES.flatMap(h => singles(byHouse[h]).slice(0, 3));
  const rails = ['deraah', 'rasasi', 'ghalati', 'laverne'].map(h => {
    const meta = homeHouseMeta(h);
    return renderHomeRail(homeIsAr() ? `من ${meta.nameAr}` : `From ${meta.nameEn}`, singles(byHouse[h]).slice(3, 15), `house:${h}`);
  });

  root.innerHTML = renderHomeHero()
    + renderHomeHouses()
    + renderHomeRail(homeIsAr() ? 'الأكثر طلباً' : 'Most wanted', bestsellers, 'catalog')
    + renderHomeCategories(all)
    + renderHomePromo()
    + rails.join('');
  homeSetSlide(homeSlideIndex);
}

function updateHomeVisibility() {
  const isHome = activeHouse === 'all' && currentFilter === 'all' && !currentSearch;
  document.body.classList.toggle('is-home', isHome);
}

// Keep the home page in step with house, filter, search and language changes.
(function wireHome() {
  const wrap = (name, after) => {
    const original = window[name];
    if (typeof original !== 'function') return;
    window[name] = function (...args) {
      const result = original.apply(this, args);
      Promise.resolve(result).then(after);
      return result;
    };
  };
  wrap('selectHouse', updateHomeVisibility);
  wrap('renderCatalog', updateHomeVisibility);
  wrap('setLanguage', () => { renderHome(); updateHomeVisibility(); });
  document.addEventListener('DOMContentLoaded', () => {
    updateHomeVisibility();
    renderHome();
  });
})();
