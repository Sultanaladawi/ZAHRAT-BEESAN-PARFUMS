// ══════════════════════════════════════════════════════════
// 🌿 Zahrat Beesan Parfums — Main Client Application
// Full Interactive Logic: Multi-Currency, Bilingual i18n, Dynamic Catalog & Modals
// ══════════════════════════════════════════════════════════

const CURRENCIES = [
  { code: 'JOD', symbol: 'د.أ', symbolEn: 'JOD', nameAr: 'الأردن (دينار أردني)', nameEn: 'Jordan (JOD)', rate: 1, iso: 'jo' },
  { code: 'SAR', symbol: 'ر.س', symbolEn: 'SAR', nameAr: 'السعودية (ريال سعودي)', nameEn: 'Saudi Arabia (SAR)', rate: 5.29, iso: 'sa' },
  { code: 'AED', symbol: 'د.إ', symbolEn: 'AED', nameAr: 'الإمارات (درهم إماراتي)', nameEn: 'UAE (AED)', rate: 5.18, iso: 'ae' },
  { code: 'QAR', symbol: 'ر.ق', symbolEn: 'QAR', nameAr: 'قطر (ريال قطري)', nameEn: 'Qatar (QAR)', rate: 5.14, iso: 'qa' },
  { code: 'KWD', symbol: 'د.ك', symbolEn: 'KWD', nameAr: 'الكويت (دينار كويتي)', nameEn: 'Kuwait (KWD)', rate: 0.43, iso: 'kw' },
  { code: 'BHD', symbol: 'د.ب', symbolEn: 'BHD', nameAr: 'البحرين (دينار بحريني)', nameEn: 'Bahrain (BHD)', rate: 0.53, iso: 'bh' },
  { code: 'OMR', symbol: 'ر.ع', symbolEn: 'OMR', nameAr: 'عُمان (ريال عماني)', nameEn: 'Oman (OMR)', rate: 0.54, iso: 'om' },
  { code: 'USD', symbol: '$', symbolEn: '$', nameAr: 'أمريكا (دولار أمريكي)', nameEn: 'USA (USD)', rate: 1.41, iso: 'us' },
  { code: 'EUR', symbol: '€', symbolEn: '€', nameAr: 'أوروبا (يورو)', nameEn: 'Europe (EUR)', rate: 1.31, iso: 'eu' },
  { code: 'GBP', symbol: '£', symbolEn: '£', nameAr: 'بريطانيا (جنيه إسترليني)', nameEn: 'UK (GBP)', rate: 1.11, iso: 'gb' }
];

let currentLang = 'ar';
let activeCurrency = CURRENCIES[0]; // JOD by default
let cartItemsCount = 0;
let perfumesData = [];
let currentFilter = 'all';
let currentSearch = '';
let activeModalPerfume = null;
let activeHouse = 'ghalati';

function getFlagUrl(iso) {
  if (!iso) return 'https://flagcdn.com/24x18/jo.png';
  if (iso === 'eu') return 'https://flagcdn.com/24x18/eu.png';
  return `https://flagcdn.com/24x18/${iso}.png`;
}

// ── Official Pricing Formula: Original SAR / 5.29 + 12 JOD Margin ──
function calculateZBPrice(sarPrice) {
  const convertedJOD = sarPrice / 5.29;
  return Math.round(convertedJOD) + 12;
}

function getFormattedPrice(baseJod) {
  const converted = (baseJod * activeCurrency.rate).toFixed(2);
  const symbol = currentLang === 'ar' ? activeCurrency.symbol : activeCurrency.symbolEn;
  return `${converted} ${symbol}`;
}

function getProductPrices(p) {
  const isAr = currentLang === 'ar';
  let symbol = isAr ? activeCurrency.symbol : activeCurrency.symbolEn;

  const sarSale = Number(p.sarPrice) || 95;
  const sarOrig = Number(p.origSarPrice) || sarSale;
  const jodSale = Number(p.finalJod) || (Math.round(sarSale / 5.29) + 12);
  const jodOrig = Number(p.origJod) || (sarOrig > sarSale ? (Math.round(sarOrig / 5.29) + 12) : jodSale);

  let salePriceVal, origPriceVal;

  if (activeCurrency.code === 'SAR') {
    salePriceVal = sarSale;
    origPriceVal = sarOrig;
    if (isAr) symbol = '﷼';
  } else if (activeCurrency.code === 'JOD') {
    salePriceVal = jodSale;
    origPriceVal = jodOrig;
  } else {
    salePriceVal = Math.round(jodSale * activeCurrency.rate);
    origPriceVal = Math.round(jodOrig * activeCurrency.rate);
  }

  const formatVal = (v) => Number.isInteger(v) ? v : Number(v.toFixed(1));
  const hasDiscount = origPriceVal > salePriceVal;

  const saleStr = `${formatVal(salePriceVal)} ${symbol}`;
  const origStr = hasDiscount ? `${formatVal(origPriceVal)} ${symbol}` : '';

  return { saleStr, origStr, hasDiscount };
}

function showNotification(message, icon = '🛍️') {
  let toast = document.getElementById('zbToastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'zbToastNotification';
    toast.className = 'zb-toast-notification';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <span class="zb-toast-icon">${icon}</span>
    <span class="zb-toast-text">${message}</span>
  `;
  toast.classList.add('show-toast');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show-toast');
  }, 2600);
}

function toggleWishlist(perfumeId, btnEl) {
  let wishlist = [];
  try {
    wishlist = JSON.parse(localStorage.getItem('zb_wishlist') || '[]');
  } catch(e){}

  const idx = wishlist.indexOf(perfumeId);
  const isAr = currentLang === 'ar';
  const p = (typeof perfumesData !== 'undefined' ? perfumesData : []).find(item => item.id === perfumeId);
  const name = p ? (isAr ? p.title : p.titleEn) : '';

  if (idx > -1) {
    wishlist.splice(idx, 1);
    if (btnEl) {
      btnEl.classList.remove('active');
      const svg = btnEl.querySelector('svg');
      if (svg) svg.setAttribute('fill', 'none');
    }
    showNotification(isAr ? `تمت إزالة "${name}" من المفضلة` : `"${name}" removed from wishlist`, '🤍');
  } else {
    wishlist.push(perfumeId);
    if (btnEl) {
      btnEl.classList.add('active');
      const svg = btnEl.querySelector('svg');
      if (svg) svg.setAttribute('fill', '#e53935');
    }
    showNotification(isAr ? `تمت إضافة "${name}" إلى قائمة المفضلة ❤️` : `"${name}" added to wishlist ❤️`, '❤️');
  }

  localStorage.setItem('zb_wishlist', JSON.stringify(wishlist));
}

function isInWishlist(perfumeId) {
  try {
    const list = JSON.parse(localStorage.getItem('zb_wishlist') || '[]');
    return list.includes(perfumeId);
  } catch(e) {
    return false;
  }
}

function isInNotifyList(perfumeId) {
  try {
    const list = JSON.parse(localStorage.getItem('zb_notify_available') || '[]');
    return list.includes(perfumeId);
  } catch(e) {
    return false;
  }
}

function toggleNotifyWhenAvailable(perfumeId, btnEl) {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('zb_notify_available') || '[]');
  } catch(e) {}

  const idx = list.indexOf(perfumeId);
  const isAr = currentLang === 'ar';
  const p = (typeof perfumesData !== 'undefined' ? perfumesData : []).find(item => item.id === perfumeId);
  const name = p ? (isAr ? p.title : p.titleEn) : '';

  if (idx > -1) {
    list.splice(idx, 1);
    localStorage.setItem('zb_notify_available', JSON.stringify(list));
    showNotification(
      isAr ? `تم إلغاء تنبيه توفر "${name}"` : `Availability alert removed for "${name}"`,
      '🔕'
    );
  } else {
    list.push(perfumeId);
    localStorage.setItem('zb_notify_available', JSON.stringify(list));
    showNotification(
      isAr ? `تم تسجيل طلبك! سنبلغك فور توفر "${name}" 🔔` : `We will notify you as soon as "${name}" is back in stock! 🔔`,
      '🔔'
    );
  }

  renderCatalog(currentFilter, currentSearch);
  if (activeModalPerfume && activeModalPerfume.id === perfumeId) {
    renderProductModalContent(activeModalPerfume);
  }
}

// ── Language Controller ──
function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.direction = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  // Update text nodes that have data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      if (el.tagName === 'INPUT') {
        el.placeholder = translations[lang][key];
      } else {
        el.textContent = translations[lang][key];
      }
    }
  });

  // Update active flag buttons
  const btnAr = document.getElementById('langBtnAr');
  const btnEn = document.getElementById('langBtnEn');
  if (btnAr && btnEn) {
    if (lang === 'ar') {
      btnAr.classList.add('active-lang');
      btnEn.classList.remove('active-lang');
    } else {
      btnEn.classList.add('active-lang');
      btnAr.classList.remove('active-lang');
    }
  }

  updateCurrencyUI();
  renderCatalog(currentFilter, currentSearch);
  renderHousesDropdown();
  renderHousesStrip();
  renderFooterHouses();

  if (activeHouse !== 'ghalati') {
    const house = typeof getHouseById === 'function' ? getHouseById(activeHouse) : (typeof FRAGRANCE_HOUSES !== 'undefined' ? FRAGRANCE_HOUSES.find(h => h.id === activeHouse) : null);
    if (house) renderBrandShowcase(house);
  }

  if (activeModalPerfume) {
    renderProductModalContent(activeModalPerfume);
    const breadcrumbTitle = document.getElementById('productBreadcrumbTitle');
    if (breadcrumbTitle) {
      breadcrumbTitle.textContent = lang === 'ar' ? activeModalPerfume.title : activeModalPerfume.titleEn;
    }
  }

  localStorage.setItem('zb_perfumes_lang', lang);
}

// ── Currency Controller ──
function setCurrency(code) {
  const found = CURRENCIES.find(c => c.code === code);
  if (found) {
    activeCurrency = found;
    localStorage.setItem('zb_perfumes_currency', code);
    updateCurrencyUI();
    renderCatalog(currentFilter, currentSearch);
    closeCurrencyModal();

    if (activeModalPerfume) {
      renderProductModalContent(activeModalPerfume);
    }
  }
}

function updateCurrencyUI() {
  const flagEl = document.getElementById('currencyFlag');
  const labelEl = document.getElementById('currencyLabel');

  if (flagEl) {
    flagEl.src = getFlagUrl(activeCurrency.iso);
  }

  if (labelEl) {
    labelEl.textContent = currentLang === 'ar' 
      ? `متجر ${activeCurrency.nameAr}` 
      : `Store: ${activeCurrency.nameEn}`;
  }

  // Update dynamic price displays
  document.querySelectorAll('[data-base-jod]').forEach(el => {
    const baseJod = parseFloat(el.getAttribute('data-base-jod')) || 30;
    el.textContent = getFormattedPrice(baseJod);
  });
}

// ══════════════════════════════════════════════════════════
// 🏛️ Fragrance Houses Controller (24 Royal Fragrance Houses)
// ══════════════════════════════════════════════════════════
function renderHousesDropdown() {
  const container = document.getElementById('housesDropdownMenu');
  if (!container || typeof FRAGRANCE_HOUSES === 'undefined') return;

  const isAr = currentLang === 'ar';
  const t = translations[currentLang] || translations.ar;

  container.innerHTML = `
    <div class="mega-brand-header">
      <span class="mega-brand-title">🏛️ ${t.housesSectionTitle || 'دور العطور المعتمدة'}</span>
      <span class="mega-brand-count">${FRAGRANCE_HOUSES.length} ${isAr ? 'داراً' : 'Houses'}</span>
    </div>
    <div class="mega-brand-grid">
      ${FRAGRANCE_HOUSES.map(h => {
        const name = isAr ? h.nameAr : h.nameEn;
        return `
          <a href="#catalog" class="mega-brand-item" onclick="selectHouse('${h.id}')" title="${name}">
            <img src="${h.logo}" class="mega-brand-item-logo" alt="${name}" loading="lazy">
            <span class="mega-brand-item-name">${name}</span>
            <span class="mega-brand-item-country">${h.region === 'sa' ? '🇸🇦' : (h.region === 'ae' ? '🇦🇪' : '🇰🇼')}</span>
          </a>
        `;
      }).join('')}
    </div>
  `;
}

function renderHousesStrip() {
  const container = document.getElementById('housesStrip');
  if (!container || typeof FRAGRANCE_HOUSES === 'undefined') return;

  const isAr = currentLang === 'ar';

  container.innerHTML = FRAGRANCE_HOUSES.map(h => {
    const isActive = h.id === activeHouse;
    const name = isAr ? h.nameAr : h.nameEn;
    const countTag = h.count ? ` (${h.count} ${isAr ? 'عطر' : 'Items'})` : '';
    return `
      <button type="button" class="house-chip ${isActive ? 'active-house' : ''}" 
        data-house-id="${h.id}" 
        onclick="selectHouse('${h.id}')"
        title="${name}">
        <img src="${h.logo}" class="house-chip-logo" alt="${name}" loading="lazy">
        <span>${name}${countTag}</span>
      </button>
    `;
  }).join('');
}

function renderFooterHouses() {
  const container = document.getElementById('footerHousesList');
  if (!container || typeof FRAGRANCE_HOUSES === 'undefined') return;

  const isAr = currentLang === 'ar';
  const featured = FRAGRANCE_HOUSES.slice(0, 10);

  container.innerHTML = `
    ${featured.map(h => {
      const name = isAr ? h.nameAr : h.nameEn;
      return `
        <li>
          <a href="#catalog" onclick="selectHouse('${h.id}')" class="footer-brand-item">
            <img src="${h.logo}" class="footer-brand-logo" alt="${name}" loading="lazy">
            <span>${name}</span>
          </a>
        </li>
      `;
    }).join('')}
    <li>
      <a href="#catalog" onclick="selectHouse('ghalati')" class="footer-brand-all">
        <img src="images/brands/ghalati.svg" class="footer-brand-logo" alt="Ghalati" loading="lazy">
        <span>${isAr ? `عرض كافة الـ ${FRAGRANCE_HOUSES.length} داراً معتمدة...` : `Browse all ${FRAGRANCE_HOUSES.length} Houses...`}</span>
      </a>
    </li>
  `;
}

function selectHouse(houseId) {
  if (activeModalPerfume) {
    closeProductModal();
  }

  activeHouse = houseId;

  // Update active state in houses strip
  document.querySelectorAll('.house-chip').forEach(chip => {
    if (chip.getAttribute('data-house-id') === houseId) {
      chip.classList.add('active-house');
    } else {
      chip.classList.remove('active-house');
    }
  });

  const panel = document.getElementById('brandShowcasePanel');
  const filters = document.getElementById('catalogFilters');
  const grid = document.getElementById('catalogGrid');
  const titleText = document.getElementById('catalogTitleText');
  const subtitleText = document.getElementById('catalogSubtitleText');
  const isAr = currentLang === 'ar';

  if (houseId === 'ghalati') {
    if (panel) panel.style.display = 'none';
    if (filters) filters.style.display = 'flex';
    if (grid) grid.style.display = 'grid';
    if (titleText) titleText.textContent = isAr ? 'التشكيلة الرسمية الأولى — دار غلاتي (Ghalati)' : 'Official Launch Collection — Ghalati House';
    if (subtitleText) subtitleText.textContent = isAr ? 'عطور أصلية مستوردة مباشرة من المصدر الرسمي بأوصافها ومكوناتها الأصلية 100%' : '100% authentic perfumes imported directly with verified notes and specifications';
    renderCatalog(currentFilter, currentSearch);
  } else {
    const house = typeof getHouseById === 'function' ? getHouseById(houseId) : (typeof FRAGRANCE_HOUSES !== 'undefined' ? FRAGRANCE_HOUSES.find(h => h.id === houseId) : null);
    if (house) {
      if (filters) filters.style.display = 'none';
      if (grid) grid.style.display = 'none';
      if (panel) {
        panel.style.display = 'block';
        renderBrandShowcase(house);
      }
      if (titleText) titleText.textContent = isAr ? house.nameAr : house.nameEn;
      if (subtitleText) subtitleText.textContent = isAr ? 'إصدارات رسمية مستوردة بضمان أصالة زهرة بيسان 100%' : 'Official luxury collection backed by 100% authenticity guarantee';
    }
  }

  // Smooth scroll down to catalog section
  const catEl = document.getElementById('catalog');
  if (catEl) {
    catEl.scrollIntoView({ behavior: 'smooth' });
  }
}

function renderBrandShowcase(h) {
  const panel = document.getElementById('brandShowcasePanel');
  if (!panel) return;

  const t = translations[currentLang] || translations.ar;
  const isAr = currentLang === 'ar';
  const name = isAr ? h.nameAr : h.nameEn;
  const country = isAr ? h.countryAr : h.countryEn;
  const specialty = isAr ? h.specialtyAr : h.specialtyEn;
  const desc = isAr ? h.descAr : h.descEn;

  const waText = encodeURIComponent(
    isAr
      ? `مرحباً، أود الاستفسار والطلب من عطور وإصدارات دار "${h.nameAr}" عبر متجر زهرة بيسان`
      : `Hello, I would like to inquire & order official perfumes from "${h.nameEn}" via Zahrat Beesan`
  );
  const waLink = `https://wa.me/962796697413?text=${waText}`;

  panel.innerHTML = `
    <div class="brand-showcase-logo-box">
      <img src="${h.logo}" class="brand-showcase-main-logo" alt="${name}">
    </div>
    <h2 class="brand-showcase-title-ar">${h.nameAr}</h2>
    <span class="brand-showcase-title-en">${h.nameEn}</span>

    <div class="brand-showcase-badges">
      <span class="brand-country-badge">${country}</span>
      <span class="brand-guarantee-badge">${t.brandAvailabilityBadge || '✨ متوفر للطلب الفوري والاستيراد المباشر بضمان الأصالة 100%'}</span>
    </div>

    <div class="brand-specialty-box">
      <span class="brand-specialty-title">✨ ${isAr ? 'التخصص وأبرز الإصدارات الملكية:' : 'Specialty & Signature Editions:'}</span>
      <p class="brand-specialty-text">${specialty}</p>
    </div>

    <p class="brand-desc-text">
      ${desc}
      <br>
      <strong style="color: var(--gold-dim); display: block; margin-top: 8px;">
        ${isAr ? '🛡️ استيراد رسمي ومضمون 100% مع أختام المصنع وسولوفان التغليف الأصلي وتوصيل سريع لكافة المحافظات ودول الخليج.' : '🛡️ 100% direct official import with factory cellophane seal and fast express delivery.'}
      </strong>
    </p>

    <div class="brand-actions-row">
      <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-brand-whatsapp">
        <span>💬</span>
        <span>${t.btnOrderBrandWhatsApp || 'طلب مباشر من هذه الدار عبر واتساب'}</span>
      </a>
      <button type="button" class="btn-return-ghalati" onclick="selectHouse('ghalati')">
        <img src="images/brands/ghalati.svg" class="btn-return-logo" alt="Ghalati">
        <span>${t.btnBackToGhalatiCatalog || 'عرض منتجات دار غلاتي المتوفرة فورياً (120 عطراً)'}</span>
      </button>
    </div>
  `;
}

// ── Catalog Data & Live Synchronization ──
const CLIENT_EXCLUDED_SALLA_IDS = new Set(['1180808215']);

function getClientBottleCount(item) {
  if (item && Number(item.bottleCount) >= 1) return Number(item.bottleCount);
  const catType = item?.categoryType || 'perfume';
  if (catType !== 'bundle') return 1;
  const text = `${item?.title || ''} ${item?.overview || ''}`;
  if (/باقة التاريخ|15\s*مل|15\s*ml|30\s*مل|30\s*ml|ميني|ديسكفري|عينات/i.test(text)) return 1;
  if (/مجموعة التراث|عطرين|عطران|ثنائية|لك ولها|2\s*×|قطعتين/i.test(text)) return 2;
  if (/ثلاث|3\s*عطور|3\s*×|باقة|بكج|العرض/i.test(text)) return 3;
  return 1;
}

function getClientDeliveryFeeJod(item) {
  if (item && Number(item.feeJod) > 0) return Number(item.feeJod);
  const id = item?.id || '';
  const text = `${item?.title || ''} ${item?.overview || ''}`;
  if (id === 'package-air-fresheners' || /بكج معطرات|معطرات الجو/i.test(item?.title || '')) return 20;
  if (id === 'bundle-heritage-collection' || /مجموعة التراث/i.test(text)) return 24;
  if (id === 'bundle-altarikh' || /باقة التاريخ|15\s*مل|15\s*ml|30\s*مل|30\s*ml|ميني|ديسكفري/i.test(text)) return 12;
  const count = getClientBottleCount(item);
  if (count === 3) return 30;
  if (count === 2) return 24;
  return 12;
}

async function syncClientSideWithSalla(list) {
  try {
    if (!Array.isArray(list) || list.length === 0) return list;
    const filteredList = list.filter(p => {
      const sid = String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || '');
      return !CLIENT_EXCLUDED_SALLA_IDS.has(sid);
    });
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Store-Identifier': '1939633486'
    };
    const knownIds = new Set(
      filteredList.map(p => String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || '')).filter(Boolean)
    );

    const discoveredNew = [];
    try {
      const latestRes = await fetch('https://api.salla.dev/store/v1/products?source=latest&limit=30', { headers }).catch(() => null);
      if (latestRes && latestRes.ok) {
        const latestJson = await latestRes.json();
        for (const it of (latestJson.data || [])) {
          const sid = String(it.id);
          if (!knownIds.has(sid) && !CLIENT_EXCLUDED_SALLA_IDS.has(sid)) {
            knownIds.add(sid);
            discoveredNew.push(it);
          }
        }
      }
    } catch (e) {}

    const allIds = [...knownIds];
    const chunks = [];
    for (let i = 0; i < allIds.length; i += 20) {
      chunks.push(allIds.slice(i, i + 20));
    }

    const liveById = new Map();
    await Promise.all(
      chunks.map(async (chunk) => {
        const q = 'source=selected&limit=30&' + chunk.map(id => `source_value[]=${id}`).join('&');
        const res = await fetch(`https://api.salla.dev/store/v1/products?${q}`, { headers }).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          for (const it of (json.data || [])) {
            liveById.set(String(it.id), it);
          }
        }
      })
    );

    if (liveById.size === 0) return filteredList;

    const newBuilt = discoveredNew.map(raw => {
      const live = liveById.get(String(raw.id)) || raw;
      const sid = String(live.id);
      const livePrice = Number(typeof live.price === 'object' ? live.price?.amount : live.price) || 95;
      const liveRegRaw = Number(typeof live.regular_price === 'object' ? live.regular_price?.amount : live.regular_price) || livePrice;
      const liveReg = Math.round(liveRegRaw);
      const liveAvail = live.is_available !== false && live.status !== 'out' && !live.is_out_of_stock;
      const cleanDesc = (live.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const catType = /باقة|مجموعة|بكج|صندوق|عرض|ثلاثية|ثنائية/i.test(live.name || '')
        ? 'bundle'
        : (/تولة|زيت عطري/i.test(live.name || '') ? 'oil' : (/بخور|معمول|معطر جو/i.test(live.name || '') ? 'bakhoor' : 'perfume'));
      const rawImg = live.image?.url || '';
      const origImg = rawImg.replace(/\/[a-f0-9-]+-\d+x[\d.]+-/, '/');
      const tempItem = { id: `ghalati-${sid}`, title: live.name, overview: cleanDesc, categoryType: catType };
      const bottleCount = getClientBottleCount(tempItem);
      const feeJod = getClientDeliveryFeeJod(tempItem);
      const baseJod = Math.round(livePrice / 5.29);

      return {
        id: `ghalati-${sid}`,
        sallaId: sid,
        title: live.name,
        titleEn: live.name,
        brand: 'Ghalati',
        bottleCount,
        feeJod,
        sarPrice: livePrice,
        origSarPrice: liveReg,
        baseJod,
        finalJod: baseJod + feeJod,
        origJod: liveReg > livePrice ? (Math.round(liveReg / 5.29) + feeJod) : (baseJod + feeJod),
        isAvailable: liveAvail,
        status: live.status || (liveAvail ? 'sale' : 'out'),
        promotionTitle: live.promotion_title || '',
        url: live.url || `https://ghalati.com/ar/p${sid}`,
        bottleUrl: origImg || rawImg,
        image: origImg || rawImg,
        originalImage: origImg || rawImg,
        galleryImages: [origImg || rawImg],
        overview: cleanDesc || `${live.name} من دار غلاتي للعطور.`,
        overviewEn: cleanDesc || `${live.name} by Ghalati Perfumes.`,
        opening: 'نغمات عطرية فاخرة من دار غلاتي',
        openingEn: 'Luxury opening notes by Ghalati',
        heart: 'قلب عطري غني ومتناغم',
        heartEn: 'Rich harmonious heart notes',
        base: 'قاعدة عطرية أصيلة وثابتة',
        baseEn: 'Long-lasting authentic base notes',
        prominent: 'خلطة غلاتي الملكية الخاصة',
        prominentEn: 'Ghalati Royal Signature Blend',
        specs: {
          size: catType === 'bundle' ? `${bottleCount > 1 ? `${bottleCount} × 100 مل` : 'مجموعة فاخرة'}` : '100 مل',
          category: 'للجنسين',
          origin: 'المملكة العربية السعودية',
          type: catType === 'bundle' ? 'باقة عطور ملكية' : 'عطر أو دو بارفيوم'
        },
        specsEn: {
          size: catType === 'bundle' ? `${bottleCount > 1 ? `${bottleCount} × 100 ml` : 'Luxury Set'}` : '100 ml',
          category: 'Unisex',
          origin: 'Saudi Arabia',
          type: catType === 'bundle' ? 'Royal Perfume Bundle' : 'Eau de Parfum'
        },
        categoryType: catType
      };
    });

    const combined = [...newBuilt, ...filteredList];
    const synced = [];
    for (const item of combined) {
      const sallaId = String(item.sallaId || ((item.url || '').match(/\/p(\d+)/) || [])[1] || '');
      if (CLIENT_EXCLUDED_SALLA_IDS.has(sallaId)) continue;
      const live = liveById.get(sallaId);
      if (!live) continue; // Deleted from source store -> remove from our store

      const bottleCount = getClientBottleCount(item);
      const feeJod = getClientDeliveryFeeJod(item);
      const livePrice = Number(typeof live.price === 'object' ? live.price?.amount : live.price) || item.sarPrice;
      const liveRegRaw = Number(typeof live.regular_price === 'object' ? live.regular_price?.amount : live.regular_price) || livePrice;
      const liveReg = Math.round(liveRegRaw);
      const liveAvail = live.is_available !== false && live.status !== 'out' && !live.is_out_of_stock;
      const baseJod = Math.round(livePrice / 5.29);

      synced.push({
        ...item,
        sallaId,
        bottleCount,
        feeJod,
        sarPrice: livePrice,
        origSarPrice: liveReg,
        baseJod,
        finalJod: baseJod + feeJod,
        origJod: liveReg > livePrice ? (Math.round(liveReg / 5.29) + feeJod) : (baseJod + feeJod),
        isAvailable: liveAvail,
        status: live.status || (liveAvail ? 'sale' : 'out'),
        promotionTitle: live.promotion_title || ''
      });
    }
    return synced;
  } catch (e) {
    return list;
  }
}

async function loadCatalog() {
  try {
    let loadedFromLiveEndpoint = false;
    const apiRes = await fetch('/api/catalog').catch(() => null);
    if (apiRes && apiRes.ok) {
      perfumesData = await apiRes.json();
      loadedFromLiveEndpoint = true;
    } else {
      const res = await fetch('data/perfumes.json');
      if (res.ok) {
        perfumesData = await res.json();
      }
    }

    renderCatalog(currentFilter, currentSearch);

    // If loaded from static file (e.g. static host), also run direct client-side Salla sync
    if (!loadedFromLiveEndpoint && perfumesData.length > 0) {
      syncClientSideWithSalla(perfumesData).then(fresh => {
        if (fresh && fresh.length > 0) {
          perfumesData = fresh;
          renderCatalog(currentFilter, currentSearch);
        }
      });
    }
  } catch (err) {
    console.error('Error fetching perfumes catalog:', err);
    renderCatalog(currentFilter, currentSearch);
  }

  // If URL has a product hash on direct load/refresh, open its full page immediately
  if (window.location.hash.startsWith('#product/')) {
    const prodId = window.location.hash.replace('#product/', '');
    if (prodId) {
      setTimeout(() => openProductModal(prodId), 150);
    }
  }

  // Periodic live sync every 90 seconds so price/stock/deletion changes appear automatically
  setInterval(refreshLiveCatalogSilently, 90 * 1000);
}

async function refreshLiveCatalogSilently() {
  try {
    const res = await fetch('/api/catalog?force=1').catch(() => null);
    let freshData = null;
    if (res && res.ok) {
      freshData = await res.json();
    } else if (perfumesData.length > 0) {
      freshData = await syncClientSideWithSalla(perfumesData);
    }

    if (Array.isArray(freshData) && freshData.length > 0) {
      const oldSig = JSON.stringify(perfumesData.map(p => `${p.id}:${p.sarPrice}:${p.origSarPrice}:${p.isAvailable}`));
      const newSig = JSON.stringify(freshData.map(p => `${p.id}:${p.sarPrice}:${p.origSarPrice}:${p.isAvailable}`));
      if (oldSig !== newSig) {
        perfumesData = freshData;
        renderCatalog(currentFilter, currentSearch);
        if (activeModalPerfume) {
          const updatedCurrent = perfumesData.find(x => x.id === activeModalPerfume.id);
          if (updatedCurrent) {
            activeModalPerfume = updatedCurrent;
            renderProductModalContent(updatedCurrent);
          } else {
            closeProductModal();
          }
        }
      }
    }
  } catch (e) {
    // Silent background check
  }
}

function filterCatalog(category, btnElement) {
  if (activeModalPerfume) {
    const hero = document.getElementById('heroSection');
    const catalog = document.getElementById('catalog');
    const prodSection = document.getElementById('productPageSection');
    if (prodSection) prodSection.style.display = 'none';
    if (hero) hero.style.display = '';
    if (catalog) catalog.style.display = '';
    activeModalPerfume = null;
    if (window.location.hash.startsWith('#product')) {
      history.pushState(null, '', '#catalog');
    }
  }
  currentFilter = category;
  if (btnElement) {
    document.querySelectorAll('.catalog-filter-btn').forEach(btn => btn.classList.remove('active-filter'));
    btnElement.classList.add('active-filter');
  }
  renderCatalog(currentFilter, currentSearch);
}

function renderCatalog(filter = 'all', searchQuery = '') {
  const container = document.getElementById('catalogGrid');
  if (!container) return;

  const filterAllBtn = document.getElementById('filterAllBtn');
  if (filterAllBtn && perfumesData.length > 0) {
    const tAll = currentLang === 'ar' ? '✨ كافة المنتجات' : '✨ All Products';
    filterAllBtn.textContent = `${tAll} (${perfumesData.length})`;
  }

  const t = translations[currentLang] || translations.ar;
  const q = searchQuery.toLowerCase().trim();

  const filtered = perfumesData.filter(p => {
    // 1. Category Filter
    if (filter === 'perfumes') {
      if (p.categoryType === 'bakhoor' || p.categoryType === 'bundle' || p.categoryType === 'oil') return false;
    } else if (filter === 'oils') {
      const isOil = p.categoryType === 'oil' || (p.specs?.type || '').includes('زيت') || (p.specs?.type || '').includes('تولة') || (p.title || '').includes('تولة');
      if (!isOil) return false;
    } else if (filter === 'bakhoor') {
      const isBakhoor = p.categoryType === 'bakhoor' || (p.specs?.type || '').includes('بخور') || (p.specs?.type || '').includes('معمول') || (p.title || '').includes('بخور') || (p.title || '').includes('معمول');
      if (!isBakhoor) return false;
    } else if (filter === 'bundles') {
      const isBundle = p.categoryType === 'bundle' || (p.specs?.type || '').includes('باقة') || (p.specs?.type || '').includes('طقم') || (p.specs?.type || '').includes('مجموعة') || (p.title || '').includes('باقة') || (p.title || '').includes('مجموعة');
      if (!isBundle) return false;
    } else if (filter === 'unisex') {
      const cat = (p.specs?.category || '').toLowerCase();
      if (!cat.includes('للجنسين') && !cat.includes('unisex')) return false;
    } else if (filter === 'women') {
      const cat = (p.specs?.category || '').toLowerCase();
      if (!cat.includes('نسائي') && !cat.includes('women')) return false;
    } else if (filter === 'men') {
      const cat = (p.specs?.category || '').toLowerCase();
      if (!cat.includes('رجالي') && !cat.includes('men')) return false;
    }

    // 2. Search Query Filter
    if (q) {
      const title = (p.title || '').toLowerCase();
      const titleEn = (p.titleEn || '').toLowerCase();
      const overview = (p.overview || '').toLowerCase();
      const overviewEn = (p.overviewEn || '').toLowerCase();
      const opening = (p.opening || '').toLowerCase();
      const heart = (p.heart || '').toLowerCase();
      const base = (p.base || '').toLowerCase();
      const prominent = (p.prominent || '').toLowerCase();

      const matches = title.includes(q) || titleEn.includes(q) ||
        overview.includes(q) || overviewEn.includes(q) ||
        opening.includes(q) || heart.includes(q) ||
        base.includes(q) || prominent.includes(q);

      if (!matches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border-radius: var(--radius-md); border: 1px dashed var(--border);">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 12px;">🔍</span>
        <h3 style="font-family: 'Amiri', serif; font-size: 1.5rem; color: var(--espresso); margin-bottom: 8px;">
          ${t.searchFilterNoResults || 'لم يتم العثور على عطور تطابق معايير البحث'}
        </h3>
        <p style="color: var(--espresso-dim); font-size: 0.9rem;">
          ${currentLang === 'ar' ? 'يرجى تجربة كلمة بحث أخرى أو إعادة ضبط التصفية.' : 'Try adjusting your search terms or clearing the filter.'}
        </p>
      </div>
    `;
    return;
  }

  // Consistent category ordering: Perfumes -> Bundles -> Bakhoor -> Oils (preserving original catalog order)
  const catPriority = { 'perfume': 1, 'bundle': 2, 'bakhoor': 3, 'oil': 4 };
  filtered.sort((a, b) => (catPriority[a.categoryType] || 99) - (catPriority[b.categoryType] || 99));

  // Category section definitions
  const SECTION_CONFIGS = [
    {
      key: 'perfume',
      icon: '💎',
      title: t.secPerfumesTitle || 'العطور الفاخرة والنخبة الملكية',
      desc: t.secPerfumesDesc || 'تشكيلة استثنائية من أرقى العطور الشرقية والفرنسية الملكية بفوحان آسر وثبات طويل',
      unitAr: 'عطراً',
      unitEn: 'perfumes',
      match: (p) => p.categoryType === 'perfume' || (!p.categoryType && !p.id.startsWith('bundle-') && !p.id.startsWith('package-') && !p.id.startsWith('bakhoor-') && !p.id.startsWith('oil-'))
    },
    {
      key: 'bundle',
      icon: '🎁',
      title: t.secBundlesTitle || 'باقات الإهداء والباكجات ومجموعات التراث',
      desc: t.secBundlesDesc || 'صناديق ديوراما فخمة ومجموعات إهداء استثنائية تحتفي بالأصالة والتراث الرفيع',
      unitAr: 'باقة ومجموعة',
      unitEn: 'bundles & sets',
      match: (p) => p.categoryType === 'bundle'
    },
    {
      key: 'bakhoor',
      icon: '🪵',
      title: t.secBakhoorTitle || 'البخور والمعمول والمباخر الفاخرة',
      desc: t.secBakhoorDesc || 'أجود أنواع العود الملكي، المبثوث، والمعمول التراثي لتعطير المجالس والمناسبات',
      unitAr: 'صنفاً',
      unitEn: 'items',
      match: (p) => p.categoryType === 'bakhoor'
    },
    {
      key: 'oil',
      icon: '💧',
      title: t.secOilsTitle || 'الزيوت العطرية والتولات الملكية (15 مل)',
      desc: t.secOilsDesc || 'تولات نقية مركزة خالية من الكحول بروائح المسك، الرمان، الفواكه والزهور',
      unitAr: 'تولة',
      unitEn: 'tolas',
      match: (p) => p.categoryType === 'oil'
    }
  ];

  // If viewing all products without search: render distinct luxury sections
  if (filter === 'all' && !q) {
    let sectionsHtml = '';

    SECTION_CONFIGS.forEach(sec => {
      const secItems = filtered.filter(p => sec.match(p));
      if (secItems.length === 0) return;

      const unit = currentLang === 'ar' ? sec.unitAr : sec.unitEn;

      sectionsHtml += `
        <div class="category-section-block" id="section-${sec.key}" style="grid-column: 1 / -1; width: 100%;">
          <div class="ghalati-section-header">
            <h2 class="ghalati-section-title">${sec.title}</h2>
            <div class="ghalati-title-divider">
              <span class="ghalati-divider-line"></span>
              <span class="ghalati-divider-box"></span>
              <span class="ghalati-divider-line"></span>
            </div>
            <p class="ghalati-section-desc">${sec.desc} (${secItems.length} ${unit})</p>
          </div>
          <div class="catalog-grid">
            ${secItems.map(p => renderProductCard(p, t)).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = sectionsHtml;
  } else {
    // When a specific filter is active or search is performed
    const activeSec = SECTION_CONFIGS.find(s => s.key === filter || (filter === 'bundles' && s.key === 'bundle') || (filter === 'perfumes' && s.key === 'perfume') || (filter === 'oils' && s.key === 'oil') || (filter === 'bakhoor' && s.key === 'bakhoor'));

    let headerHtml = '';
    if (activeSec) {
      const unit = currentLang === 'ar' ? activeSec.unitAr : activeSec.unitEn;
      headerHtml = `
        <div class="ghalati-section-header" style="grid-column: 1 / -1; width: 100%;">
          <h2 class="ghalati-section-title">${activeSec.title}</h2>
          <div class="ghalati-title-divider">
            <span class="ghalati-divider-line"></span>
            <span class="ghalati-divider-box"></span>
            <span class="ghalati-divider-line"></span>
          </div>
          <p class="ghalati-section-desc">${activeSec.desc} (${filtered.length} ${unit})</p>
        </div>
      `;
    }

    container.innerHTML = headerHtml + filtered.map(p => renderProductCard(p, t)).join('');
  }
}

function renderProductCard(p, t) {
  const isAr = currentLang === 'ar';
  const title = isAr ? p.title : p.titleEn;
  const prices = getProductPrices(p);
  const imgSrc = p.image || p.originalImage;
  const isWishlisted = isInWishlist(p.id);
  const isOut = p.isAvailable === false || p.status === 'out';
  const isNotified = isOut && isInNotifyList(p.id);

  let badgeHtml = '';
  let outSashHtml = '';

  if (isOut) {
    const outLabel = p.promotionTitle === 'يتوفر قريباً'
      ? (isAr ? '⏳ يتوفر قريباً' : '⏳ Coming Soon')
      : (isAr ? 'نفذت الكمية' : 'Out of Stock');
    badgeHtml = `
      <span class="product-badge-offer badge-out-of-stock">
        <span class="badge-out-dot"></span>
        <span>${outLabel}</span>
      </span>
    `;
    outSashHtml = `
      <div class="product-out-sash">
        <span>${isAr ? 'غير متوفر حالياً' : 'Currently Unavailable'}</span>
      </div>
    `;
  } else if (p.promotionTitle || prices.hasDiscount) {
    const promoLabel = isAr
      ? (p.promotionTitle || t.limitedTimeOffer || 'عرض لفترة محدودة')
      : (t.limitedTimeOffer || 'Limited Time Offer');
    badgeHtml = `<span class="product-badge-offer">${promoLabel}</span>`;
  }

  const actionBtnHtml = isOut
    ? `
      <button type="button" class="product-card-add-btn btn-notify-available ${isNotified ? 'notified-active' : ''}" onclick="event.stopPropagation(); toggleNotifyWhenAvailable('${p.id}', this)">
        ${isNotified ? `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>${isAr ? 'سنبلغك فور التوفر' : 'Alert Activated'}</span>
        ` : `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span>${isAr ? 'أبلغني عند التوفر' : 'Notify When Available'}</span>
        `}
      </button>
    `
    : `
      <button type="button" class="product-card-add-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span>${t.addToCartText || (isAr ? 'أضف إلى السلة' : 'Add to Cart')}</span>
      </button>
    `;

  return `
    <article class="product-card ${isOut ? 'product-card-out' : ''}" data-id="${p.id}">
      <div class="product-card-image-wrap" onclick="openProductModal('${p.id}')" title="${isAr ? 'عرض تفاصيل وهرم العطر' : 'View perfume details & notes'}">
        ${badgeHtml}
        ${outSashHtml}

        <!-- صورة القالب الملكي للعطر -->
        <img src="${imgSrc}" alt="${title} - دار غلاتي" class="product-card-image" loading="lazy">

        <!-- أزرار المعاينة السريعة والمفضلة بالمنتصف عند التحويم -->
        <div class="product-card-hover-actions">
          <button type="button" class="btn-hover-action btn-hover-quickview" onclick="event.stopPropagation(); openProductModal('${p.id}')" title="${t.quickViewText || (isAr ? 'عرض التفاصيل' : 'Quick View')}" aria-label="${t.quickViewText || (isAr ? 'عرض التفاصيل' : 'Quick View')}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button type="button" class="btn-hover-action btn-hover-wishlist ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist('${p.id}', this)" title="${t.wishlistText || (isAr ? 'إضافة للمفضلة' : 'Wishlist')}" aria-label="${t.wishlistText || (isAr ? 'إضافة للمفضلة' : 'Wishlist')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#e53935' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>

        ${actionBtnHtml}
      </div>

      <!-- معلومات وسعر العطر بالمنتصف بدقة وتناسق -->
      <div class="product-card-info">
        <h3 class="product-card-title" onclick="openProductModal('${p.id}')">${title}</h3>
        <div class="product-card-prices">
          <span class="product-price-sale">${prices.saleStr}</span>
          ${prices.hasDiscount ? `<span class="product-price-old">${prices.origStr}</span>` : ''}
        </div>
        ${isOut ? `<span class="product-info-out-tag">${isAr ? '● غير متوفر حالياً' : '● Out of Stock'}</span>` : ''}
      </div>
    </article>
  `;
}

function getCategoryBadgeText(p) {
  const t = translations[currentLang] || translations.ar;
  if (p.categoryType === 'oil' || (p.specs?.type || '').includes('زيت') || (p.specs?.type || '').includes('تولة')) {
    return currentLang === 'ar' ? 'تولة زيت عطري' : 'Perfume Oil';
  }
  if (p.categoryType === 'bakhoor' || (p.specs?.type || '').includes('بخور') || (p.specs?.type || '').includes('معمول')) {
    return currentLang === 'ar' ? 'بخور ومعمول' : 'Bakhoor';
  }
  if (p.categoryType === 'bundle' || (p.specs?.type || '').includes('باقة') || (p.specs?.type || '').includes('طقم') || (p.specs?.type || '').includes('مجموعة')) {
    return currentLang === 'ar' ? 'باقة إهداء' : 'Gift Set';
  }
  const cat = (p.specs?.category || '').toLowerCase();
  if (cat.includes('نسائي') || cat.includes('women')) return t.badgeWomen || 'نسائي';
  if (cat.includes('رجالي') || cat.includes('men')) return t.badgeMen || 'رجالي';
  return t.badgeUnisex || 'للجنسين';
}

// ── Native Luxury Product Page View ──
function openProductModal(id) {
  const p = perfumesData.find(item => item.id === id);
  if (!p) return;

  activeModalPerfume = p;
  renderProductModalContent(p);

  const hero = document.getElementById('heroSection');
  const catalog = document.getElementById('catalog');
  const prodSection = document.getElementById('productPageSection');

  if (hero) hero.style.display = 'none';
  if (catalog) catalog.style.display = 'none';
  if (prodSection) prodSection.style.display = 'block';

  const breadcrumbTitle = document.getElementById('productBreadcrumbTitle');
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = currentLang === 'ar' ? p.title : p.titleEn;
  }

  const backText = document.getElementById('productPageBackText');
  if (backText) {
    const t = translations[currentLang] || translations.ar;
    backText.textContent = t.backToCatalog || (currentLang === 'ar' ? 'الرجوع للكتالوج' : 'Back to Catalog');
  }

  // Smooth scroll to top of window so standard store header and navbar are visible at top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (window.location.hash !== `#product/${id}`) {
    history.pushState({ productId: id }, '', `#product/${id}`);
  }
}

function closeProductModal() {
  const hero = document.getElementById('heroSection');
  const catalog = document.getElementById('catalog');
  const prodSection = document.getElementById('productPageSection');

  if (prodSection) prodSection.style.display = 'none';
  if (hero) hero.style.display = '';
  if (catalog) catalog.style.display = '';

  const prevPerfumeId = activeModalPerfume ? activeModalPerfume.id : null;
  activeModalPerfume = null;

  if (window.location.hash.startsWith('#product')) {
    history.pushState(null, '', '#catalog');
  }

  if (prevPerfumeId) {
    const card = document.querySelector(`.product-card[data-id="${prevPerfumeId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  }
  const catalogEl = document.getElementById('catalog');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth' });
  }
}

function renderProductModalContent(p) {
  const container = document.getElementById('productModalContent');
  if (!container) return;

  const t = translations[currentLang] || translations.ar;
  const title = currentLang === 'ar' ? p.title : p.titleEn;
  const overview = currentLang === 'ar' ? p.overview : (p.overviewEn || p.overview);
  const opening = currentLang === 'ar' ? p.opening : (p.openingEn || p.opening);
  const heart = currentLang === 'ar' ? p.heart : (p.heartEn || p.heart);
  const base = currentLang === 'ar' ? p.base : (p.baseEn || p.base);
  const prominent = currentLang === 'ar' ? p.prominent : (p.prominentEn || p.prominent);

  const specs = currentLang === 'ar' ? p.specs : (p.specsEn || p.specs);

  const convertedPrice = (p.finalJod * activeCurrency.rate).toFixed(2);
  const currSymbol = currentLang === 'ar' ? activeCurrency.symbol : activeCurrency.symbolEn;
  const waText = encodeURIComponent(
    currentLang === 'ar'
      ? `مرحبا، أود طلب عطر "${p.title}" من دار غلاتي بسعر ${convertedPrice} ${currSymbol} من متجر زهرة بيسان`
      : `Hello, I would like to order "${p.titleEn}" from Ghalati House at ${convertedPrice} ${currSymbol} via Zahrat Beesan`
  );
  const waLink = `https://wa.me/962796697413?text=${waText}`;

  // Gallery items: 1) Master Podium Showcase, 2) Bottle & Luxury Box, 3) Pure Flacon cutout, 4) Fragrantica Pyramid Card, 5) Distinct lifestyle
  const galleryItems = [];
  const seenUrls = new Set();

  const addGalleryItem = (src, label, isFlacon = false) => {
    if (!src || seenUrls.has(src)) return;
    // Strict purge of duplicate bottle images with the red bird watermark
    if (src.includes('social.') || src.includes('/perfume/social')) return;
    seenUrls.add(src);
    galleryItems.push({ src, label, isFlacon });
  };

  // 1. Master Podium Showcase (Main store visual)
  if (p.image) {
    addGalleryItem(p.image, t.quickViewShowcase || 'العرض الملكي', false);
  }

  // 2. Bottle with Luxury Box / Carton (Fragrantica secundar or official brand packaging)
  if (p.boxImage) {
    addGalleryItem(p.boxImage, t.quickViewBox || 'العطر مع العلبة الفاخرة', false);
  }

  // 3. Pure Flacon Official Studio Image (High-res Ghalati white-background bottle)
  const cleanBottleUrl = p.bottleUrl ? p.bottleUrl.replace(/\/[a-f0-9-]+-\d+x[\d.]+-/, '/') : '';
  const flaconSrc = cleanBottleUrl || p.originalImage || p.fragranticaBottle;
  if (flaconSrc && flaconSrc !== p.image && flaconSrc !== p.boxImage) {
    addGalleryItem(flaconSrc, t.quickViewFlacon || 'الزجاجة الصافية', true);
  }

  // 4. Fragrance Pyramid & Accords Card
  if (p.fragranticaCard) {
    addGalleryItem(p.fragranticaCard, t.quickViewCard || 'بطاقة الهرم العطري والمكونات', false);
  }

  // 5. Authentic Extra Lifestyle / Ingredients (Strictly deduplicated, filtering out duplicate bottles/cards)
  if (p.galleryImages && Array.isArray(p.galleryImages)) {
    p.galleryImages.forEach((imgUrl, idx) => {
      if (!imgUrl || seenUrls.has(imgUrl)) return;
      if (imgUrl === p.fragranticaBottle || imgUrl === p.bottleUrl || imgUrl === p.originalImage) return;
      if (imgUrl.includes('/perfume/o.') || imgUrl.includes('perfume-social-cards') || imgUrl.includes('social.')) return;
      if (imgUrl.includes('500x500') || imgUrl.includes('100x100') || imgUrl.includes('lsSRUDFXv00bFNJa4GiHjtn4Y9KTDd1SCrksaoPn')) return;

      let label = `${currentLang === 'ar' ? 'إطلالة إضافية' : 'Extra View'} ${galleryItems.length + 1}`;
      if (imgUrl.includes('secundar')) {
        label = t.quickViewBox || 'العطر مع العلبة الفاخرة';
      }
      addGalleryItem(imgUrl, label, false);
    });
  }

  // Save gallery items & official clean white-background bottle URL for Ghalati-style Lightbox
  window.__activeGalleryItems = galleryItems;
  window.__activeGalleryIndex = 0;
  window.__activeGalleryTitle = title;
  window.__activeCleanBottleUrl = cleanBottleUrl || p.image;

  // Helper for chip tags
  const renderChips = (text, isProminent = false) => {
    if (!text) return '';
    return text.split(/،|,/).map(item => item.trim()).filter(Boolean).map(note => `
      <span class="pyramid-chip ${isProminent ? 'pyramid-chip-prominent' : ''}">${note}</span>
    `).join('');
  };

  container.innerHTML = `
    <div class="product-modal-grid">
      
      <!-- العمود الأيسر: معرض الصور التفاعلي -->
      <div class="modal-gallery-pane">
        <div class="modal-main-img-box" id="modalMainImageBox" onclick="openLuxuryLightbox(window.__activeGalleryIndex || 0)">
          <img src="${p.image}" alt="${title}" id="modalMainImg" loading="lazy" draggable="false">
          <span class="modal-gallery-badge" id="modalGalleryBadge">${t.quickViewShowcase}</span>
        </div>

        <div class="modal-thumbs-row">
          ${galleryItems.map((item, idx) => `
            <button type="button" class="modal-thumb-btn ${idx === 0 ? 'active-thumb' : ''}" 
              onclick="switchModalImage('${item.src}', ${item.isFlacon}, '${item.label}', this, ${idx})"
              title="${item.label}">
              <img src="${item.src}" alt="${item.label}">
            </button>
          `).join('')}
        </div>

        <div class="modal-guarantee-seal">
          <span style="font-size: 1.8rem;">🛡️</span>
          <div>
            <strong style="display: block; font-size: 0.88rem; color: var(--espresso); margin-bottom: 2px;">
              ${t.modalGuaranteeTitle}
            </strong>
            <p style="font-size: 0.8rem; color: var(--espresso-dim); line-height: 1.5; margin: 0;">
              ${t.modalGuaranteeText}
            </p>
          </div>
        </div>
      </div>

      <!-- العمود الأيمن: البيانات الرسمية المعتمدة بالملي، الهرم العطري، والمواصفات -->
      <div class="modal-details-pane">
        <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px;">
          <span class="modal-house-badge" style="margin-bottom: 0;">🌟 دار غلاتي • Ghalati Parfums (السعودية)</span>
          ${p.fragranticaUrl ? `
            <a href="${p.fragranticaUrl}" target="_blank" rel="noopener noreferrer" class="modal-fragrantica-link" title="${currentLang === 'ar' ? 'عرض توثيق وتقييم العطر على موسوعة فراجرانتيكا العالمية' : 'View global perfume profile on Fragrantica'}">
              <span>🌐</span>
              <span>${currentLang === 'ar' ? 'موثق في Fragrantica العالمية' : 'Official on Fragrantica'}</span>
              <span class="fragrantica-arrow">↗</span>
            </a>
          ` : ''}
        </div>
        <h2 class="modal-title-ar">${p.title}</h2>
        <span class="modal-title-en">${p.titleEn}</span>

        <!-- بطاقة السعر المحول بالمعادلة المعتمدة والمحدثة لحظياً -->
        <div class="modal-price-box">
          <div>
            <span style="font-size: 0.82rem; color: var(--espresso-dim); display: block; margin-bottom: 4px;">${t.retailPrice}</span>
            <div style="display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;">
              <strong class="modal-price-val" style="color: #d32f2f;">${getProductPrices(p).saleStr}</strong>
              ${getProductPrices(p).hasDiscount ? `<span style="font-size: 1.1rem; color: #666; text-decoration: line-through; font-weight: 600;">${getProductPrices(p).origStr}</span>` : ''}
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
            <span style="background: rgba(197, 168, 128, 0.18); border: 1px solid rgba(197, 168, 128, 0.4); padding: 5px 12px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 800; color: var(--gold-dim);">
              ${getCategoryBadgeText(p)}
            </span>
            <span style="font-size: 0.76rem; font-weight: 800; padding: 3px 10px; border-radius: var(--radius-full); ${(p.isAvailable === false || p.status === 'out') ? 'background: rgba(211,47,47,0.12); color: #d32f2f;' : 'background: rgba(22,163,74,0.12); color: #16a34a;'}">
              ${(p.isAvailable === false || p.status === 'out') ? (currentLang === 'ar' ? '🔴 نفذت الكمية' : '🔴 Out of Stock') : (currentLang === 'ar' ? '🟢 متوفر الآن' : '🟢 In Stock')}
            </span>
          </div>
        </div>

        <!-- قصة ووصف العطر الرسمية بالملي -->
        <p class="modal-overview-text">
          ${overview}
        </p>

        <!-- الهرم العطري الملكي (افتتاحية، قلب، قاعدة، روائح بارزة) -->
        <h3 class="modal-section-title">
          <span>🏛️</span>
          <span>${currentLang === 'ar' ? 'الهرم العطري الملكي' : 'Royal Olfactory Pyramid'}</span>
        </h3>
        <div class="modal-pyramid-card">
          <div class="pyramid-tier">
            <span class="pyramid-tier-label">🌿 ${t.modalTopNotes}:</span>
            <div class="pyramid-chips-row">${renderChips(opening)}</div>
          </div>
          <div class="pyramid-tier">
            <span class="pyramid-tier-label">🌸 ${t.modalHeartNotes}:</span>
            <div class="pyramid-chips-row">${renderChips(heart)}</div>
          </div>
          <div class="pyramid-tier">
            <span class="pyramid-tier-label">🪵 ${t.modalBaseNotes}:</span>
            <div class="pyramid-chips-row">${renderChips(base)}</div>
          </div>
          <div class="pyramid-tier">
            <span class="pyramid-tier-label">✨ ${t.modalProminentNotes}:</span>
            <div class="pyramid-chips-row">${renderChips(prominent, true)}</div>
          </div>
        </div>

        <!-- المواصفات الفنية المعتمدة -->
        <h3 class="modal-section-title">
          <span>📋</span>
          <span>${t.modalSpecs}</span>
        </h3>
        <div class="modal-specs-table">
          <div class="modal-spec-row">
            <span class="modal-spec-label">${t.modalSize}:</span>
            <strong class="modal-spec-val">${specs?.size || '100 مل'}</strong>
          </div>
          <div class="modal-spec-row">
            <span class="modal-spec-label">${t.modalCategory}:</span>
            <strong class="modal-spec-val">${specs?.category || 'للجنسين'}</strong>
          </div>
          <div class="modal-spec-row">
            <span class="modal-spec-label">${t.modalOrigin}:</span>
            <strong class="modal-spec-val">${specs?.origin || 'المملكة العربية السعودية'}</strong>
          </div>
          <div class="modal-spec-row">
            <span class="modal-spec-label">${t.modalType}:</span>
            <strong class="modal-spec-val">${specs?.type || 'عطر فاخر'}</strong>
          </div>
          ${specs?.perfumer ? `
            <div class="modal-spec-row">
              <span class="modal-spec-label">${t.modalPerfumer}:</span>
              <strong class="modal-spec-val">${specs.perfumer}</strong>
            </div>
          ` : ''}
        </div>

        <!-- أزرار الإجراءات الفورية -->
        <div class="modal-actions-grid">
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-order-whatsapp" style="padding: 12px 18px; font-size: 0.9rem;">
            <span>💬</span>
            <span>${t.btnInstantWhatsApp}</span>
          </a>
          ${(p.isAvailable === false || p.status === 'out') ? `
            <button type="button" class="btn-add-cart" onclick="toggleNotifyWhenAvailable('${p.id}', this)" style="padding: 12px 18px; font-size: 0.9rem; background: ${isInNotifyList(p.id) ? '#2e5a44' : '#3a3232'}; color: #fff; border-color: transparent;">
              <span>${isInNotifyList(p.id) ? '✅' : '🔔'}</span>
              <span>${isInNotifyList(p.id) ? (currentLang === 'ar' ? 'سنبلغك فور التوفر' : 'Alert Activated') : (currentLang === 'ar' ? 'أبلغني عند التوفر' : 'Notify When Available')}</span>
            </button>
          ` : `
            <button type="button" class="btn-add-cart" onclick="addToCart('${p.title}')" style="padding: 12px 18px; font-size: 0.9rem;">
              <span>🛍️</span>
              <span>${t.btnAddToCart}</span>
            </button>
          `}
        </div>

        <!-- رابط التحقق في المصدر الأصلي -->
        <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="modal-source-link">
          <span>🔗</span>
          <span>${t.modalOfficialSource}</span>
        </a>

        <!-- زر الرجوع للكتالوج في أسفل الصفحة -->
        <div style="margin-top: 20px;">
          <button type="button" class="btn-back-to-catalog" onclick="closeProductModal()" style="width: 100%; justify-content: center; padding: 13px 26px; font-size: 0.96rem;">
            <span class="back-btn-arrow">&#8594;</span>
            <span data-i18n="backToCatalog">${t.backToCatalog || (currentLang === 'ar' ? 'الرجوع للكتالوج' : 'Back to Catalog')}</span>
          </button>
        </div>

      </div>

    </div>
  `;
}

function switchModalImage(src, isFlacon, label, btnEl, idx = 0) {
  window.__activeGalleryIndex = idx;
  const mainImg = document.getElementById('modalMainImg');
  const badge = document.getElementById('modalGalleryBadge');
  if (mainImg) {
    mainImg.src = src;
    const isContain = isFlacon || 
                      src.includes('secundar') || 
                      src.includes('perfume-social-cards') || 
                      src.includes('pyramid_') || 
                      src.includes('card_') || 
                      src.endsWith('.png') ||
                      src.includes('800.0') ||
                      src.includes('1000x1000');
    if (isContain) {
      mainImg.classList.add('clean-flacon');
    } else {
      mainImg.classList.remove('clean-flacon');
    }
  }
  if (badge) {
    badge.textContent = label;
  }
  document.querySelectorAll('.modal-thumb-btn').forEach(b => b.classList.remove('active-thumb'));
  if (btnEl) btnEl.classList.add('active-thumb');
}

// ── Clean Ghalati Lightbox Controller (Exact Match to Official Store) ──
let lightboxState = { isOpen: false, index: 0, scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0, moved: false, pinchStartDist: 0, pinchStartScale: 1 };

function ensureLuxuryLightboxDOM() {
  let lb = document.getElementById('luxuryImageLightbox');
  if (lb) return lb;

  lb = document.createElement('div');
  lb.id = 'luxuryImageLightbox';
  lb.className = 'ghalati-clean-lightbox';
  lb.style.display = 'none';
  lb.innerHTML = `
    <div class="ghalati-lb-top-actions" onclick="event.stopPropagation()">
      <button type="button" class="ghalati-lb-icon-btn" onclick="closeLuxuryLightbox()" title="إغلاق" aria-label="Close">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <button type="button" class="ghalati-lb-icon-btn" onclick="toggleLightboxFullscreen()" title="ملء الشاشة" aria-label="Fullscreen">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
        </svg>
      </button>
    </div>

    <div class="ghalati-lb-stage" id="luxuryLightboxStage">
      <div class="ghalati-lb-card" id="luxuryLightboxImgWrap">
        <img src="" alt="" id="luxuryLightboxImg" draggable="false">
      </div>
    </div>
  `;
  document.body.appendChild(lb);

  const stage = lb.querySelector('#luxuryLightboxStage');
  const card = lb.querySelector('#luxuryLightboxImgWrap');
  const img = lb.querySelector('#luxuryLightboxImg');

  // Wheel zoom
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.35 : -0.35;
    lightboxZoomStep(delta);
  }, { passive: false });

  // Pointer down / drag / click-to-zoom / click-backdrop-to-close
  stage.addEventListener('pointerdown', (e) => {
    lightboxState.isDragging = true;
    lightboxState.moved = false;
    lightboxState.startX = e.clientX - lightboxState.x;
    lightboxState.startY = e.clientY - lightboxState.y;
    card.style.transition = 'none';
  });

  stage.addEventListener('pointermove', (e) => {
    if (!lightboxState.isDragging) return;
    const dx = e.clientX - (lightboxState.startX + lightboxState.x);
    const dy = e.clientY - (lightboxState.startY + lightboxState.y);
    if (Math.hypot(dx, dy) > 6) {
      lightboxState.moved = true;
    }
    if (lightboxState.scale > 1) {
      const maxPanX = window.innerWidth * 0.4 * (lightboxState.scale - 1);
      const maxPanY = window.innerHeight * 0.4 * (lightboxState.scale - 1);
      lightboxState.x = Math.max(-maxPanX, Math.min(maxPanX, e.clientX - lightboxState.startX));
      lightboxState.y = Math.max(-maxPanY, Math.min(maxPanY, e.clientY - lightboxState.startY));
      applyLightboxTransform();
    }
  });

  stage.addEventListener('pointerup', (e) => {
    if (!lightboxState.isDragging) return;
    const wasMoved = lightboxState.moved;
    lightboxState.isDragging = false;
    card.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)';

    if (!wasMoved) {
      // Clicked outside the white card -> close lightbox
      if (e.target === stage) {
        closeLuxuryLightbox();
      } else {
        // Clicked on the image card -> toggle clean zoom (1x <-> 2x)
        if (lightboxState.scale > 1.05) {
          lightboxResetZoom();
        } else {
          lightboxState.scale = 2;
          applyLightboxTransform();
        }
      }
    }
  });

  // Touch Pinch-to-Zoom for mobile
  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      lightboxState.isDragging = false;
      lightboxState.pinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lightboxState.pinchStartScale = lightboxState.scale;
    }
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && lightboxState.pinchStartDist > 0) {
      e.preventDefault();
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = d / lightboxState.pinchStartDist;
      lightboxState.scale = Math.min(4, Math.max(1, +(lightboxState.pinchStartScale * ratio).toFixed(2)));
      if (lightboxState.scale === 1) {
        lightboxState.x = 0;
        lightboxState.y = 0;
      }
      applyLightboxTransform();
    }
  }, { passive: false });

  return lb;
}

function toggleLightboxFullscreen() {
  const lb = document.getElementById('luxuryImageLightbox');
  if (!lb) return;
  if (!document.fullscreenElement) {
    lb.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

function applyLightboxTransform() {
  const card = document.getElementById('luxuryLightboxImgWrap');
  const stage = document.getElementById('luxuryLightboxStage');
  if (!card) return;
  if (lightboxState.scale <= 1.01) {
    lightboxState.scale = 1;
    lightboxState.x = 0;
    lightboxState.y = 0;
  }
  card.style.transform = `translate3d(${lightboxState.x}px, ${lightboxState.y}px, 0) scale(${lightboxState.scale})`;
  if (stage) stage.classList.toggle('is-zoomed', lightboxState.scale > 1);
}

function lightboxZoomStep(delta) {
  lightboxState.scale = Math.min(4, Math.max(1, +(lightboxState.scale + delta).toFixed(2)));
  if (lightboxState.scale === 1) {
    lightboxState.x = 0;
    lightboxState.y = 0;
  }
  applyLightboxTransform();
}

function lightboxResetZoom() {
  lightboxState.scale = 1;
  lightboxState.x = 0;
  lightboxState.y = 0;
  applyLightboxTransform();
}

function renderLightboxView() {
  const items = window.__activeGalleryItems || [];
  if (!items.length) return;
  const idx = ((lightboxState.index % items.length) + items.length) % items.length;
  lightboxState.index = idx;
  const item = items[idx];

  // When clicking the main showcase image (idx === 0), display the official pure bottle on white background (exact match to Ghalati)
  const displaySrc = (idx === 0 && window.__activeCleanBottleUrl) ? window.__activeCleanBottleUrl : item.src;

  const imgEl = document.getElementById('luxuryLightboxImg');
  if (imgEl) {
    imgEl.src = displaySrc;
    imgEl.alt = item.label || '';
  }
  lightboxResetZoom();
}

function openLuxuryLightbox(index = 0) {
  const lb = ensureLuxuryLightboxDOM();
  lightboxState.isOpen = true;
  lightboxState.index = index;
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  renderLightboxView();
}

function closeLuxuryLightbox() {
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
  const lb = document.getElementById('luxuryImageLightbox');
  if (lb) lb.style.display = 'none';
  lightboxState.isOpen = false;
  document.body.style.overflow = '';
}

function lightboxStepImage(dir) {
  const items = window.__activeGalleryItems || [];
  if (items.length <= 1) return;
  lightboxState.index = ((lightboxState.index + dir) % items.length + items.length) % items.length;
  renderLightboxView();
}

// ── Modals Controller ──
function openShippingModal() {
  const modal = document.getElementById('shippingModal');
  if (modal) modal.style.display = 'flex';
}

function closeShippingModal() {
  const modal = document.getElementById('shippingModal');
  if (modal) modal.style.display = 'none';
}

function openCurrencyModal() {
  const modal = document.getElementById('currencyModal');
  if (modal) {
    renderCurrencyList();
    modal.style.display = 'flex';
  }
}

function closeCurrencyModal() {
  const modal = document.getElementById('currencyModal');
  if (modal) modal.style.display = 'none';
}

function renderCurrencyList() {
  const container = document.getElementById('currencyListContainer');
  if (!container) return;

  container.innerHTML = CURRENCIES.map(c => `
    <button type="button" class="country-option-btn ${c.code === activeCurrency.code ? 'active-country' : ''}" onclick="setCurrency('${c.code}')">
      <img src="${getFlagUrl(c.iso)}" class="currency-flag-img" alt="${c.nameEn}">
      <span style="flex:1; text-align: ${currentLang === 'ar' ? 'right' : 'left'};">
        ${currentLang === 'ar' ? c.nameAr : c.nameEn}
      </span>
      <strong style="color: var(--gold-dim);">${c.code} (${currentLang === 'ar' ? c.symbol : c.symbolEn})</strong>
    </button>
  `).join('');
}

// Close modals when clicking outside or pressing Escape
window.addEventListener('click', (e) => {
  const shippingModal = document.getElementById('shippingModal');
  if (shippingModal && e.target === shippingModal) {
    closeShippingModal();
  }

  const currencyModal = document.getElementById('currencyModal');
  if (currencyModal && e.target === currencyModal) {
    closeCurrencyModal();
  }
});

window.addEventListener('keydown', (e) => {
  if (lightboxState.isOpen) {
    if (e.key === 'Escape') {
      closeLuxuryLightbox();
      return;
    }
    if (e.key === '+' || e.key === '=') {
      lightboxZoomStep(0.45);
      return;
    }
    if (e.key === '-' || e.key === '_') {
      lightboxZoomStep(-0.45);
      return;
    }
    if (e.key === '0') {
      lightboxResetZoom();
      return;
    }
    if (e.key === 'ArrowRight') {
      lightboxStepImage(currentLang === 'ar' ? -1 : 1);
      return;
    }
    if (e.key === 'ArrowLeft') {
      lightboxStepImage(currentLang === 'ar' ? 1 : -1);
      return;
    }
  }
  if (e.key === 'Escape') {
    closeProductModal();
    closeCurrencyModal();
    closeShippingModal();
  }
});

// Browser Back / Forward History support for full product page
window.addEventListener('popstate', (e) => {
  const hash = window.location.hash;
  if (hash.startsWith('#product/')) {
    const id = hash.replace('#product/', '');
    if (id) {
      const p = perfumesData.find(item => item.id === id);
      if (p) openProductModal(id);
    }
  } else if (activeModalPerfume) {
    closeProductModal();
  }
});

// ── Cart & Direct Actions ──
function addToCart(idOrName) {
  cartItemsCount++;
  const badge = document.getElementById('cartCountBadge');
  if (badge) {
    badge.textContent = cartItemsCount;
    badge.style.transform = 'scale(1.25)';
    setTimeout(() => badge.style.transform = 'scale(1)', 250);
  }

  const p = (typeof perfumesData !== 'undefined' ? perfumesData : []).find(
    item => item.id === idOrName || item.title === idOrName || item.titleEn === idOrName
  );
  const displayName = p ? (currentLang === 'ar' ? p.title : p.titleEn) : idOrName;

  const msg = currentLang === 'ar'
    ? `تم إضافة "${displayName}" إلى السلة بنجاح`
    : `"${displayName}" was added to your shopping cart`;
  showNotification(msg, '🛍️');
}

function handleNewsletter(e) {
  e.preventDefault();
  const input = document.getElementById('newsletterEmail');
  if (!input || !input.value.trim()) return;

  const msg = currentLang === 'ar'
    ? 'شكراً لاشتراكك في النشرة الملكية لدار زهرة بيسان!'
    : 'Thank you for subscribing to Zahrat Beesan Royal Newsletter!';
  showNotification(msg, '👑');
  input.value = '';
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('zb_perfumes_lang') || 'ar';
  const savedCurrency = localStorage.getItem('zb_perfumes_currency') || 'JOD';

  const foundCurr = CURRENCIES.find(c => c.code === savedCurrency);
  if (foundCurr) activeCurrency = foundCurr;

  setLanguage(savedLang);

  // Search input live filtering
  const searchInput = document.getElementById('mainSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      if (activeModalPerfume) {
        closeProductModal();
      }
      currentSearch = e.target.value.trim();
      renderCatalog(currentFilter, currentSearch);
    });
  }

  loadCatalog();
});
