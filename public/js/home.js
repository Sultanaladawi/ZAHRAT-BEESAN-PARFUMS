// ══════════════════════════════════════════════════════════
// 🏠 Storefront home page: hero slider, house circles, category tiles
// and product rails. Shown only on the "all houses" view with no filter
// or search; picking a house, a filter or searching shows the catalog.
// ══════════════════════════════════════════════════════════

// Houses switched off in the dashboard are left out.
const homeHouseOn = id => typeof SITE_CONFIG === 'undefined' || !SITE_CONFIG.hiddenHouses.includes(id);
const HOME_HOUSES = ['ghalati', 'assaf', 'laverne', 'rasasi', 'deraah', 'al-rehab', 'thunayan', 'labonair'].filter(homeHouseOn);

const HOME_SLIDES = [
  {
    productId: 'alrehab-209357139',
    eyebrowAr: 'دار زهرة بيسان للعطور', eyebrowEn: 'Zahrat Beesan Parfums',
    titleAr: 'عطور أصلية من أعرق الدور الخليجية', titleEn: 'Authentic perfumes from the finest Gulf houses',
    textAr: 'أكثر من 1,800 عطر وبخور وتولة من 8 دور معتمدة، بضمان الأصالة وتوصيل لكل الأردن والخليج.',
    textEn: '1,800+ perfumes, bakhoor and oils from 8 authorized houses, delivered across Jordan and the Gulf.',
    ctaAr: 'تسوّق الآن', ctaEn: 'Shop now', action: 'house:al-rehab',
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

for (let i = HOME_SLIDES.length - 1; i >= 0; i--) {
  const m = HOME_SLIDES[i].action.match(/^house:(.+)$/);
  if (m && !homeHouseOn(m[1])) HOME_SLIDES.splice(i, 1);
}

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

// The home page shows the storefront only; the full catalog opens on demand.
let homeBrowseAll = false;

function homeBrowseCatalog() {
  homeBrowseAll = true;
  updateHomeVisibility();
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
}

function goHome() {
  homeBrowseAll = false;
  if (typeof activeModalPerfume !== 'undefined' && activeModalPerfume) closeProductModal();
  if (activeHouse !== 'all' || currentFilter !== 'all' || currentSearch) {
    const box = document.getElementById('mainSearchInput');
    if (box) box.value = '';
    currentSearch = '';
    selectHouse('all');
  }
  updateHomeVisibility();
  renderHome();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function homeGo(action) {
  if (action === 'catalog') {
    homeBrowseCatalog();
  } else if (action.startsWith('house:')) {
    selectHouse(action.slice(6));
  }
}

function homeShowCategory(filter) {
  const btn = document.querySelector(`.catalog-filter-btn[data-filter="${filter}"]`);
  filterCatalog(filter, btn);
  homeBrowseCatalog();
}

// Hero: one line that sells the store, two ways in, and three bottles from
// three houses in arched frames (the middle one larger).
function renderHomeHero() {
  const t = translations[currentLang] || translations.ar;
  const picks = HOME_SLIDES.map(s => ({ s, p: homeFindProduct(s.productId) }));
  const order = picks.length === 3 ? [picks[1], picks[0], picks[2]] : picks;
  const quizOn = typeof SITE_CONFIG === 'undefined' || SITE_CONFIG.showQuiz !== false;
  return `
    <section class="hero-b">
      <span class="hero-b-eyebrow">${t.heroEyebrow}</span>
      <h1 class="hero-b-title">${t.heroTitle}</h1>
      <p class="hero-b-sub">${t.heroSub}</p>
      <div class="hero-b-ctas">
        <button type="button" class="hero-b-btn is-solid" onclick="homeBrowseCatalog()">${t.heroShopAll}</button>
        ${quizOn ? `<button type="button" class="hero-b-btn" onclick="openQuiz()">${t.heroQuiz}</button>` : ''}
      </div>
      <div class="hero-b-bottles">
        ${order.map(({ s, p }, i) => {
          const house = (s.action.match(/^house:(.+)$/) || [])[1];
          const meta = house ? homeHouseMeta(house) : null;
          const label = meta ? (homeIsAr() ? meta.nameAr : meta.nameEn) : (homeIsAr() ? 'زهرة بيسان' : 'Zahrat Beesan');
          const img = p ? p.image : 'images/logo_transparent_small.webp';
          return `
          <button type="button" class="hero-b-bottle${i === 1 ? ' is-main' : ''}" onclick="${p ? `openProductModal('${p.id}')` : `homeGo('${s.action}')`}">
            <img src="${img}" alt="${p ? (homeIsAr() ? p.title : (p.titleEn || p.title)) : ''}" ${i === 1 ? 'fetchpriority="high"' : 'loading="lazy"'}>
            <span>${label}</span>
          </button>`;
        }).join('')}
      </div>
    </section>`;
}

// Kept for older callers; the hero no longer slides.
function homeSetSlide() {
  clearInterval(homeSlideTimer);
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
    // Prefer a photo on the house template so the tiles look like one set.
    const p = all.find(x => homeAvailable(x) && c.match(x) && x.imageLayout === 'showcase')
      || all.find(x => homeAvailable(x) && c.match(x));
    const img = p ? getCardThumb(p.image) : 'images/logo_transparent_small.webp';
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
  const rails = ['deraah', 'rasasi', 'ghalati', 'laverne'].filter(homeHouseOn).map(h => {
    const meta = homeHouseMeta(h);
    return renderHomeRail(homeIsAr() ? `من ${meta.nameAr}` : `From ${meta.nameEn}`, singles(byHouse[h]).slice(3, 15), `house:${h}`);
  });

  const cfg = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG : {};
  const recent = cfg.showRecent !== false && typeof recentProducts === 'function' ? recentProducts().slice(0, 10) : [];
  // "Our picks" are the products starred in the dashboard.
  const featured = all.filter(p => p.featured).slice(0, 16);
  root.innerHTML = renderHomeHero()
    + (featured.length ? renderHomeRail(homeIsAr() ? 'مختارات زهرة بيسان' : 'Zahrat Beesan picks', featured, null) : '')
    + (recent.length ? renderHomeRail(homeIsAr() ? 'شاهدتها مؤخراً' : 'Recently viewed', recent, null) : '')
    + renderHomeHouses()
    + renderHomeRail(homeIsAr() ? 'الأكثر طلباً' : 'Most wanted', bestsellers, 'catalog')
    + renderHomeCategories(all)
    + (cfg.showQuiz === false ? '' : `<section class="home-quiz"><div><h2>${homeIsAr() ? 'محتار شو تختار؟' : 'Not sure what to pick?'}</h2><p>${homeIsAr() ? 'جاوب على 4 أسئلة وبنختارلك العطور الأنسب لذوقك.' : 'Answer 4 quick questions and we will pick the perfumes for you.'}</p></div><button type="button" class="home-cta" onclick="openQuiz()">${homeIsAr() ? 'اختار عطرك' : 'Find your perfume'}</button></section>`)
    + (typeof renderHomeReviews === 'function' ? renderHomeReviews() : '')
    + renderHomePromo()
    + rails.join('')
    + `<div class="home-browse-all"><button type="button" class="home-cta" onclick="homeBrowseCatalog()">${homeIsAr() ? 'تصفّح كل العطور' : 'Browse all perfumes'}</button></div>`;
  homeSetSlide(homeSlideIndex);
}

function updateHomeVisibility() {
  const isHome = activeHouse === 'all' && currentFilter === 'all' && !currentSearch;
  document.body.classList.toggle('is-home', isHome);
  document.body.classList.toggle('home-catalog-hidden', isHome && !homeBrowseAll);
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
  wrap('setCurrency', () => { renderHome(); });
  document.addEventListener('DOMContentLoaded', () => {
    updateHomeVisibility();
    renderHome();
  });
})();
