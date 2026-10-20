// ══════════════════════════════════════════════════════════
// ✉️ "Contact us" form and "Join our team" careers window. Messages and job
// applications land in the dashboard (Inbox, Job applications).
// ══════════════════════════════════════════════════════════

const contactEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function contactSheet(html) {
  let el = document.getElementById('contactSheet');
  if (!el) {
    el = document.createElement('div');
    el.id = 'contactSheet';
    el.className = 'contact-sheet';
    el.addEventListener('click', e => { if (e.target === el) closeContactSheet(); });
    document.body.appendChild(el);
  }
  el.innerHTML = `<div class="contact-card"><button type="button" class="contact-x" onclick="closeContactSheet()" aria-label="إغلاق">✕</button>${html}</div>`;
  el.classList.add('is-open');
  document.body.classList.add('contact-open');
}

function closeContactSheet() {
  document.getElementById('contactSheet')?.classList.remove('is-open');
  document.body.classList.remove('contact-open');
}

function openContactForm(type) {
  const isAr = currentLang === 'ar';
  const types = isAr
    ? [['question', 'استفسار'], ['complaint', 'شكوى'], ['suggestion', 'اقتراح'], ['feedback', 'رأيك بالمتجر']]
    : [['question', 'Question'], ['complaint', 'Complaint'], ['suggestion', 'Suggestion'], ['feedback', 'Feedback']];
  contactSheet(`
    <h3>${isAr ? 'تواصل معنا' : 'Contact us'}</h3>
    <p class="contact-sub">${isAr ? 'اكتبلنا وبنرد عليك بأقرب وقت، أو احكي معنا مباشرة على ' : 'Write to us and we will get back soon, or chat with us on '}<a href="https://wa.me/962796697413" target="_blank" rel="noopener">WhatsApp</a>.</p>
    <form class="contact-form" onsubmit="sendContactForm(event)">
      <div class="contact-types">${types.map(([v, l]) => `<label><input type="radio" name="type" value="${v}"${v === (type || 'question') ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>
      <div class="contact-row">
        <input name="name" required maxlength="60" placeholder="${isAr ? 'الاسم' : 'Name'}" autocomplete="name">
        <input name="phone" required maxlength="30" dir="ltr" inputmode="tel" placeholder="${isAr ? 'رقم الهاتف' : 'Phone'}" autocomplete="tel">
      </div>
      <input name="email" type="email" maxlength="80" dir="ltr" placeholder="${isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}" autocomplete="email">
      <textarea name="message" required rows="4" maxlength="1500" placeholder="${isAr ? 'رسالتك…' : 'Your message…'}"></textarea>
      <input name="website" class="review-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button type="submit" class="contact-submit">${isAr ? 'إرسال' : 'Send'}</button>
    </form>`);
}

async function sendContactForm(e) {
  e.preventDefault();
  const isAr = currentLang === 'ar';
  const f = e.target;
  const btn = f.querySelector('.contact-submit');
  btn.disabled = true;
  try {
    const res = await fetch('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(f))),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '');
    f.outerHTML = `<div class="review-thanks">🌷 ${isAr ? 'وصلتنا رسالتك، رح نتواصل معك قريباً.' : 'Thank you! We will be in touch soon.'}</div>`;
  } catch (err) {
    btn.disabled = false;
    showNotification(err.message || (isAr ? 'ما قدرنا نرسل، جرّب مرة ثانية' : 'Could not send, please try again'), '⚠️');
  }
}

async function openCareers() {
  const isAr = currentLang === 'ar';
  contactSheet(`<h3>${isAr ? 'انضم لفريق زهرة بيسان' : 'Join Zahrat Beesan'}</h3><div class="spinner-sm"></div>`);
  let jobs = [];
  try { jobs = (await (await fetch('/api/jobs')).json()).items || []; } catch (e) { /* offline */ }
  contactSheet(`
    <h3>${isAr ? 'انضم لفريق زهرة بيسان' : 'Join Zahrat Beesan'}</h3>
    ${jobs.length ? jobs.map(j => `
      <details class="job-item">
        <summary><strong>${contactEsc(j.title)}</strong><span>${contactEsc(j.type)} · ${contactEsc(j.location)}</span></summary>
        ${j.description ? `<p>${contactEsc(j.description).replace(/\n/g, '<br>')}</p>` : ''}
        <form class="contact-form" onsubmit="sendJobApplication(event, '${contactEsc(j.id)}')">
          <div class="contact-row">
            <input name="name" required maxlength="60" placeholder="${isAr ? 'الاسم الكامل' : 'Full name'}">
            <input name="phone" required maxlength="30" dir="ltr" inputmode="tel" placeholder="${isAr ? 'رقم الهاتف' : 'Phone'}">
          </div>
          <div class="contact-row">
            <input name="email" type="email" maxlength="80" dir="ltr" placeholder="${isAr ? 'البريد (اختياري)' : 'Email (optional)'}">
            <input name="city" maxlength="40" placeholder="${isAr ? 'المدينة' : 'City'}">
          </div>
          <textarea name="experience" rows="3" maxlength="1500" placeholder="${isAr ? 'خبرتك باختصار' : 'Your experience in short'}"></textarea>
          <input name="website" class="review-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button type="submit" class="contact-submit">${isAr ? 'قدّم على الوظيفة' : 'Apply'}</button>
        </form>
      </details>`).join('')
      : `<p class="contact-sub">${isAr ? 'ما في وظائف شاغرة حالياً. تابعنا، وبننزل الجديد هون.' : 'No openings right now. Check back soon.'}</p>`}`);
}

async function sendJobApplication(e, jobId) {
  e.preventDefault();
  const isAr = currentLang === 'ar';
  const f = e.target;
  const btn = f.querySelector('.contact-submit');
  btn.disabled = true;
  try {
    const res = await fetch('/api/jobs/apply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...Object.fromEntries(new FormData(f)), jobId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '');
    f.outerHTML = `<div class="review-thanks">🌷 ${isAr ? 'وصلنا طلبك، رح نتواصل معك.' : 'Application received, we will be in touch.'}</div>`;
  } catch (err) {
    btn.disabled = false;
    showNotification(err.message || (isAr ? 'ما قدرنا نرسل، جرّب مرة ثانية' : 'Could not send, please try again'), '⚠️');
  }
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeContactSheet(); });
document.addEventListener('DOMContentLoaded', () => {
  // The careers link only shows while there are open jobs.
  const link = document.getElementById('careersLink');
  if (link && typeof siteConfigReady !== 'undefined') siteConfigReady.then(cfg => { link.hidden = !cfg.jobsOpen; });
});
