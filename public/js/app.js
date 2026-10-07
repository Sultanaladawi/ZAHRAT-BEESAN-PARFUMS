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

  if (activeModalPerfume) {
    renderProductModalContent(activeModalPerfume);
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

// ── Catalog Data & Rendering ──
async function loadCatalog() {
  try {
    const res = await fetch('data/perfumes.json');
    if (res.ok) {
      perfumesData = await res.json();
    } else {
      console.warn('Failed to load perfumes.json via fetch, using fallback.');
    }
  } catch (err) {
    console.error('Error fetching perfumes catalog:', err);
  }

  renderCatalog(currentFilter, currentSearch);
}

function filterCatalog(category, btnElement) {
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

  // Consistent category ordering: Perfumes -> Bundles -> Bakhoor -> Oils
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
          <div class="category-section-header">
            <div class="category-section-title-wrap">
              <span class="category-section-icon">${sec.icon}</span>
              <h2 class="category-section-title">${sec.title}</h2>
              <span class="category-section-count">${secItems.length} ${unit}</span>
            </div>
            <p class="category-section-subtitle">${sec.desc}</p>
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
        <div class="category-section-header" style="grid-column: 1 / -1; width: 100%;">
          <div class="category-section-title-wrap">
            <span class="category-section-icon">${activeSec.icon}</span>
            <h2 class="category-section-title">${activeSec.title}</h2>
            <span class="category-section-count">${filtered.length} ${unit}</span>
          </div>
          <p class="category-section-subtitle">${activeSec.desc}</p>
        </div>
      `;
    }

    container.innerHTML = headerHtml + filtered.map(p => renderProductCard(p, t)).join('');
  }
}

function renderProductCard(p, t) {
  const title = currentLang === 'ar' ? p.title : p.titleEn;
  const overview = currentLang === 'ar' ? p.overview : (p.overviewEn || p.overview);
  const catLabel = getCategoryBadgeText(p);
  const convertedPrice = (p.finalJod * activeCurrency.rate).toFixed(2);
  const currSymbol = currentLang === 'ar' ? activeCurrency.symbol : activeCurrency.symbolEn;
  const waText = encodeURIComponent(
    currentLang === 'ar'
      ? `مرحبا، أرغب بطلب ${p.title} من دار غلاتي بسعر ${convertedPrice} ${currSymbol} المتوفر عبر زهرة بيسان`
      : `Hello, I would like to order ${p.titleEn} by Ghalati House at ${convertedPrice} ${currSymbol} from Zahrat Beesan`
  );
  const waLink = `https://wa.me/962796697413?text=${waText}`;

  return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-card-image-wrap" onclick="openProductModal('${p.id}')" title="${currentLang === 'ar' ? 'انقر لعرض تفاصيل وهرم العطر' : 'Click to view perfume details & notes'}">
        <img src="${p.image}" alt="${title} - دار غلاتي" class="product-card-image" loading="lazy">
        <span class="product-badge-top">${t.originalPurityBadge}</span>
        <span class="product-badge-house">GHALATI</span>
        <span class="product-badge-cat">${catLabel}</span>
      </div>
      <div class="product-card-body">
        <span class="product-card-house-name">دار غلاتي • Ghalati Parfums</span>
        <h3 class="product-card-title" onclick="openProductModal('${p.id}')">${title}</h3>
        <p class="product-card-desc">
          ${overview}
        </p>
        <div class="product-card-price-row">
          <span class="product-price-orig">${t.retailPrice}</span>
          <strong class="product-price-main" data-base-jod="${p.finalJod}">${getFormattedPrice(p.finalJod)}</strong>
        </div>
        <div class="product-card-actions">
          <button type="button" class="btn-view-details" onclick="openProductModal('${p.id}')">
            <span>🔍</span>
            <span>${t.btnViewDetails}</span>
          </button>
          <div class="product-card-actions-sub">
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-order-whatsapp">
              <span>💬</span>
              <span>${t.btnInstantWhatsApp}</span>
            </a>
            <button type="button" class="btn-add-cart" onclick="addToCart('${p.title}')">
              <span>🛍️</span>
              <span>${t.btnAddToCart}</span>
            </button>
          </div>
        </div>
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

// ── Ultra-Luxury Product Details Modal ──
function openProductModal(id) {
  const p = perfumesData.find(item => item.id === id);
  if (!p) return;

  activeModalPerfume = p;
  renderProductModalContent(p);

  const modal = document.getElementById('productModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // prevent background scrolling
  }
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  activeModalPerfume = null;
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

  // 3. Pure Flacon Cutout (Rendered strictly ONCE - no duplicate bottles)
  const flaconSrc = p.originalImage || p.bottleUrl || p.fragranticaBottle;
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

  // Helper for chip tags
  const renderChips = (text, isProminent = false) => {
    if (!text) return '';
    return text.split(/،|,/).map(item => item.trim()).filter(Boolean).map(note => `
      <span class="pyramid-chip ${isProminent ? 'pyramid-chip-prominent' : ''}">${note}</span>
    `).join('');
  };

  container.innerHTML = `
    <div class="product-modal-grid">
      
      <!-- العمود الأيسر: معرض الصور التفاعلي بالزجاجة الأصلية الصافية وقالب العرض الملكي -->
      <div class="modal-gallery-pane">
        <div class="modal-main-img-box" id="modalMainImageBox">
          <img src="${p.image}" alt="${title}" id="modalMainImg" loading="lazy">
          <span class="modal-gallery-badge" id="modalGalleryBadge">${t.quickViewShowcase}</span>
        </div>

        <div class="modal-thumbs-row">
          ${galleryItems.map((item, idx) => `
            <button type="button" class="modal-thumb-btn ${idx === 0 ? 'active-thumb' : ''}" 
              onclick="switchModalImage('${item.src}', ${item.isFlacon}, '${item.label}', this)"
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

        <!-- بطاقة السعر المحول بالمعادلة المعتمدة -->
        <div class="modal-price-box">
          <div>
            <span style="font-size: 0.82rem; color: var(--espresso-dim); display: block;">${t.retailPrice}</span>
            <strong class="modal-price-val" data-base-jod="${p.finalJod}">${getFormattedPrice(p.finalJod)}</strong>
          </div>
          <span style="background: rgba(197, 168, 128, 0.18); border: 1px solid rgba(197, 168, 128, 0.4); padding: 5px 12px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 800; color: var(--gold-dim);">
            ${getCategoryBadgeText(p)}
          </span>
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
            <strong class="modal-spec-val">${specs.size || '100 مل'}</strong>
          </div>
          <div class="modal-spec-row">
            <span class="modal-spec-label">${t.modalCategory}:</span>
            <strong class="modal-spec-val">${specs.category || 'للجنسين'}</strong>
          </div>
          <div class="modal-spec-row">
            <span class="modal-spec-label">${t.modalOrigin}:</span>
            <strong class="modal-spec-val">${specs.origin || 'المملكة العربية السعودية'}</strong>
          </div>
          <div class="modal-spec-row">
            <span class="modal-spec-label">${t.modalType}:</span>
            <strong class="modal-spec-val">${specs.type || 'عطر فاخر'}</strong>
          </div>
          ${specs.perfumer ? `
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
          <button type="button" class="btn-add-cart" onclick="addToCart('${p.title}')" style="padding: 12px 18px; font-size: 0.9rem;">
            <span>🛍️</span>
            <span>${t.btnAddToCart}</span>
          </button>
        </div>

        <!-- رابط التحقق في المصدر الأصلي -->
        <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="modal-source-link">
          <span>🔗</span>
          <span>${t.modalOfficialSource}</span>
        </a>

      </div>

    </div>
  `;
}

function switchModalImage(src, isFlacon, label, btnEl) {
  const mainImg = document.getElementById('modalMainImg');
  const badge = document.getElementById('modalGalleryBadge');
  if (mainImg) {
    mainImg.src = src;
    const isContain = isFlacon || 
                      src.includes('secundar') || 
                      src.includes('perfume-social-cards') || 
                      src.includes('social.') || 
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

  const productModal = document.getElementById('productModal');
  if (productModal && e.target === productModal) {
    closeProductModal();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductModal();
    closeCurrencyModal();
    closeShippingModal();
  }
});

// ── Cart & Direct Actions ──
function addToCart(perfumeName) {
  cartItemsCount++;
  const badge = document.getElementById('cartCountBadge');
  if (badge) {
    badge.textContent = cartItemsCount;
    badge.style.transform = 'scale(1.25)';
    setTimeout(() => badge.style.transform = 'scale(1)', 250);
  }

  const msg = currentLang === 'ar'
    ? `✨ تم إضافة "${perfumeName}" إلى حقيبة التسوق بنجاح!`
    : `✨ "${perfumeName}" was added to your shopping cart!`;
  alert(msg);
}

function handleNewsletter(e) {
  e.preventDefault();
  const input = document.getElementById('newsletterEmail');
  if (!input || !input.value.trim()) return;

  const msg = currentLang === 'ar'
    ? '👑 شكراً لاشتراكك في النشرة الملكية لدار زهرة بيسان! ستصلك أحدث الإصدارات الحصرية.'
    : '👑 Thank you for subscribing to Zahrat Beesan Royal Newsletter! You will receive exclusive releases.';
  alert(msg);
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
      currentSearch = e.target.value.trim();
      renderCatalog(currentFilter, currentSearch);
    });
  }

  loadCatalog();
});
