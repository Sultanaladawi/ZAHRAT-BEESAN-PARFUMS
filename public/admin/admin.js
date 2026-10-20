// ══════════════════════════════════════════════════════════
// 👑 Zahrat Beesan dashboard (after the CaffAIne admin): login, overview,
// orders, products, offers, coupons, notify-me requests and site settings.
// ══════════════════════════════════════════════════════════

const NAV = [
  { id: 'dashboard', ico: '◈', ar: 'الرئيسية' },
  { id: 'orders', ico: '🛍', ar: 'الطلبات', badge: 'newOrders' },
  { id: 'products', ico: '🧴', ar: 'المنتجات' },
  { id: 'offers', ico: '🎁', ar: 'العروض' },
  { id: 'coupons', ico: '🎟', ar: 'أكواد الخصم' },
  { id: 'reviews', ico: '★', ar: 'التقييمات', badge: 'reviews' },
  { id: 'notify', ico: '🔔', ar: 'طلبات التنبيه', badge: 'notify' },
  { id: 'settings', ico: '⚙', ar: 'إعدادات الموقع' },
];

const STATUS = {
  new: 'جديد', confirmed: 'مؤكد', shipped: 'قيد التوصيل', delivered: 'تم التسليم', cancelled: 'ملغي',
};
const HOUSE_AR = {
  ghalati: 'غلاتي', assaf: 'عساف', thunayan: 'ثنيان', rasasi: 'الرصاصي', 'al-rehab': 'الرحاب',
  labonair: 'لو بانهور', laverne: 'لافيرن', deraah: 'درعة',
};
const DAY_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jod = n => `${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-US')}`;
const fmtDate = iso => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Amman', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const thumb = src => {
  const m = /^images\/([^/?]+)\.(?:jpe?g|png|webp)(\?.*)?$/i.exec(src || '');
  return '/' + (m ? `images/thumbs/${m[1]}.webp${m[2] || ''}` : src);
};

let counts = { newOrders: 0, notify: 0, reviews: 0 };
let lastNewOrders = null;
let pollTimer = null;
let clockTimer = null;

// ── API ──
async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  if (res.status === 401 && !path.endsWith('/login')) { showLogin(); throw new Error('unauthorized'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'حصل خطأ');
  return data;
}

function toast(msg, isError) {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast${isError ? ' error' : ''}`;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2800);
}

function openModal(html) {
  $('modalBody').innerHTML = html;
  $('modal').hidden = false;
}
function closeModal() { $('modal').hidden = true; }

// Soft two-note chime for a new order (Web Audio, no files).
function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1318.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.65);
    });
  } catch (e) { /* no audio */ }
}

// ── Auth ──
function showLogin(message) {
  clearInterval(pollTimer);
  $('appView').hidden = true;
  $('loginView').hidden = false;
  if (message) { $('loginError').textContent = message; $('loginError').hidden = false; }
  setTimeout(() => $('loginPassword').focus(), 50);
}

async function boot() {
  const me = await fetch('/api/admin/me').then(r => r.json()).catch(() => ({}));
  if (!me.configured) return showLogin('لوحة التحكم غير مفعّلة بعد: لازم تضيف ADMIN_PASSWORD في إعدادات Vercel.');
  if (!me.loggedIn) return showLogin();
  $('loginView').hidden = true;
  $('appView').hidden = false;
  if (me.storageError) {
    $('storageWarning').hidden = false;
    $('storageWarning').innerHTML = `⚠️ <strong>مشكلة بالحفظ:</strong> ${esc(me.storageError)}`;
  } else if (me.storage !== 'github') {
    $('storageWarning').hidden = false;
    $('storageWarning').innerHTML = me.storage === 'temporary'
      ? '⚠️ <strong>الحفظ مؤقت:</strong> التعديلات رح تنمسح مع كل تحديث للموقع. أضف <code>ADMIN_GITHUB_TOKEN</code> في إعدادات Vercel حتى ينحفظ كل اشي بشكل دائم.'
      : 'ℹ️ وضع التجربة المحلي: البيانات محفوظة في data/admin-state.json على هذا الجهاز.';
  }
  renderNav();
  route();
  poll();
  pollTimer = setInterval(poll, 30000);
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('loginBtn');
  btn.disabled = true;
  $('loginError').hidden = true;
  try {
    await api('/api/admin/login', { method: 'POST', body: { password: $('loginPassword').value } });
    $('loginPassword').value = '';
    boot();
  } catch (err) {
    $('loginError').textContent = err.message;
    $('loginError').hidden = false;
  } finally {
    btn.disabled = false;
  }
});
$('eyeBtn').addEventListener('click', () => {
  const i = $('loginPassword');
  i.type = i.type === 'password' ? 'text' : 'password';
});
$('logoutBtn').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
  showLogin();
});

// ── Shell ──
function renderNav() {
  const current = (location.hash.slice(1) || 'dashboard').split('?')[0];
  $('sideNav').innerHTML = NAV.map(n => `
    <a href="#${n.id}" class="nav-item${n.id === current ? ' active' : ''}">
      <span class="ico">${n.ico}</span><span>${n.ar}</span>
      ${n.badge && counts[n.badge] ? `<span class="nav-badge">${counts[n.badge]}</span>` : ''}
    </a>`).join('');
}

function setStoreToggle(open) {
  const t = $('storeToggle');
  t.classList.toggle('closed', !open);
  t.querySelector('.label').textContent = open ? 'استقبال الطلبات: مفتوح' : 'استقبال الطلبات: متوقف';
  t.dataset.open = open ? '1' : '0';
}

$('storeToggle').addEventListener('click', async () => {
  const open = $('storeToggle').dataset.open !== '1';
  if (!open && !confirm('إيقاف استقبال الطلبات من الموقع؟ زر "أكمل الطلب" رح يختفي من الحقيبة.')) return;
  try {
    await api('/api/admin/settings', { method: 'PUT', body: { ordersOpen: open } });
    setStoreToggle(open);
    toast(open ? 'المتجر يستقبل الطلبات ✅' : 'تم إيقاف استقبال الطلبات');
  } catch (e) { toast(e.message, true); }
});

async function poll() {
  try {
    const s = await api('/api/admin/stats');
    counts = { newOrders: s.totals.newOrders, notify: s.totals.notify, reviews: s.totals.reviews };
    setStoreToggle(s.ordersOpen);
    if (lastNewOrders !== null && s.totals.newOrders > lastNewOrders) {
      chime();
      $('orderBanner').hidden = false;
      $('orderBannerText').textContent = `${s.totals.newOrders} طلب جديد بانتظارك`;
    }
    if (!s.totals.newOrders) $('orderBanner').hidden = true;
    lastNewOrders = s.totals.newOrders;
    renderNav();
    return s;
  } catch (e) { return null; }
}
$('orderBannerGo').addEventListener('click', () => { $('orderBanner').hidden = true; location.hash = 'orders'; });

$('menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
$('sideOverlay').addEventListener('click', () => document.body.classList.remove('nav-open'));
$('modalClose').addEventListener('click', closeModal);
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
window.addEventListener('hashchange', route);

function pageHead(badgeIco, badge, sub, right = '') {
  return `
    <div class="bg-orb a"></div><div class="bg-orb b"></div>
    <div class="page-head">
      <div>
        <div class="page-title">Zahrat <em>Beesan</em></div>
        <div class="page-badge"><span class="ico">${badgeIco}</span><span>${badge}</span></div>
        <p class="page-sub">${sub}</p>
      </div>
      ${right}
    </div>`;
}

const PAGES = {};
function route() {
  document.body.classList.remove('nav-open');
  clearInterval(clockTimer);
  const id = (location.hash.slice(1) || 'dashboard').split('?')[0];
  renderNav();
  $('page').innerHTML = '<div class="spinner"></div>';
  window.scrollTo(0, 0);
  (PAGES[id] || PAGES.dashboard)().catch(err => {
    if (err.message !== 'unauthorized') $('page').innerHTML = `<div class="empty"><div class="big">⚠️</div>${esc(err.message)}</div>`;
  });
}

// ── Dashboard ──
PAGES.dashboard = async () => {
  const s = await poll() || await api('/api/admin/stats');
  const t = s.totals;
  const max = Math.max(1, ...s.days.map(d => d.revenue));
  const today = s.days[s.days.length - 1].day;
  const houseMax = Math.max(1, ...s.houses.map(h => h.total));
  const card = (ico, tone, label, value, unit, foot) => `
    <div class="stat" style="--tone:${tone}">
      <div class="ico">${ico}</div>
      <div class="label">${label}</div>
      <div class="value">${value}${unit ? `<small>${unit}</small>` : ''}</div>
      ${foot ? `<div class="foot">${foot}</div>` : ''}
    </div>`;
  $('page').innerHTML = pageHead('◈', 'لوحة القيادة', 'نظرة سريعة على المتجر: الطلبات، المنتجات والعروض.', `
    <div class="head-chips">
      <div class="chip"><small>إيراد اليوم</small><strong>${jod(t.todayRevenue)} <small>د.أ</small></strong></div>
      <div class="chip"><small>طلبات اليوم</small><strong>${t.todayOrders}</strong></div>
      <div class="chip"><small>عمّان</small><strong class="clock" id="clock">--:--</strong></div>
    </div>`) + `
    <div class="stats">
      ${card('🛍', '#38ef7d', 'كل الطلبات', t.orders, '', `${t.newOrders} جديد بانتظار التأكيد`)}
      ${card('💰', '#c4a484', 'قيمة الطلبات', jod(t.revenue), 'د.أ', 'بدون الملغية')}
      ${card('🧴', '#4facfe', 'المنتجات المتوفرة', t.available.toLocaleString('en-US'), '', `من أصل ${t.products.toLocaleString('en-US')}`)}
      ${card('⛔', '#ff4d4d', 'نفدت الكمية', t.out, '', `${t.hidden} مخفي · ${t.featured} مميز`)}
      ${card('🎟', '#f59e0b', 'أكواد فعّالة', t.coupons, '', `${t.notify} طلب تنبيه مفتوح`)}
    </div>
    <div class="grid-2">
      <div class="panel">
        <h3>📈 آخر 7 أيام <span class="tag">قيمة الطلبات بالدينار</span></h3>
        <div class="chart">
          ${s.days.map(d => {
            const dt = new Date(`${d.day}T12:00:00`);
            return `
            <div class="bar-col${d.day === today ? ' today' : ''}">
              <div class="bar" style="height:${Math.max(3, Math.round(d.revenue / max * 100))}%">
                <div class="bar-tip">${jod(d.revenue)} د.أ · ${d.orders} طلب</div>
              </div>
              <div class="bar-day">${d.day === today ? 'اليوم' : DAY_AR[dt.getDay()]}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="panel">
        <h3>🏛 الدور <span class="tag">${t.products.toLocaleString('en-US')} منتج</span></h3>
        ${s.houses.map(h => `
          <div class="house-row${h.off ? ' off' : ''}">
            <span>${esc(h.ar)}${h.off ? ' <small class="muted">(مخفية)</small>' : ''}</span>
            <div class="track" style="width:${Math.round(h.total / houseMax * 100)}%">
              <span class="ok" style="width:${h.total ? (h.total - h.out) / h.total * 100 : 0}%"></span>
              <span class="out" style="width:${h.total ? h.out / h.total * 100 : 0}%"></span>
            </div>
            <span class="n">${h.total}</span>
          </div>`).join('')}
        <div class="legend"><span><i style="background:#c4a484"></i>متوفر</span><span><i style="background:rgba(255,77,77,.55)"></i>نفد</span></div>
      </div>
    </div>
    <div class="grid-2">
      <div class="panel">
        <h3>⭐ الأكثر طلباً</h3>
        ${s.top.length ? `<table><tbody>${s.top.map((p, i) => `
          <tr><td style="width:30px" class="muted">${i + 1}</td><td>${esc(p.title)}</td><td class="muted">× ${p.qty}</td><td class="money">${jod(p.revenue)} د.أ</td></tr>`).join('')}</tbody></table>`
          : '<div class="empty"><div class="big">🛍</div>لسا ما في طلبات. أول ما يطلب زبون من الحقيبة رح يبين هون.</div>'}
      </div>
      <div class="terminal">
        <div class="terminal-head">STORE MONITOR <i></i></div>
        ${s.log.length ? s.log.map(l => `<div class="log-line ${esc(l.kind)}"><time>${fmtDate(l.at)}</time><span>${esc(l.text)}</span></div>`).join('')
          : '<div class="log-line"><span>النظام جاهز. كل تعديل أو طلب رح ينسجل هون.</span></div>'}
      </div>
    </div>`;
  const tick = () => {
    const c = $('clock');
    if (c) c.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Amman', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  tick();
  clockTimer = setInterval(tick, 1000);
};

// ── Orders ──
let ordersFilter = '';
PAGES.orders = async () => {
  const { items } = await api(`/api/admin/orders${ordersFilter ? `?status=${ordersFilter}` : ''}`);
  window.__orders = items;
  $('page').innerHTML = pageHead('🛍', 'الطلبات', 'كل طلب يرسله زبون من الحقيبة عبر واتساب ينسجل هون برقمه.', `
    <div class="head-chips">
      <select class="input" id="orderFilter" style="width:auto">
        <option value="">كل الحالات</option>
        ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === ordersFilter ? ' selected' : ''}>${v}</option>`).join('')}
      </select>
      <button class="btn" id="exportOrders">⬇ تصدير CSV</button>
    </div>`) + (items.length ? `
    <div class="table-wrap"><table>
      <thead><tr><th>رقم الطلب</th><th class="hide-sm">التاريخ</th><th>المنتجات</th><th>المجموع</th><th>الحالة</th><th></th></tr></thead>
      <tbody>${items.map(o => `
        <tr>
          <td><span class="ref">${esc(o.ref)}</span></td>
          <td class="hide-sm muted">${fmtDate(o.at)}</td>
          <td>${o.lines.reduce((n, l) => n + l.qty, 0)} قطعة${o.coupon ? ` <span class="pill gold">${esc(o.coupon)}</span>` : ''}</td>
          <td class="money">${jod(o.totalJod)} د.أ</td>
          <td><span class="pill ${o.status}">${STATUS[o.status] || o.status}</span></td>
          <td><button class="btn sm" data-order="${esc(o.ref)}">التفاصيل</button></td>
        </tr>`).join('')}</tbody>
    </table></div>` : '<div class="panel empty"><div class="big">🛍</div>ما في طلبات بهاي الحالة.</div>');
  $('orderFilter').onchange = e => { ordersFilter = e.target.value; route(); };
  $('exportOrders').onclick = () => exportOrders(items);
  document.querySelectorAll('[data-order]').forEach(b => { b.onclick = () => showOrder(b.dataset.order); });
};

function showOrder(ref) {
  const o = (window.__orders || []).find(x => x.ref === ref);
  if (!o) return;
  openModal(`
    <h3>تفاصيل الطلب <span class="ref">${esc(o.ref)}</span></h3>
    <div class="info-box">
      <div><span>التاريخ</span><span>${fmtDate(o.at)}</span></div>
      <div><span>الحالة</span><span class="pill ${o.status}">${STATUS[o.status]}</span></div>
      ${o.coupon ? `<div><span>كود الخصم</span><span class="coupon-code">${esc(o.coupon)}</span></div>` : ''}
      <div><span>التوصيل</span><span>${o.freeDelivery ? 'مجاني 🎉' : 'حسب المدينة'}</span></div>
      <div><span>عملة الزبون</span><span>${esc(o.currency || 'JOD')}</span></div>
    </div>
    <table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th></tr></thead><tbody>
      ${o.lines.map(l => `<tr><td>${esc(l.title)}<div class="muted" style="font-size:.75rem">${HOUSE_AR[l.house] || ''}</div></td><td>× ${l.qty}</td><td class="money">${jod(l.unitJod * l.qty)}</td></tr>`).join('')}
    </tbody></table>
    ${o.discountJod ? `<div class="info-box" style="margin-top:14px"><div><span>قبل الخصم</span><span>${jod(o.subtotalJod)} د.أ</span></div><div><span>الخصم</span><span style="color:var(--success)">− ${jod(o.discountJod)} د.أ</span></div></div>` : ''}
    <div class="total-row"><span>المجموع</span><span class="money">${jod(o.totalJod)} د.أ</span></div>
    <div class="status-steps">
      ${Object.entries(STATUS).map(([k, v]) => `<button class="btn sm${k === o.status ? ' cur' : ''}" data-status="${k}">${v}</button>`).join('')}
    </div>
    <label class="field"><span>اسم الزبون / ملاحظة</span>
      <textarea class="input" id="orderNote" rows="2" placeholder="مثلاً: أحمد – إربد، دفع عند الاستلام">${esc(o.note)}</textarea>
    </label>
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
      <button class="btn gold" id="saveNote">حفظ الملاحظة</button>
      <button class="btn danger" id="deleteOrder">حذف الطلب</button>
    </div>`);
  document.querySelectorAll('[data-status]').forEach(b => {
    b.onclick = async () => {
      try {
        await api(`/api/admin/orders/${encodeURIComponent(o.ref)}`, { method: 'PATCH', body: { status: b.dataset.status } });
        toast(`الطلب ${o.ref}: ${STATUS[b.dataset.status]}`);
        closeModal();
        poll();
        route();
      } catch (e) { toast(e.message, true); }
    };
  });
  $('saveNote').onclick = async () => {
    try {
      await api(`/api/admin/orders/${encodeURIComponent(o.ref)}`, { method: 'PATCH', body: { note: $('orderNote').value } });
      toast('تم الحفظ');
      closeModal();
      route();
    } catch (e) { toast(e.message, true); }
  };
  $('deleteOrder').onclick = async () => {
    if (!confirm(`حذف الطلب ${o.ref} نهائياً؟`)) return;
    try {
      await api(`/api/admin/orders/${encodeURIComponent(o.ref)}`, { method: 'DELETE' });
      closeModal();
      poll();
      route();
    } catch (e) { toast(e.message, true); }
  };
}

function exportOrders(items) {
  const rows = [['رقم الطلب', 'التاريخ', 'الحالة', 'المنتجات', 'كود الخصم', 'الخصم', 'المجموع (د.أ)', 'ملاحظة']]
    .concat(items.map(o => [o.ref, fmtDate(o.at), STATUS[o.status], o.lines.map(l => `${l.title} ×${l.qty}`).join(' | '), o.coupon || '', o.discountJod, o.totalJod, o.note || '']));
  const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `zahrat-beesan-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ── Products ──
const prodQuery = { q: '', house: '', filter: '', page: 1 };
PAGES.products = async () => {
  const qs = new URLSearchParams(prodQuery).toString();
  const data = await api(`/api/admin/products?${qs}`);
  $('page').innerHTML = pageHead('🧴', 'المنتجات', 'أخفِ أي منتج، غيّر سعره، أو ميّزه بنجمة ليطلع في "مختارات زهرة بيسان" على الصفحة الرئيسية.') + `
    <div class="toolbar">
      <input class="input grow" id="prodSearch" placeholder="ابحث بالاسم العربي أو الإنجليزي…" value="${esc(prodQuery.q)}">
      <select class="input" id="prodHouse"><option value="">كل الدور</option>${Object.entries(HOUSE_AR).map(([k, v]) => `<option value="${k}"${k === prodQuery.house ? ' selected' : ''}>${v}</option>`).join('')}</select>
      <select class="input" id="prodFilter">
        ${[['', 'الكل'], ['available', 'المتوفر'], ['out', 'نفدت الكمية'], ['hidden', 'المخفي'], ['featured', 'المميز ⭐'], ['price', 'سعر معدّل']].map(([k, v]) => `<option value="${k}"${k === prodQuery.filter ? ' selected' : ''}>${v}</option>`).join('')}
      </select>
      <span class="muted">${data.total.toLocaleString('en-US')} منتج</span>
    </div>
    ${data.items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>المنتج</th><th class="hide-sm">الدار</th><th>السعر (د.أ)</th><th class="hide-sm">الحالة</th><th>ظاهر</th><th>مميز</th></tr></thead>
      <tbody>${data.items.map(p => `
        <tr data-id="${esc(p.id)}">
          <td><div class="prod-cell"><img src="${esc(thumb(p.image))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/${esc(p.image)}'"><div><div class="t">${esc(p.title)}</div><div class="e">${esc(p.titleEn)}</div></div></div></td>
          <td class="hide-sm muted">${HOUSE_AR[p.house] || ''}</td>
          <td><div class="price-edit">
            <input type="number" min="1" step="0.5" value="${p.priceOverride || p.priceJod}" data-orig="${p.priceJod}" class="${p.priceOverride ? 'changed' : ''}" title="السعر الأصلي ${p.priceJod} د.أ">
            ${p.priceOverride ? `<button class="icon-btn" data-reset title="رجوع للسعر الأصلي (${p.priceJod})">↺</button>` : ''}
          </div></td>
          <td class="hide-sm">${p.out ? '<span class="pill bad">نفد</span>' : '<span class="pill ok">متوفر</span>'}</td>
          <td><label class="switch"><input type="checkbox" data-visible${p.hidden ? '' : ' checked'}><span></span></label></td>
          <td><button class="star-btn${p.featured ? ' on' : ''}" data-star>★</button></td>
        </tr>`).join('')}</tbody>
    </table></div>
    <div class="pager">
      <button class="btn sm" id="prevPage"${data.page <= 1 ? ' disabled' : ''}>→ السابق</button>
      <span>${data.page} / ${data.pages}</span>
      <button class="btn sm" id="nextPage"${data.page >= data.pages ? ' disabled' : ''}>التالي ←</button>
    </div>` : '<div class="panel empty"><div class="big">🔍</div>ما في منتجات مطابقة.</div>'}`;

  let searchTimer;
  $('prodSearch').oninput = e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { prodQuery.q = e.target.value.trim(); prodQuery.page = 1; PAGES.products().then(() => { const i = $('prodSearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 350);
  };
  $('prodHouse').onchange = e => { prodQuery.house = e.target.value; prodQuery.page = 1; PAGES.products(); };
  $('prodFilter').onchange = e => { prodQuery.filter = e.target.value; prodQuery.page = 1; PAGES.products(); };
  if ($('prevPage')) $('prevPage').onclick = () => { prodQuery.page -= 1; PAGES.products(); window.scrollTo(0, 0); };
  if ($('nextPage')) $('nextPage').onclick = () => { prodQuery.page += 1; PAGES.products(); window.scrollTo(0, 0); };

  const patch = async (id, body, msg) => {
    try {
      await api(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', body });
      toast(msg);
      return true;
    } catch (e) { toast(e.message, true); return false; }
  };
  document.querySelectorAll('tr[data-id]').forEach(row => {
    const id = row.dataset.id;
    const vis = row.querySelector('[data-visible]');
    vis.onchange = () => patch(id, { hidden: !vis.checked }, vis.checked ? 'المنتج ظاهر بالموقع ✅' : 'تم إخفاء المنتج من الموقع');
    const star = row.querySelector('[data-star]');
    star.onclick = async () => {
      const on = !star.classList.contains('on');
      if (await patch(id, { featured: on }, on ? 'أُضيف لمختارات زهرة بيسان ⭐' : 'أُزيل من المختارات')) star.classList.toggle('on', on);
    };
    const input = row.querySelector('.price-edit input');
    input.onchange = async () => {
      const v = Number(input.value);
      const orig = Number(input.dataset.orig);
      const body = { priceJod: !v || v === orig ? null : v };
      if (await patch(id, body, body.priceJod ? `السعر الجديد ${v} د.أ` : 'رجع السعر الأصلي')) PAGES.products();
    };
    const reset = row.querySelector('[data-reset]');
    if (reset) reset.onclick = async () => { if (await patch(id, { priceJod: null }, 'رجع السعر الأصلي')) PAGES.products(); };
  });
};

// ── Offers ──
PAGES.offers = async () => {
  const { items } = await api('/api/admin/offers');
  $('page').innerHTML = pageHead('🎁', 'العروض', 'عروض الموردين اللي بتنطبق تلقائياً بالحقيبة. السعر = سعر المورد + 4 د.أ لكل قنينة + ربحك.') + `
    <div class="cards">${items.map(o => `
      <div class="opt-card${o.enabled ? '' : ' off'}" data-key="${esc(o.key)}">
        <div class="opt-top">
          <h4>${esc(o.ar)}</h4>
          <label class="switch"><input type="checkbox" data-on${o.enabled ? ' checked' : ''}><span></span></label>
        </div>
        <p>${o.size} قطع بالمجموعة · ${o.key.startsWith('assaf') ? 'الأرخص بينهم هدية' : 'سعر ثابت للمجموعة من المورد'}</p>
        <div class="inline-field">ربحك على كل مجموعة:
          <input class="input" type="number" min="0" step="1" value="${o.profit}" data-profit> د.أ
          ${o.profit !== o.defaultProfit ? `<span class="muted">(الأصلي ${o.defaultProfit})</span>` : ''}
        </div>
      </div>`).join('')}
    </div>`;
  document.querySelectorAll('.opt-card').forEach(card => {
    const key = card.dataset.key;
    card.querySelector('[data-on]').onchange = async e => {
      try {
        await api(`/api/admin/offers/${encodeURIComponent(key)}`, { method: 'PATCH', body: { enabled: e.target.checked } });
        card.classList.toggle('off', !e.target.checked);
        toast(e.target.checked ? 'العرض فعّال على الموقع ✅' : 'تم إيقاف العرض');
      } catch (err) { toast(err.message, true); }
    };
    card.querySelector('[data-profit]').onchange = async e => {
      try {
        await api(`/api/admin/offers/${encodeURIComponent(key)}`, { method: 'PATCH', body: { profit: Number(e.target.value) } });
        toast(`الربح الجديد ${e.target.value} د.أ`);
      } catch (err) { toast(err.message, true); }
    };
  });
};

// ── Coupons ──
// Store-themed codes: a name from the store or the perfume world + the percent.
const CODE_WORDS = ['ZAHRA', 'BEESAN', 'ZB', 'OUD', 'MISK', 'ANBAR', 'WARD', 'BAKHOOR', 'SULTAN', 'EID', 'VIP'];
function suggestCodes(pct, taken) {
  const n = Math.round(Number(pct) || 10);
  const out = [];
  for (const w of CODE_WORDS) {
    let code = `${w}${n}`;
    if (taken.has(code)) code = `${w}${n}${String(new Date().getFullYear()).slice(2)}`;
    if (!taken.has(code)) out.push(code);
  }
  return out.slice(0, 8);
}

PAGES.coupons = async () => {
  const { items } = await api('/api/admin/coupons');
  const taken = new Set(items.map(c => c.code));
  const now = Date.now();
  $('page').innerHTML = pageHead('🎟', 'أكواد الخصم', 'الكود بينكتب بالحقيبة ويتأكد منه السيرفر، وما بيبين بكود الموقع لأي حدا.') + `
    <div class="panel" style="margin-bottom:20px">
      <h3>✨ كود جديد</h3>
      <form class="coupon-form" id="couponForm">
        <label>الكود<div class="code-wrap"><input class="input" id="cCode" maxlength="24" placeholder="BEESAN10" required></div></label>
        <label>الخصم ٪<input class="input" id="cPct" type="number" min="1" max="90" value="10" required></label>
        <label>حد أدنى (د.أ)<input class="input" id="cMin" type="number" min="0" value="0"></label>
        <label>عدد الاستخدامات<input class="input" id="cMax" type="number" min="0" value="0" title="0 = بلا حد"></label>
        <label>ينتهي بتاريخ<input class="input" id="cExp" type="date"></label>
        <button class="btn gold" type="submit">إضافة</button>
      </form>
      <div class="suggest" id="codeSuggest"></div>
      <p class="muted" style="font-size:.8rem;margin:12px 0 0">عدد الاستخدامات 0 = بلا حد. اضغط على أي اقتراح لتعبئته.</p>
    </div>
    ${items.length ? `<div class="table-wrap"><table>
      <thead><tr><th>الكود</th><th>الخصم</th><th class="hide-sm">الحد الأدنى</th><th>الاستخدام</th><th class="hide-sm">الصلاحية</th><th>فعّال</th><th></th></tr></thead>
      <tbody>${items.map(c => {
        const expired = c.expiresAt && Date.parse(c.expiresAt) < now;
        return `
        <tr data-code="${esc(c.code)}">
          <td><span class="coupon-code">${esc(c.code)}</span></td>
          <td class="money">${c.pct}٪</td>
          <td class="hide-sm">${c.minJod ? `${c.minJod} د.أ` : '<span class="muted">—</span>'}</td>
          <td><div class="usage">${c.uses || 0}${c.maxUses ? ` / ${c.maxUses}` : ' <span class="muted">مرة</span>'}
            ${c.maxUses ? `<div class="track"><span style="width:${Math.min(100, (c.uses || 0) / c.maxUses * 100)}%"></span></div>` : ''}</div></td>
          <td class="hide-sm">${c.expiresAt ? `<span class="pill ${expired ? 'bad' : 'gold'}">${expired ? 'انتهى ' : ''}${new Date(c.expiresAt).toLocaleDateString('en-GB')}</span>` : '<span class="muted">مفتوح</span>'}</td>
          <td><label class="switch"><input type="checkbox" data-active${c.active ? ' checked' : ''}><span></span></label></td>
          <td><button class="icon-btn del" data-del title="حذف">🗑</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>` : '<div class="panel empty"><div class="big">🎟</div>لسا ما في أكواد. اختار اقتراح من فوق أو اكتب كودك.</div>'}`;

  const renderSuggest = () => {
    $('codeSuggest').innerHTML = suggestCodes($('cPct').value, taken).map(c => `<button type="button">${c}</button>`).join('');
    $('codeSuggest').querySelectorAll('button').forEach(b => { b.onclick = () => { $('cCode').value = b.textContent; }; });
  };
  renderSuggest();
  $('cPct').oninput = renderSuggest;
  $('cCode').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
  $('couponForm').onsubmit = async e => {
    e.preventDefault();
    try {
      await api('/api/admin/coupons', { method: 'POST', body: {
        code: $('cCode').value, pct: Number($('cPct').value), minJod: Number($('cMin').value),
        maxUses: Number($('cMax').value), expiresAt: $('cExp').value ? `${$('cExp').value}T23:59:59+03:00` : null,
      } });
      toast(`الكود ${$('cCode').value} جاهز ✅`);
      PAGES.coupons();
    } catch (err) { toast(err.message, true); }
  };
  document.querySelectorAll('tr[data-code]').forEach(row => {
    const code = row.dataset.code;
    row.querySelector('[data-active]').onchange = async e => {
      try {
        await api(`/api/admin/coupons/${encodeURIComponent(code)}`, { method: 'PATCH', body: { active: e.target.checked } });
        toast(e.target.checked ? `${code} فعّال` : `تم إيقاف ${code}`);
      } catch (err) { toast(err.message, true); }
    };
    row.querySelector('[data-del]').onclick = async () => {
      if (!confirm(`حذف الكود ${code}؟`)) return;
      try {
        await api(`/api/admin/coupons/${encodeURIComponent(code)}`, { method: 'DELETE' });
        PAGES.coupons();
      } catch (err) { toast(err.message, true); }
    };
  });
};

// ── Reviews ──
let reviewsFilter = 'pending';
const REVIEW_STATUS = { pending: 'بانتظار المراجعة', approved: 'منشور', hidden: 'مخفي' };
const stars = n => `<span class="rv-stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;

PAGES.reviews = async () => {
  const { items } = await api(`/api/admin/reviews${reviewsFilter ? `?status=${reviewsFilter}` : ''}`);
  const all = await api('/api/admin/reviews');
  const n = k => all.items.filter(r => r.status === k).length;
  $('page').innerHTML = pageHead('★', 'التقييمات', 'كل تقييم يكتبه زبون بيوصل هون أول، وما بيظهر على الموقع إلا لما تنشره.', `
    <div class="head-chips"><button class="btn gold" id="addReview">＋ إضافة تقييم من واتساب</button></div>`) + `
    <div class="toolbar tabs">
      ${[['pending', `بانتظار المراجعة (${n('pending')})`], ['approved', `منشور (${n('approved')})`], ['hidden', `مخفي (${n('hidden')})`], ['', `الكل (${all.items.length})`]]
        .map(([k, v]) => `<button class="btn sm${k === reviewsFilter ? ' gold' : ''}" data-tab="${k}">${v}</button>`).join('')}
    </div>
    ${items.length ? `<div class="rv-list">${items.map(r => `
      <div class="rv-card" data-id="${esc(r.id)}">
        <div class="rv-top">
          <div class="avatar">${esc((r.name || '?').charAt(0))}</div>
          <div class="rv-who"><strong>${esc(r.name)}</strong><span class="muted">${r.city ? `${esc(r.city)} · ` : ''}${fmtDate(r.at)}${r.source !== 'customer' ? ' · من واتساب' : ''}</span></div>
          ${stars(r.rating)}
        </div>
        <div class="rv-product">🧴 ${esc(r.productTitle)} <span class="muted">· ${HOUSE_AR[r.house] || ''}</span></div>
        ${r.text ? `<p class="rv-text">${esc(r.text)}</p>` : ''}
        ${r.reply ? `<div class="rv-reply"><strong>ردك:</strong> ${esc(r.reply)}</div>` : ''}
        <div class="rv-actions">
          <span class="pill ${r.status === 'approved' ? 'ok' : r.status === 'hidden' ? 'bad' : 'new'}">${REVIEW_STATUS[r.status]}</span>
          ${r.status !== 'approved' ? '<button class="btn sm gold" data-act="approved">✓ نشر</button>' : ''}
          ${r.status !== 'hidden' ? '<button class="btn sm" data-act="hidden">إخفاء</button>' : ''}
          ${r.status === 'approved' ? `<button class="btn sm${r.home ? ' gold' : ''}" data-act="home">${r.home ? '★ بالرئيسية' : '☆ اعرضه بالرئيسية'}</button>` : ''}
          <button class="btn sm" data-act="reply">💬 رد</button>
          <button class="icon-btn del" data-act="delete" title="حذف">🗑</button>
        </div>
      </div>`).join('')}</div>`
      : `<div class="panel empty"><div class="big">★</div>${reviewsFilter === 'pending' ? 'ما في تقييمات جديدة بانتظارك.' : 'ما في تقييمات هون.'}</div>`}`;

  document.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { reviewsFilter = b.dataset.tab; PAGES.reviews(); }; });
  $('addReview').onclick = addReviewModal;
  document.querySelectorAll('.rv-card').forEach(card => {
    const id = card.dataset.id;
    const r = items.find(x => x.id === id);
    card.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = async () => {
        const act = b.dataset.act;
        try {
          if (act === 'delete') {
            if (!confirm('حذف التقييم نهائياً؟')) return;
            await api(`/api/admin/reviews/${id}`, { method: 'DELETE' });
          } else if (act === 'reply') {
            const reply = prompt('ردّك على الزبون (بيظهر تحت تقييمه):', r.reply || '');
            if (reply === null) return;
            await api(`/api/admin/reviews/${id}`, { method: 'PATCH', body: { reply } });
          } else if (act === 'home') {
            await api(`/api/admin/reviews/${id}`, { method: 'PATCH', body: { home: !r.home } });
            toast(r.home ? 'انشال من الرئيسية' : 'رح يظهر بقسم "آراء زبائننا" بالرئيسية ⭐');
          } else {
            await api(`/api/admin/reviews/${id}`, { method: 'PATCH', body: { status: act } });
            toast(act === 'approved' ? 'التقييم منشور على الموقع ✅' : 'تم إخفاء التقييم');
          }
          poll();
          PAGES.reviews();
        } catch (e) { toast(e.message, true); }
      };
    });
  });
};

function addReviewModal() {
  let picked = null;
  let rating = 5;
  openModal(`
    <h3>إضافة تقييم</h3>
    <p class="muted" style="margin-top:-8px">لتقييم وصلك من زبون على واتساب أو انستغرام. بينشر مباشرة.</p>
    <label class="field"><span>المنتج</span><input class="input" id="rvSearch" placeholder="ابحث عن اسم العطر…" autocomplete="off"></label>
    <div class="rv-results" id="rvResults"></div>
    <div class="rv-pick" id="rvPick">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" class="on">★</button>`).join('')}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0">
      <input class="input" id="rvName" placeholder="اسم الزبون">
      <input class="input" id="rvCity" placeholder="المدينة (اختياري)">
    </div>
    <textarea class="input" id="rvText" rows="3" placeholder="كلام الزبون كما وصلك"></textarea>
    <label class="house-check" style="margin-top:12px;display:inline-flex"><input type="checkbox" id="rvHome"> اعرضه بقسم "آراء زبائننا" بالرئيسية</label>
    <div style="margin-top:16px"><button class="btn gold" id="rvSave">حفظ ونشر</button></div>`);
  let t;
  $('rvSearch').oninput = e => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const { items } = await api(`/api/admin/product-search?q=${encodeURIComponent(e.target.value.trim())}`);
      $('rvResults').innerHTML = items.map(p => `<button type="button" data-id="${esc(p.id)}">${esc(p.title)} <span class="muted">· ${HOUSE_AR[p.house] || ''}</span></button>`).join('');
      $('rvResults').querySelectorAll('button').forEach(b => {
        b.onclick = () => { picked = b.dataset.id; $('rvSearch').value = b.textContent.split(' · ')[0]; $('rvResults').innerHTML = ''; };
      });
    }, 250);
  };
  $('rvPick').querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      rating = Number(b.dataset.v);
      $('rvPick').querySelectorAll('button').forEach(x => x.classList.toggle('on', Number(x.dataset.v) <= rating));
    };
  });
  $('rvSave').onclick = async () => {
    try {
      await api('/api/admin/reviews', { method: 'POST', body: {
        productId: picked, rating, name: $('rvName').value, city: $('rvCity').value, text: $('rvText').value, home: $('rvHome').checked,
      } });
      closeModal();
      toast('تم نشر التقييم ✅');
      reviewsFilter = 'approved';
      PAGES.reviews();
    } catch (e) { toast(e.message, true); }
  };
}

// ── Notify-me requests ──
PAGES.notify = async () => {
  const { items } = await api('/api/admin/notify');
  $('page').innerHTML = pageHead('🔔', 'طلبات التنبيه', 'المنتجات اللي الزباين طلبوا يتبلغوا لما ترجع. الزبون بيبعتلك كمان على واتساب.') + (items.length ? `
    <div class="table-wrap"><table>
      <thead><tr><th>المنتج</th><th class="hide-sm">الدار</th><th>عدد الطلبات</th><th>الآن</th><th class="hide-sm">آخر طلب</th><th></th></tr></thead>
      <tbody>${items.map(n => `
        <tr>
          <td><strong>${esc(n.title)}</strong></td>
          <td class="hide-sm muted">${HOUSE_AR[n.house] || ''}</td>
          <td>${n.open ? `<span class="pill new">${n.open} بانتظار</span>` : '<span class="pill ok">تم</span>'} <span class="muted">من ${n.count}</span></td>
          <td>${n.inStock ? '<span class="pill ok">رجع متوفر ✅</span>' : '<span class="pill bad">لسا نافد</span>'}</td>
          <td class="hide-sm muted">${fmtDate(n.last)}</td>
          <td>${n.open ? `<button class="btn sm" data-done="${esc(n.id)}">تم التبليغ</button>` : ''}</td>
        </tr>`).join('')}</tbody>
    </table></div>` : '<div class="panel empty"><div class="big">🔔</div>ما في طلبات تنبيه لهلأ.</div>');
  document.querySelectorAll('[data-done]').forEach(b => {
    b.onclick = async () => {
      try {
        await api(`/api/admin/notify/${encodeURIComponent(b.dataset.done)}`, { method: 'PATCH' });
        toast('تم ✅');
        poll();
        PAGES.notify();
      } catch (e) { toast(e.message, true); }
    };
  });
};

// ── Settings ──
PAGES.settings = async () => {
  const { settings: s, houses } = await api('/api/admin/settings');
  const sw = (key, on) => `<label class="switch"><input type="checkbox" data-set="${key}"${on ? ' checked' : ''}><span></span></label>`;
  $('page').innerHTML = pageHead('⚙', 'إعدادات الموقع', 'انت بتقرر شو يبين على الموقع وشو لا. كل تغيير بيطبق على الموقع خلال ثواني.') + `
    <div class="settings-list">
      <div class="set-row"><div><h4>استقبال الطلبات</h4><p>لما يكون متوقف، زر "أكمل الطلب عبر واتساب" بيختفي وبتطلع رسالة إنو الطلبات متوقفة مؤقتاً.</p></div>${sw('ordersOpen', s.ordersOpen !== false)}</div>
      <div class="set-row"><div><h4>التوصيل المجاني</h4><p>التوصيل مجاني للطلبات من هذا المبلغ وفوق. اكتب 0 لإخفاء شريط التوصيل المجاني.</p></div>
        <div class="inline-field"><input class="input" type="number" min="0" id="freeDelivery" value="${Number(s.freeDeliveryJod) || 0}"> د.أ</div></div>
      <div class="set-row"><div><h4>خانة كود الخصم بالحقيبة</h4><p>بتبين بس إذا في كود فعّال واحد على الأقل.</p></div>${sw('couponsEnabled', s.couponsEnabled !== false)}</div>
      <div class="set-row"><div><h4>تقييمات الزبائن</h4><p>النجوم على المنتجات، وقسم "آراء الزبائن" وخانة "اكتب تقييمك". التقييم الجديد ما بيظهر إلا بعد ما توافق عليه.</p></div>${sw('reviewsEnabled', s.reviewsEnabled !== false)}</div>
      <div class="set-row"><div><h4>"اختار عطرك" بالصفحة الرئيسية</h4><p>الأسئلة الأربعة اللي بتقترح عطور للزبون.</p></div>${sw('showQuiz', s.showQuiz !== false)}</div>
      <div class="set-row"><div><h4>"شاهدتها مؤخراً"</h4><p>شريط المنتجات اللي شافها الزبون آخر مرة.</p></div>${sw('showRecent', s.showRecent !== false)}</div>
      <div class="set-row col">
        <div style="display:flex;justify-content:space-between;gap:20px;align-items:center"><div><h4>شريط إعلان أعلى الموقع</h4><p>مثلاً: "خصم 10٪ بمناسبة العيد بكود EID10".</p></div>${sw('announcementOn', s.announcement && s.announcement.enabled)}</div>
        <input class="input" id="annAr" maxlength="160" placeholder="النص بالعربي" value="${esc(s.announcement && s.announcement.ar)}">
        <input class="input" id="annEn" maxlength="160" dir="ltr" placeholder="English text (optional)" value="${esc(s.announcement && s.announcement.en)}">
        <div><button class="btn gold" id="saveAnn">حفظ الإعلان</button></div>
      </div>
      <div class="set-row col">
        <div><h4>الدور الظاهرة بالموقع</h4><p>شيل الصح عن أي دار لتخفيها كاملة من القائمة والصفحة الرئيسية.</p></div>
        <div class="house-checks">${houses.map(h => `<label class="house-check"><input type="checkbox" data-house="${h.id}"${(s.hiddenHouses || []).includes(h.id) ? '' : ' checked'}> ${esc(h.ar)}</label>`).join('')}</div>
      </div>
    </div>`;
  const save = async (body, msg) => {
    try {
      const r = await api('/api/admin/settings', { method: 'PUT', body });
      toast(msg || 'تم الحفظ ✅');
      if ('ordersOpen' in body) setStoreToggle(r.settings.ordersOpen);
    } catch (e) { toast(e.message, true); }
  };
  document.querySelectorAll('[data-set]').forEach(i => {
    i.onchange = () => {
      if (i.dataset.set === 'announcementOn') return $('saveAnn').click();
      save({ [i.dataset.set]: i.checked });
    };
  });
  $('freeDelivery').onchange = e => save({ freeDeliveryJod: Number(e.target.value) }, Number(e.target.value) ? `توصيل مجاني فوق ${e.target.value} د.أ` : 'تم إخفاء شريط التوصيل المجاني');
  $('saveAnn').onclick = () => save({ announcement: { enabled: document.querySelector('[data-set="announcementOn"]').checked, ar: $('annAr').value, en: $('annEn').value } }, 'تم حفظ الإعلان');
  document.querySelectorAll('[data-house]').forEach(i => {
    i.onchange = () => save({ hiddenHouses: [...document.querySelectorAll('[data-house]')].filter(x => !x.checked).map(x => x.dataset.house) });
  });
};

boot();
