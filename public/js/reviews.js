// ══════════════════════════════════════════════════════════
// ⭐ Customer reviews: stars on product cards, reviews and a "write a review"
// form in the product window, and "what our customers say" on the home page.
// New reviews wait for the owner's approval in the dashboard.
// ══════════════════════════════════════════════════════════

const reviewsOn = () => typeof SITE_CONFIG === 'undefined' || SITE_CONFIG.reviewsEnabled !== false;
const reviewEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function starsHtml(rating, size = '') {
  const full = Math.round(rating);
  return `<span class="stars${size ? ` stars-${size}` : ''}" aria-label="${rating} / 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= full ? 'on' : ''}">★</i>`).join('')}</span>`;
}

function cardRatingHtml(id) {
  if (!reviewsOn() || typeof SITE_CONFIG === 'undefined') return '';
  const r = SITE_CONFIG.ratings && SITE_CONFIG.ratings[id];
  return r ? `<div class="card-rating">${starsHtml(r[0], 'sm')}<span>(${r[1]})</span></div>` : '';
}

let reviewPick = 0;

async function renderProductReviews(p) {
  const container = document.getElementById('productModalContent');
  if (!container || !reviewsOn()) return;
  const isAr = currentLang === 'ar';
  const section = document.createElement('section');
  section.className = 'reviews-block';
  section.id = 'reviewsBlock';
  // Sit above "you may also like".
  const also = container.querySelector('.also-like');
  if (also) container.insertBefore(section, also); else container.appendChild(section);

  let data = { items: [], avg: 0, count: 0 };
  try {
    const res = await fetch(`/api/reviews?product=${encodeURIComponent(p.id)}`);
    if (res.ok) data = await res.json();
  } catch (e) { /* offline */ }
  if (!document.body.contains(section)) return;

  reviewPick = 0;
  section.innerHTML = `
    <div class="reviews-head">
      <h2 class="home-heading">${isAr ? 'آراء الزبائن' : 'Customer reviews'}</h2>
      ${data.count ? `<div class="reviews-summary"><strong>${data.avg}</strong>${starsHtml(data.avg)}<span>${isAr ? `${data.count} تقييم` : `${data.count} reviews`}</span></div>` : ''}
    </div>
    ${data.count ? `<div class="reviews-list">${data.items.slice(0, 20).map(r => reviewCardHtml(r, isAr)).join('')}</div>`
      : `<p class="reviews-empty">${isAr ? 'كن أول من يقيّم هذا العطر ✨' : 'Be the first to review this perfume ✨'}</p>`}
    <button type="button" class="reviews-write-btn" onclick="toggleReviewForm()">✍️ ${isAr ? 'اكتب تقييمك' : 'Write a review'}</button>
    <form class="review-form" id="reviewForm" hidden onsubmit="submitReview(event, '${reviewEsc(p.id)}')">
      <div class="review-pick" id="reviewPick">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" onclick="pickReviewStar(${i})" aria-label="${i}">★</button>`).join('')}</div>
      <div class="review-row">
        <input name="name" maxlength="40" required placeholder="${isAr ? 'الاسم' : 'Name'}">
        <input name="city" maxlength="40" placeholder="${isAr ? 'المدينة (اختياري)' : 'City (optional)'}">
      </div>
      <textarea name="text" maxlength="600" rows="3" required placeholder="${isAr ? 'كيف كانت تجربتك مع العطر؟ الثبات، الفوحان، الريحة…' : 'How was it? Longevity, projection, scent…'}"></textarea>
      <input name="website" class="review-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button type="submit" class="review-submit">${isAr ? 'إرسال التقييم' : 'Send review'}</button>
    </form>`;
}

function reviewCardHtml(r, isAr) {
  const date = new Date(r.at).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', { year: 'numeric', month: 'long' });
  return `
    <article class="review-card">
      <div class="review-top">
        <span class="review-avatar">${reviewEsc((r.name || '?').trim().charAt(0))}</span>
        <div><strong>${reviewEsc(r.name)}</strong><small>${r.city ? `${reviewEsc(r.city)} · ` : ''}${date}</small></div>
        ${starsHtml(r.rating, 'sm')}
      </div>
      ${r.text ? `<p>${reviewEsc(r.text)}</p>` : ''}
      ${r.reply ? `<div class="review-reply"><strong>${isAr ? 'رد زهرة بيسان' : 'Zahrat Beesan replied'}:</strong> ${reviewEsc(r.reply)}</div>` : ''}
    </article>`;
}

function toggleReviewForm() {
  const f = document.getElementById('reviewForm');
  if (f) f.hidden = !f.hidden;
}

function pickReviewStar(v) {
  reviewPick = v;
  document.querySelectorAll('#reviewPick button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) <= v));
}

async function submitReview(e, productId) {
  e.preventDefault();
  const isAr = currentLang === 'ar';
  const f = e.target;
  if (!reviewPick) { showNotification(isAr ? 'اختار عدد النجوم أولاً' : 'Pick a star rating first', '⭐'); return; }
  const btn = f.querySelector('.review-submit');
  btn.disabled = true;
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, rating: reviewPick, name: f.name.value, city: f.city.value, text: f.text.value, website: f.website.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '');
    f.outerHTML = `<div class="review-thanks">🌷 ${isAr ? 'شكراً لك! تقييمك رح يظهر بعد المراجعة.' : 'Thank you! Your review will appear after approval.'}</div>`;
  } catch (err) {
    btn.disabled = false;
    showNotification(err.message || (isAr ? 'ما قدرنا نرسل التقييم، جرّب مرة ثانية' : 'Could not send, please try again'), '⚠️');
  }
}

// Home page: reviews the owner pinned in the dashboard.
function renderHomeReviews() {
  if (!reviewsOn() || typeof SITE_CONFIG === 'undefined' || !(SITE_CONFIG.homeReviews || []).length) return '';
  const isAr = currentLang === 'ar';
  return `
    <section class="home-section home-reviews">
      <h2 class="home-heading">${isAr ? 'آراء زبائننا' : 'What our customers say'}</h2>
      <div class="home-reviews-rail">${SITE_CONFIG.homeReviews.map(r => `
        <article class="review-card" onclick="openProductModal('${reviewEsc(r.productId)}')">
          ${starsHtml(r.rating, 'sm')}
          <p>“${reviewEsc(r.text)}”</p>
          <div class="review-top"><span class="review-avatar">${reviewEsc((r.name || '?').trim().charAt(0))}</span>
            <div><strong>${reviewEsc(r.name)}</strong><small>${reviewEsc(r.productTitle)}</small></div></div>
        </article>`).join('')}
      </div>
    </section>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const original = window.renderProductModalContent;
  if (typeof original === 'function') {
    window.renderProductModalContent = function (p, ...rest) {
      const r = original.call(this, p, ...rest);
      try { renderProductReviews(p); } catch (e) { console.error(e); }
      return r;
    };
  }
});
