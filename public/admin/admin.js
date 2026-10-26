// ══════════════════════════════════════════════════════════
// 👑 Zahrat Beesan dashboard (after the CaffAIne admin): login, overview,
// orders, products, offers, coupons, notify-me requests and site settings.
// ══════════════════════════════════════════════════════════

const NAV = [
  { id: 'dashboard', ico: '◈', ar: 'الرئيسية' },
  { id: 'orders', ico: '🛍', ar: 'الطلبات', badge: 'newOrders' },
  { id: 'analytics', ico: '📊', ar: 'التحليلات' },
  { id: 'products', ico: '🧴', ar: 'المنتجات' },
  { id: 'offers', ico: '🎁', ar: 'العروض' },
  { id: 'coupons', ico: '🎟', ar: 'أكواد الخصم' },
  { id: 'reviews', ico: '★', ar: 'التقييمات', badge: 'reviews' },
  { id: 'messages', ico: '✉', ar: 'صندوق الرسائل', badge: 'messages' },
  { id: 'notify', ico: '🔔', ar: 'طلبات التنبيه', badge: 'notify' },
  { id: 'jobs', ico: '💼', ar: 'الوظائف' },
  { id: 'applications', ico: '📄', ar: 'طلبات التوظيف', badge: 'applications' },
  { id: 'ai', ico: '✦', ar: 'المساعد الذكي' },
  { id: 'settings', ico: '⚙', ar: 'إعدادات الموقع' },
  { id: 'team', ico: '👥', ar: 'الفريق' },
  { id: 'leader', ico: '♛', ar: 'لوحة القائد' },
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

let counts = { newOrders: 0, notify: 0, reviews: 0, messages: 0, applications: 0 };
// The signed-in person and the pages their role opens.
let me = { name: '', role: '', roleAr: '', perms: [] };
const can = perm => me.perms.includes(perm);
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

// Three rising beeps for a new order (Web Audio, no files).
function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1100, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.22;
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.45, t + 0.05);
      g.gain.linearRampToValueAtTime(0.0001, t + (i === 2 ? 0.28 : 0.18));
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch (e) { /* no audio */ }
}

// Urgent alarm, repeated every 4 s while new orders wait more than 10 minutes
// for someone to confirm them, until "stop alarm" is pressed.
let alarmTimer = null;
let alarmMutedFor = 0;
function alarmBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach(d => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + d;
      o.type = 'square';
      o.frequency.setValueAtTime(660, t);
      o.frequency.setValueAtTime(440, t + 0.15);
      g.gain.setValueAtTime(0.25, t);
      g.gain.linearRampToValueAtTime(0, t + 0.28);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch (e) { /* no audio */ }
}
function setAlarm(stale) {
  const on = stale > 0 && stale > alarmMutedFor;
  $('stopAlarm').hidden = !on;
  if (on && !alarmTimer) { alarmBeep(); alarmTimer = setInterval(alarmBeep, 4000); }
  if (!on && alarmTimer) { clearInterval(alarmTimer); alarmTimer = null; }
  if (!stale) alarmMutedFor = 0;
}

// Page views and exports go to the leader's activity log.
function track(event, page, detail) {
  fetch('/api/admin/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, page, detail }) }).catch(() => {});
}

// Printable table for "save as PDF" (the browser's print keeps Arabic text right).
function exportPrint(title, headers, rows) {
  track('export', location.hash.slice(1) || 'dashboard', `${title} (PDF)`);
  const w = window.open('', '_blank');
  if (!w) { toast('اسمح بالنوافذ المنبثقة حتى ينفتح التقرير', true); return; }
  const dir = document.documentElement.dir || 'rtl';
  w.document.write(`<!doctype html><html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Tajawal:wght@400;700&display=swap">
    <style>body{font-family:Tajawal,sans-serif;color:#1a1a1a;margin:28px}h1{font-family:Amiri,serif;margin:0}p{color:#7a7a7a;margin:4px 0 18px;font-size:12px}
    table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f2efe9;color:#a6865d;text-align:start;padding:8px;border-bottom:2px solid #c5a880}
    td{padding:7px 8px;border-bottom:1px solid #eee;vertical-align:top}tr:nth-child(even) td{background:#faf9f6}.brand{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #c5a880;padding-bottom:10px;margin-bottom:14px}</style></head><body>
    <div class="brand"><h1>زهرة بيسان للعطور</h1><span style="font-size:11px;color:#a6865d;letter-spacing:3px">ZAHRAT BEESAN</span></div>
    <h2 style="margin:0">${esc(title)}</h2><p>${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Amman' })} · ${esc(me.name)}</p>
    <table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`);
  w.document.close();
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
  const info = await fetch('/api/admin/me').then(r => r.json()).catch(() => ({}));
  if (!info.configured) return showLogin('لوحة التحكم غير مفعّلة بعد: لازم تضيف ADMIN_PASSWORD في إعدادات Vercel.');
  if (!info.loggedIn) return showLogin();
  me = info.user;
  $('profileName').textContent = me.name;
  $('profileRole').textContent = me.roleAr;
  $('profileAvatar').textContent = (me.name || '؟').trim().charAt(0);
  $('storeToggle').disabled = !can('settings');
  $('loginView').hidden = true;
  $('appView').hidden = false;
  $('storageWarning').hidden = true;
  if (info.storageError) {
    $('storageWarning').hidden = false;
    $('storageWarning').innerHTML = `⚠️ <strong>مشكلة بالحفظ:</strong> ${esc(info.storageError)}`;
  } else if (info.storage !== 'github') {
    $('storageWarning').hidden = false;
    $('storageWarning').innerHTML = info.storage === 'temporary'
      ? '⚠️ <strong>الحفظ مؤقت:</strong> التعديلات رح تنمسح مع كل تحديث للموقع. أضف <code>ADMIN_GITHUB_TOKEN</code> في إعدادات Vercel حتى ينحفظ كل اشي بشكل دائم.'
      : 'ℹ️ وضع التجربة المحلي: البيانات محفوظة في data/admin-state.json على هذا الجهاز.';
  }
  renderNav();
  route();
  poll();
  pollTimer = setInterval(poll, 15000);
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('loginBtn');
  btn.disabled = true;
  $('loginError').hidden = true;
  try {
    await api('/api/admin/login', { method: 'POST', body: { username: $('loginUsername').value.trim(), password: $('loginPassword').value } });
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
  $('sideNav').innerHTML = NAV.filter(n => can(n.id)).map(n => `
    <a href="#${n.id}" class="nav-item${n.id === current ? ' active' : ''}">
      <span class="ico">${n.ico}</span><span>${n.ar}</span>
      ${n.badge && counts[n.badge] ? `<span class="nav-badge">${counts[n.badge]}</span>` : ''}
    </a>`).join('');
}

// Store mode, like the CaffAIne header button: auto (working hours), open, closed.
const STORE_MODES = { auto: 'تلقائي حسب الدوام', open: 'مفتوح يدوياً', closed: 'مغلق يدوياً' };
function setStoreToggle(mode, openNow) {
  const t = $('storeToggle');
  t.classList.toggle('closed', !openNow);
  t.classList.toggle('auto', mode === 'auto');
  t.querySelector('.label').textContent = `الطلبات: ${STORE_MODES[mode] || STORE_MODES.open}${mode === 'auto' ? (openNow ? ' · مفتوح' : ' · مغلق') : ''}`;
  t.dataset.mode = mode;
}

$('storeToggle').addEventListener('click', async () => {
  if (!can('settings')) return;
  const order = ['auto', 'open', 'closed'];
  const next = order[(order.indexOf($('storeToggle').dataset.mode || 'open') + 1) % order.length];
  if (next === 'closed' && !confirm('إغلاق استقبال الطلبات من الموقع؟ زر "أكمل الطلب" رح يختفي من الحقيبة.')) return;
  try {
    await api('/api/admin/settings', { method: 'PUT', body: { storeMode: next } });
    toast(`وضع المتجر: ${STORE_MODES[next]}`);
    poll();
  } catch (e) { toast(e.message, true); }
});
$('stopAlarm').addEventListener('click', () => {
  alarmMutedFor = Number($('stopAlarm').dataset.stale) || 1;
  setAlarm(0);
  alarmMutedFor = Number($('stopAlarm').dataset.stale) || 1;
});

async function poll() {
  try {
    const s = await api('/api/admin/stats');
    counts = { newOrders: s.totals.newOrders, notify: s.totals.notify, reviews: s.totals.reviews, messages: s.totals.messages, applications: s.totals.applications };
    setStoreToggle(s.storeMode, s.ordersOpen);
    $('stopAlarm').dataset.stale = s.totals.staleOrders;
    if (can('orders')) setAlarm(s.totals.staleOrders);
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
        <div class="page-title">ZAHRAT BEESAN</div>
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
  let id = (location.hash.slice(1) || 'dashboard').split('?')[0];
  if (!PAGES[id] || !can(id)) id = 'dashboard';
  renderNav();
  $('page').innerHTML = '<div class="spinner"></div>';
  window.scrollTo(0, 0);
  track('view', id, (NAV.find(n => n.id === id) || {}).ar || id);
  PAGES[id]().catch(err => {
    if (err.message !== 'unauthorized') $('page').innerHTML = `<div class="empty"><div class="big">⚠️</div>${esc(err.message)}</div>`;
  });
}

// One line of the activity log: when, who, what.
function logLine(l) {
  const who = l.by ? `<span class="who">${esc(l.by.name)}</span>` : `<span class="who customer">${l.kind === 'order' || l.kind === 'notify' || l.kind === 'review' ? 'زبون' : 'النظام'}</span>`;
  return `<div class="log-line ${esc(l.kind)}"><time>${fmtDate(l.at)}</time>${who}<span>${esc(l.text)}</span></div>`;
}

// ── Dashboard ──
PAGES.dashboard = async () => {
  const s = await poll() || await api('/api/admin/stats');
  const t = s.totals;
  const max = Math.max(1, ...s.days.map(d => d.revenue));
  const today = s.days[s.days.length - 1].day;
  const houseMax = Math.max(1, ...s.houses.map(h => h.total));
  const card = (ico, tone, label, value, unit, foot, link) => `
    <div class="stat${link && can(link) ? ' clickable' : ''}" style="--tone:${tone}"${link && can(link) ? ` onclick="location.hash='${link}'"` : ''}>
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
      ${card('🛍', '#38ef7d', 'كل الطلبات', t.orders, '', `${t.newOrders} جديد بانتظار التأكيد`, 'orders')}
      ${card('💰', '#c4a484', 'قيمة الطلبات', jod(t.revenue), 'د.أ', 'بدون الملغية', 'analytics')}
      ${card('🧴', '#4facfe', 'المنتجات المتوفرة', t.available.toLocaleString('en-US'), '', `من أصل ${t.products.toLocaleString('en-US')}`, 'products')}
      ${card('⛔', '#ff4d4d', 'نفدت الكمية', t.out, '', `${t.hidden} مخفي · ${t.featured} مميز`, 'notify')}
      ${card('✉', '#f59e0b', 'رسائل جديدة', t.messages || 0, '', `${t.coupons} كود فعّال · ${t.notify} طلب تنبيه`, 'messages')}
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
        <div class="terminal-head"><i></i> ${can('leader') ? 'آخر حركات الفريق' : 'آخر حركاتك'}</div>
        ${s.log.length ? s.log.map(logLine).join('')
          : `<div class="log-line"><span>${can('leader') ? 'النظام جاهز. كل تعديل أو طلب رح ينسجل هون.' : 'حركاتك رح تظهر هون.'}</span></div>`}
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
      <button class="btn" id="exportOrders">⬇ Excel</button>
      <button class="btn" id="printOrders">🖨 PDF</button>
    </div>`) + (items.length ? `
    <div class="table-wrap"><table>
      <thead><tr><th>رقم الطلب</th><th class="hide-sm">التاريخ</th><th>الزبون</th><th class="hide-sm">المنتجات</th><th>المجموع</th><th>الحالة</th><th></th></tr></thead>
      <tbody>${items.map(o => `
        <tr>
          <td><span class="ref">${esc(o.ref)}</span></td>
          <td class="hide-sm muted">${fmtDate(o.at)}</td>
          <td class="no-tr">${o.contact ? `<strong>${esc(o.contact.name)}</strong><div class="muted" style="font-size:.78rem">${esc(o.contact.city || (o.contact.delivery === 'pickup' ? 'استلام' : ''))}</div>` : '<span class="muted">—</span>'}</td>
          <td class="hide-sm">${o.lines.reduce((n, l) => n + l.qty, 0)} قطعة${o.coupon ? ` <span class="pill gold">${esc(o.coupon)}</span>` : ''}</td>
          <td class="money">${jod(o.totalJod)} د.أ</td>
          <td><span class="pill ${o.status}">${STATUS[o.status] || o.status}</span></td>
          <td><button class="btn sm" data-order="${esc(o.ref)}">التفاصيل</button></td>
        </tr>`).join('')}</tbody>
    </table></div>` : '<div class="panel empty"><div class="big">🛍</div>ما في طلبات بهاي الحالة.</div>');
  $('orderFilter').onchange = e => { ordersFilter = e.target.value; route(); };
  $('exportOrders').onclick = () => exportOrders(items);
  $('printOrders').onclick = () => exportPrint('تقرير الطلبات', ['رقم الطلب', 'التاريخ', 'الزبون', 'المدينة', 'المنتجات', 'المجموع', 'الحالة'],
    items.map(o => [o.ref, fmtDate(o.at), o.contact ? `${o.contact.name} ${o.contact.phone}` : '', o.contact ? o.contact.city : '', o.lines.map(l => `${l.title} ×${l.qty}`).join('، '), `${jod(o.totalJod)} د.أ`, STATUS[o.status]]));
  document.querySelectorAll('[data-order]').forEach(b => { b.onclick = () => showOrder(b.dataset.order); });
};

function showOrder(ref) {
  const o = (window.__orders || []).find(x => x.ref === ref);
  if (!o) return;
  openModal(`
    <h3>تفاصيل الطلب <span class="ref">${esc(o.ref)}</span></h3>
    ${o.contact ? `<div class="info-box">
      <div><span>الزبون</span><strong>${esc(o.contact.name)}</strong></div>
      <div><span>الهاتف</span><span><a href="tel:${esc(o.contact.phone)}" dir="ltr">📞 ${esc(o.contact.phone)}</a> · <a href="https://wa.me/${esc(String(o.contact.phone).replace(/\D/g, '').replace(/^0/, '962'))}" target="_blank" rel="noopener">واتساب</a></span></div>
      <div><span>الاستلام</span><span>${o.contact.delivery === 'pickup' ? 'من المتجر' : 'توصيل'}</span></div>
      ${o.contact.delivery !== 'pickup' ? `<div><span>العنوان</span><span>${esc(o.contact.city)}${o.contact.address ? ` – ${esc(o.contact.address)}` : ''} <a href="https://maps.google.com/?q=${encodeURIComponent(`${o.contact.city} ${o.contact.address || ''} الأردن`)}" target="_blank" rel="noopener">📍 الخريطة</a></span></div>` : ''}
      ${o.contact.notes ? `<div><span>ملاحظات الزبون</span><span>${esc(o.contact.notes)}</span></div>` : ''}
    </div>` : ''}
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
    ${(o.history || []).length ? `<h4 style="margin:18px 0 8px">سجل الطلب</h4><ul class="timeline">${o.history.map(h => `
      <li><strong>${h.by ? esc(h.by.name) : 'الزبون'}</strong> ${h.note ? 'كتب ملاحظة' : h.status === 'new' && !h.by ? 'أرسل الطلب' : `غيّر الحالة إلى «${STATUS[h.status]}»`}<time>${fmtDate(h.at)}</time></li>`).join('')}</ul>` : ''}
    <div class="status-steps">
      ${Object.entries(STATUS).map(([k, v]) => `<button class="btn sm${k === o.status ? ' cur' : ''}" data-status="${k}">${v}</button>`).join('')}
    </div>
    <label class="field"><span>اسم الزبون / ملاحظة</span>
      <textarea class="input" id="orderNote" rows="2" placeholder="مثلاً: أحمد – إربد، دفع عند الاستلام">${esc(o.note)}</textarea>
    </label>
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
      <button class="btn gold" id="saveNote">حفظ الملاحظة</button>
      ${me.role !== 'employee' ? '<button class="btn danger" id="deleteOrder">حذف الطلب</button>' : ''}
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
  if ($('deleteOrder')) $('deleteOrder').onclick = async () => {
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
  track('export', 'orders', 'تقرير الطلبات (Excel)');
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
        ${[['', 'الكل'], ['available', 'المتوفر'], ['out', 'نفدت الكمية'], ['hidden', 'المخفي'], ['duplicate', 'مكرر'], ['featured', 'المميز ⭐'], ['price', 'سعر معدّل']].map(([k, v]) => `<option value="${k}"${k === prodQuery.filter ? ' selected' : ''}>${v}</option>`).join('')}
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
          <td class="hide-sm">${p.out ? '<span class="pill bad">نفد</span>' : '<span class="pill ok">متوفر</span>'}${p.duplicateOf ? ` <span class="pill new" title="مخفي تلقائياً، يظهر بدله ${esc(p.duplicateOf)}">مكرر</span>` : ''}</td>
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
        <p>${o.size} قطع بالمجموعة · ${o.key.endsWith('+1') ? 'الأرخص بينهم هدية' : 'سعر ثابت للمجموعة من المورد'}</p>
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
  $('page').innerHTML = pageHead('🎟', 'أكواد الخصم', 'الكود بينكتب بالحقيبة ويتأكد منه السيرفر، وما بيبين بكود الموقع لأي حدا.', `<div class="head-chips"><button class="btn" id="cpPrint">🖨 PDF</button></div>`) + `
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
  $('cpPrint').onclick = () => exportPrint('أكواد الخصم', ['الكود', 'الخصم', 'الحد الأدنى', 'الاستخدام', 'الصلاحية', 'الحالة'], items.map(c => [c.code, `${c.pct}%`, c.minJod || '-', `${c.uses || 0}${c.maxUses ? `/${c.maxUses}` : ''}`, c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-GB') : 'مفتوح', c.active ? 'فعّال' : 'موقوف']));
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
    <div class="head-chips"><button class="btn" id="rvPrint">🖨 PDF</button><button class="btn gold" id="addReview">＋ إضافة تقييم من واتساب</button></div>`) + `
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

  $('rvPrint').onclick = () => exportPrint('التقييمات', ['التاريخ', 'الزبون', 'المنتج', 'النجوم', 'التقييم', 'الحالة'], items.map(r => [fmtDate(r.at), r.name, r.productTitle, r.rating, r.text, REVIEW_STATUS[r.status]]));
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

// ── Analytics: a month, a date range or all time ──
const MONTHS_AR = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
const anQuery = { mode: 'monthly', year: new Date().getFullYear(), month: new Date().getMonth() + 1, from: '', to: '' };
PAGES.analytics = async () => {
  const qs = new URLSearchParams(anQuery).toString();
  const a = await api(`/api/admin/analytics?${qs}`);
  const t = a.totals;
  const max = Math.max(1, ...a.days.map(d => d.revenue));
  const houseTotal = a.houses.reduce((n, h) => n + h.revenue, 0) || 1;
  const palette = ['#a6865d', '#c5a880', '#e5cda8', '#2b6cb0', '#6b46c1', '#1f9d55', '#b7791f', '#c53030', '#7a7a7a'];
  let acc = 0;
  const donut = a.houses.length ? `conic-gradient(${a.houses.map((h, i) => { const from = acc; acc += h.revenue / houseTotal * 100; return `${palette[i % palette.length]} ${from}% ${acc}%`; }).join(',')})` : 'var(--bg-2)';
  const years = [];
  for (let y = 2026; y <= new Date().getFullYear(); y++) years.push(y);
  const card = (ico, tone, label, value, unit, foot) => `<div class="stat" style="--tone:${tone}"><div class="ico">${ico}</div><div class="label">${label}</div><div class="value">${value}${unit ? `<small>${unit}</small>` : ''}</div>${foot ? `<div class="foot">${foot}</div>` : ''}</div>`;
  const podium = a.products.slice(0, 3);
  window.__anProducts = a.products;
  $('page').innerHTML = pageHead('📊', 'تحليلات المبيعات', 'المبيعات حسب الشهر أو فترة تختارها أو من البداية، مع أكثر المنتجات والدور مبيعاً.', `
    <div class="head-chips"><button class="btn" id="anPrint">🖨 PDF</button></div>`) + `
    <div class="toolbar">
      <span class="muted">عرض حسب:</span>
      ${[['monthly', 'شهري'], ['range', 'فترة'], ['all', 'من البداية']].map(([k, v]) => `<button class="btn sm${anQuery.mode === k ? ' gold' : ''}" data-anmode="${k}">${v}</button>`).join('')}
      ${anQuery.mode === 'monthly' ? `
        <select class="input" id="anMonth">${MONTHS_AR.map((m, i) => `<option value="${i + 1}"${i + 1 === Number(anQuery.month) ? ' selected' : ''}>${m}</option>`).join('')}</select>
        <select class="input" id="anYear">${years.map(y => `<option${y === Number(anQuery.year) ? ' selected' : ''}>${y}</option>`).join('')}</select>` : ''}
      ${anQuery.mode === 'range' ? `
        <span class="muted">من</span><input class="input" type="date" id="anFrom" value="${esc(anQuery.from)}">
        <span class="muted">إلى</span><input class="input" type="date" id="anTo" value="${esc(anQuery.to)}">` : ''}
    </div>
    <div class="stats">
      ${card('💰', '#c5a880', 'الإيراد', jod(t.revenue), 'د.أ', `${jod(t.discounts)} د.أ خصومات أكواد`)}
      ${card('🛍', '#1f9d55', 'الطلبات', t.orders, '', `${t.cancelled} ملغي (كل الفترات)`)}
      ${card('📈', '#2b6cb0', 'متوسط الطلب', jod(t.avg), 'د.أ', 'لكل طلب')}
      ${card('🧴', '#6b46c1', 'القطع المباعة', t.items, '', `${t.couponOrders} طلب بكود خصم`)}
      ${card('⚡', '#c53030', 'الأكثر مبيعاً', podium[0] ? `<span class="no-tr" style="font-size:1rem">${esc(podium[0].title)}</span>` : '—', '', podium[0] ? `${podium[0].qty} قطعة · ${jod(podium[0].revenue)} د.أ` : '')}
    </div>
    <div class="grid-2">
      <div class="panel">
        <h3>📅 المبيعات اليومية <span class="tag">${a.from ? `${a.from} → ${a.to}` : 'كل الفترات'}</span></h3>
        ${a.days.length ? `<div class="chart" style="gap:${a.days.length > 20 ? 3 : 10}px">${a.days.map(d => `
          <div class="bar-col"><div class="bar" style="height:${Math.max(2, Math.round(d.revenue / max * 100))}%"><div class="bar-tip">${d.day.slice(5)} · ${jod(d.revenue)} د.أ · ${d.orders} طلب</div></div>
          <div class="bar-day">${a.days.length > 14 ? (Number(d.day.slice(8)) % 5 === 1 ? d.day.slice(8) : '') : d.day.slice(5)}</div></div>`).join('')}</div>` : '<div class="empty">ما في مبيعات بهاي الفترة.</div>'}
      </div>
      <div class="panel">
        <h3>🏛 حصة كل دار من المبيعات</h3>
        ${a.houses.length ? `<div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
          <div style="width:160px;height:160px;border-radius:50%;background:${donut};position:relative;flex-shrink:0"><div style="position:absolute;inset:34px;background:#fff;border-radius:50%;display:grid;place-items:center;text-align:center;font-weight:800">${a.houses.length}<br><small class="muted">دور</small></div></div>
          <div style="flex:1;min-width:160px">${a.houses.map((h, i) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i style="width:12px;height:12px;border-radius:3px;background:${palette[i % palette.length]}"></i><span style="flex:1">${esc(h.ar)}</span><strong>${Math.round(h.revenue / houseTotal * 100)}%</strong><span class="muted" style="font-size:.8rem">${jod(h.revenue)} د.أ</span></div>`).join('')}</div>
        </div>` : '<div class="empty">ما في بيانات.</div>'}
      </div>
    </div>
    <div class="panel">
      <h3>🏆 الأكثر مبيعاً <button class="btn sm" id="anAll" style="margin-inline-start:auto">كل المنتجات المباعة (${a.products.length})</button></h3>
      ${podium.length ? `<div class="cards">${podium.map((p, i) => `<div class="opt-card"><div class="opt-top"><h4>${['🥇 المركز الأول', '🥈 المركز الثاني', '🥉 المركز الثالث'][i]}</h4></div><strong class="no-tr">${esc(p.title)}</strong><p>${HOUSE_AR[p.house] || ''} · ${p.qty} قطعة · ${jod(p.revenue)} د.أ</p></div>`).join('')}</div>` : '<div class="empty">لسا ما في مبيعات.</div>'}
    </div>`;
  document.querySelectorAll('[data-anmode]').forEach(b => { b.onclick = () => { anQuery.mode = b.dataset.anmode; PAGES.analytics(); }; });
  if ($('anMonth')) { $('anMonth').onchange = e => { anQuery.month = e.target.value; PAGES.analytics(); }; $('anYear').onchange = e => { anQuery.year = e.target.value; PAGES.analytics(); }; }
  if ($('anFrom')) { const go = () => { anQuery.from = $('anFrom').value; anQuery.to = $('anTo').value; if (anQuery.from && anQuery.to) PAGES.analytics(); }; $('anFrom').onchange = go; $('anTo').onchange = go; }
  $('anAll').onclick = () => soldProductsModal();
  $('anPrint').onclick = () => exportPrint(`تحليلات المبيعات ${a.from ? `${a.from} → ${a.to}` : '(كل الفترات)'}`, ['المنتج', 'الدار', 'القطع', 'الإيراد (د.أ)'],
    [['الإجمالي', '', t.items, jod(t.revenue)], ...a.products.map(p => [p.title, HOUSE_AR[p.house] || '', p.qty, jod(p.revenue)])]);
};

function soldProductsModal() {
  const sort = { field: 'qty', dir: -1, q: '' };
  const draw = () => {
    const rows = (window.__anProducts || []).filter(p => p.title.includes(sort.q))
      .sort((x, y) => (sort.field === 'title' ? x.title.localeCompare(y.title, 'ar') : x[sort.field] - y[sort.field]) * sort.dir);
    $('modalBody').innerHTML = `<h3>كل المنتجات المباعة</h3>
      <input class="input" id="soldSearch" placeholder="ابحث…" value="${esc(sort.q)}" style="margin-bottom:12px">
      <table><thead><tr>${[['title', 'المنتج'], ['unitJod', 'السعر'], ['qty', 'القطع'], ['revenue', 'الإيراد']].map(([k, v]) => `<th style="cursor:pointer" data-sort="${k}">${v} ${sort.field === k ? (sort.dir < 0 ? '↓' : '↑') : '↕'}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(p => `<tr><td class="no-tr">${esc(p.title)}</td><td>${jod(p.unitJod)}</td><td>${p.qty}</td><td class="money">${jod(p.revenue)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">ما في نتائج</td></tr>'}</tbody></table>`;
    $('soldSearch').oninput = e => { sort.q = e.target.value; const pos = e.target.selectionStart; draw(); $('soldSearch').focus(); $('soldSearch').setSelectionRange(pos, pos); };
    document.querySelectorAll('[data-sort]').forEach(th => { th.onclick = () => { if (sort.field === th.dataset.sort) sort.dir *= -1; else { sort.field = th.dataset.sort; sort.dir = -1; } draw(); }; });
  };
  openModal('');
  draw();
}

// ── Inbox: the contact form on the site ──
let msgFilter = '';
const MSG_TYPES = { question: 'استفسار', complaint: 'شكوى', suggestion: 'اقتراح', feedback: 'رأي بالمتجر' };
PAGES.messages = async () => {
  const { items } = await api('/api/admin/messages');
  const list = msgFilter === 'unread' ? items.filter(m => !m.read) : msgFilter ? items.filter(m => m.type === msgFilter) : items;
  $('page').innerHTML = pageHead('✉', 'صندوق الرسائل', 'رسائل "تواصل معنا" و"رأيك يهمنا" من الموقع. ردّ على الزبون على واتساب بكبسة.', `
    <div class="head-chips"><button class="btn" id="msgPrint">🖨 PDF</button></div>`) + `
    <div class="toolbar">
      ${[['', `الكل (${items.length})`], ['unread', `غير مقروءة (${items.filter(m => !m.read).length})`], ...Object.entries(MSG_TYPES).map(([k, v]) => [k, `${v} (${items.filter(m => m.type === k).length})`])]
        .map(([k, v]) => `<button class="btn sm${k === msgFilter ? ' gold' : ''}" data-mf="${k}">${v}</button>`).join('')}
    </div>
    ${list.length ? `<div class="rv-list">${list.map(m => `
      <div class="rv-card" data-id="${esc(m.id)}" style="${m.read ? '' : 'border-color:var(--gold);box-shadow:var(--shadow-md)'}">
        <div class="rv-top">
          <div class="avatar">${esc((m.name || '?').charAt(0))}</div>
          <div class="rv-who"><strong class="no-tr">${esc(m.name)}</strong><span class="muted">${fmtDate(m.at)}</span></div>
          ${m.read ? '' : '<span class="pill new">جديدة</span>'}
          <span class="pill ${m.type === 'complaint' ? 'bad' : 'gold'}">${MSG_TYPES[m.type] || m.type}</span>
        </div>
        <p class="rv-text no-tr">${esc(m.message)}</p>
        <div class="muted" style="font-size:.82rem" dir="ltr">${esc(m.phone)}${m.email ? ` · ${esc(m.email)}` : ''}</div>
        ${m.replied ? `<div class="rv-reply">✓ تم الرد${m.repliedBy ? ` بواسطة ${esc(m.repliedBy)}` : ''}</div>` : ''}
        <div class="rv-actions">
          <a class="btn sm gold" target="_blank" rel="noopener" data-reply href="https://wa.me/${esc(String(m.phone).replace(/\D/g, '').replace(/^0/, '962'))}?text=${encodeURIComponent(`مرحباً ${m.name}، معك زهرة بيسان للعطور بخصوص رسالتك: `)}">💬 رد على واتساب</a>
          <button class="btn sm" data-read>${m.read ? 'تعليم كغير مقروءة' : 'تعليم كمقروءة'}</button>
          ${m.replied ? '' : '<button class="btn sm" data-done>✓ تم الرد</button>'}
          <button class="icon-btn del" data-del title="حذف">🗑</button>
        </div>
      </div>`).join('')}</div>` : '<div class="panel empty"><div class="big">✉</div>الصندوق فاضي، كل الرسائل مقروءة.</div>'}`;
  document.querySelectorAll('[data-mf]').forEach(b => { b.onclick = () => { msgFilter = b.dataset.mf; PAGES.messages(); }; });
  $('msgPrint').onclick = () => exportPrint('صندوق الرسائل', ['التاريخ', 'الاسم', 'الهاتف', 'النوع', 'الرسالة', 'الحالة'],
    list.map(m => [fmtDate(m.at), m.name, m.phone, MSG_TYPES[m.type], m.message, m.replied ? 'تم الرد' : m.read ? 'مقروءة' : 'جديدة']));
  document.querySelectorAll('.rv-card[data-id]').forEach(card => {
    const id = card.dataset.id;
    const m = items.find(x => x.id === id);
    const patch = async body => { try { await api(`/api/admin/messages/${id}`, { method: 'PATCH', body }); poll(); PAGES.messages(); } catch (e) { toast(e.message, true); } };
    card.querySelector('[data-read]').onclick = () => patch({ read: !m.read });
    card.querySelector('[data-reply]').addEventListener('click', () => { if (!m.read) api(`/api/admin/messages/${id}`, { method: 'PATCH', body: { read: true } }).catch(() => {}); });
    const done = card.querySelector('[data-done]');
    if (done) done.onclick = () => patch({ replied: true });
    card.querySelector('[data-del]').onclick = async () => {
      if (!confirm('حذف الرسالة؟')) return;
      try { await api(`/api/admin/messages/${id}`, { method: 'DELETE' }); poll(); PAGES.messages(); } catch (e) { toast(e.message, true); }
    };
  });
};

// ── Jobs ──
PAGES.jobs = async () => {
  const { items } = await api('/api/admin/jobs');
  $('page').innerHTML = pageHead('💼', 'الوظائف', 'الوظائف المنشورة بتظهر بالموقع تحت "انضم لفريقنا"، وطلبات التقديم بتوصل لصفحة طلبات التوظيف.', `
    <div class="head-chips"><button class="btn gold" id="addJob">＋ وظيفة جديدة</button><button class="btn" id="jobsPrint">🖨 PDF</button></div>`) + (items.length ? `
    <div class="cards">${items.map(j => `
      <div class="opt-card${j.active ? '' : ' off'}" data-id="${esc(j.id)}">
        <div class="opt-top"><h4 class="no-tr">${esc(j.title)}</h4><label class="switch" title="منشورة بالموقع"><input type="checkbox" data-active${j.active ? ' checked' : ''}><span></span></label></div>
        <p>${esc(j.type)} · ${esc(j.location)} · ${j.applicants} متقدم</p>
        ${j.description ? `<p class="no-tr" style="color:var(--text-2)">${esc(j.description).slice(0, 220)}</p>` : ''}
        <div class="rv-actions"><button class="btn sm" data-edit>✏️ تعديل</button><a class="btn sm" href="#applications">الطلبات</a><button class="icon-btn del" data-del title="حذف">🗑</button></div>
      </div>`).join('')}</div>` : '<div class="panel empty"><div class="big">💼</div>ما في وظائف منشورة. اضغط "وظيفة جديدة" لتبلّش التوظيف.</div>');
  $('addJob').onclick = () => jobModal();
  $('jobsPrint').onclick = () => exportPrint('الوظائف', ['الوظيفة', 'النوع', 'المكان', 'المتقدمين', 'الحالة'], items.map(j => [j.title, j.type, j.location, j.applicants, j.active ? 'منشورة' : 'مخفية']));
  document.querySelectorAll('.opt-card[data-id]').forEach(card => {
    const j = items.find(x => x.id === card.dataset.id);
    card.querySelector('[data-active]').onchange = async e => {
      try { await api(`/api/admin/jobs/${j.id}`, { method: 'PATCH', body: { active: e.target.checked } }); toast(e.target.checked ? 'الوظيفة منشورة بالموقع ✅' : 'تم إخفاء الوظيفة'); PAGES.jobs(); } catch (err) { toast(err.message, true); }
    };
    card.querySelector('[data-edit]').onclick = () => jobModal(j);
    card.querySelector('[data-del]').onclick = async () => {
      if (!confirm(`حذف وظيفة ${j.title}؟`)) return;
      try { await api(`/api/admin/jobs/${j.id}`, { method: 'DELETE' }); PAGES.jobs(); } catch (err) { toast(err.message, true); }
    };
  });
};

function jobModal(j) {
  openModal(`<h3>${j ? 'تعديل الوظيفة' : 'وظيفة جديدة'}</h3>
    <div style="display:grid;gap:12px">
      <label class="field"><span>اسم الوظيفة</span><input class="input" id="jTitle" value="${esc(j ? j.title : '')}" placeholder="مثلاً: مندوب مبيعات عطور"></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <label class="field"><span>نوع الدوام</span><select class="input" id="jType">${['دوام كامل', 'دوام جزئي', 'عقد', 'عن بعد', 'تدريب'].map(t => `<option${j && j.type === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="field"><span>المكان</span><input class="input" id="jLoc" value="${esc(j ? j.location : 'عمّان')}"></label>
      </div>
      <label class="field"><span>الوصف والمطلوب</span><textarea class="input" id="jDesc" rows="5">${esc(j ? j.description : '')}</textarea></label>
      <button class="btn gold" id="jSave">${j ? 'حفظ' : 'نشر الوظيفة'}</button>
    </div>`);
  $('jSave').onclick = async () => {
    const body = { title: $('jTitle').value, type: $('jType').value, location: $('jLoc').value, description: $('jDesc').value };
    try {
      await api(j ? `/api/admin/jobs/${j.id}` : '/api/admin/jobs', { method: j ? 'PATCH' : 'POST', body });
      closeModal(); toast('تم الحفظ ✅'); PAGES.jobs();
    } catch (e) { toast(e.message, true); }
  };
}

// ── Job applications ──
const APP_STATUS = { new: 'جديد', reviewing: 'قيد المراجعة', interview: 'مقابلة', accepted: 'مقبول', rejected: 'مرفوض' };
const APP_PILL = { new: 'new', reviewing: 'confirmed', interview: 'shipped', accepted: 'ok', rejected: 'bad' };
let appFilter = '';
PAGES.applications = async () => {
  const { items } = await api('/api/admin/applications');
  const list = appFilter ? items.filter(a => a.status === appFilter) : items;
  $('page').innerHTML = pageHead('📄', 'طلبات التوظيف', 'كل اللي قدّموا من صفحة "انضم لفريقنا".', `
    <div class="head-chips"><button class="btn" id="appPrint">🖨 PDF</button></div>`) + `
    <div class="toolbar">${[['', `الكل (${items.length})`], ...Object.entries(APP_STATUS).map(([k, v]) => [k, `${v} (${items.filter(a => a.status === k).length})`])]
      .map(([k, v]) => `<button class="btn sm${k === appFilter ? ' gold' : ''}" data-af="${k}">${v}</button>`).join('')}</div>
    ${list.length ? `<div class="rv-list">${list.map(a => `
      <div class="rv-card" data-id="${esc(a.id)}">
        <div class="rv-top"><div class="avatar">${esc(a.name.charAt(0))}</div>
          <div class="rv-who"><strong class="no-tr">${esc(a.name)}</strong><span class="muted">${esc(a.jobTitle)} · ${fmtDate(a.at)}</span></div>
          <span class="pill ${APP_PILL[a.status]}">${APP_STATUS[a.status]}</span></div>
        ${a.experience ? `<p class="rv-text no-tr">${esc(a.experience)}</p>` : ''}
        <div class="muted" style="font-size:.82rem" dir="ltr">${esc(a.phone)}${a.email ? ` · ${esc(a.email)}` : ''}${a.city ? ` · ${esc(a.city)}` : ''}</div>
        <div class="rv-actions">
          <select class="input" data-status style="width:auto;padding:7px 10px">${Object.entries(APP_STATUS).map(([k, v]) => `<option value="${k}"${k === a.status ? ' selected' : ''}>${v}</option>`).join('')}</select>
          <a class="btn sm gold" target="_blank" rel="noopener" href="https://wa.me/${esc(String(a.phone).replace(/\D/g, '').replace(/^0/, '962'))}">💬 واتساب</a>
          <a class="btn sm" href="tel:${esc(a.phone)}">📞 اتصال</a>
          <button class="icon-btn del" data-del title="حذف">🗑</button>
        </div>
      </div>`).join('')}</div>` : '<div class="panel empty"><div class="big">📄</div>ما في طلبات توظيف لهلأ.</div>'}`;
  document.querySelectorAll('[data-af]').forEach(b => { b.onclick = () => { appFilter = b.dataset.af; PAGES.applications(); }; });
  $('appPrint').onclick = () => exportPrint('طلبات التوظيف', ['التاريخ', 'الاسم', 'الوظيفة', 'الهاتف', 'المدينة', 'الحالة'], list.map(a => [fmtDate(a.at), a.name, a.jobTitle, a.phone, a.city, APP_STATUS[a.status]]));
  document.querySelectorAll('.rv-card[data-id]').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('[data-status]').onchange = async e => {
      try { await api(`/api/admin/applications/${id}`, { method: 'PATCH', body: { status: e.target.value } }); toast(`صار الطلب: ${APP_STATUS[e.target.value]}`); poll(); PAGES.applications(); } catch (err) { toast(err.message, true); }
    };
    card.querySelector('[data-del]').onclick = async () => {
      if (!confirm('حذف طلب التوظيف؟')) return;
      try { await api(`/api/admin/applications/${id}`, { method: 'DELETE' }); poll(); PAGES.applications(); } catch (err) { toast(err.message, true); }
    };
  });
};

// ── AI assistant: questions about the store's numbers, by text or voice ──
const aiChat = [];
let aiMicLang = 'ar-SA';
PAGES.ai = async () => {
  const s = await api('/api/admin/stats');
  const msgs = can('messages') ? (await api('/api/admin/messages')).items.slice(0, 6) : [];
  $('page').innerHTML = pageHead('✦', 'المساعد الذكي', 'اسأل عن مبيعاتك وطلباتك ومنتجاتك بالعربي أو الإنجليزي، كتابة أو بالصوت.') + `
    <div class="grid-2" style="grid-template-columns:1.6fr 1fr">
      <div class="panel ai-panel">
        <div class="ai-log" id="aiLog">${aiChat.length ? aiChat.map(aiBubble).join('') : aiBubble({ role: 'assistant', content: `أهلاً ${me.name} 👋 أنا مساعد زهرة بيسان الذكي، شايف أرقام المتجر لحظة بلحظة. اسألني مثلاً: "شو أكثر عطر انطلب هالأسبوع؟" أو "كم طلب لسا ما تأكد؟"` })}</div>
        <div class="ai-suggest">${['كيف المبيعات اليوم؟', 'شو أكثر الدور مبيعاً؟', 'في طلبات متأخرة؟', 'لخّصلي التقييمات المنخفضة'].map(q => `<button class="btn sm" data-q="${esc(q)}">${q}</button>`).join('')}</div>
        <form class="ai-input" id="aiForm">
          <button type="button" class="icon-btn" id="aiLang" title="لغة المايك">${aiMicLang === 'ar-SA' ? 'ع' : 'EN'}</button>
          <button type="button" class="icon-btn" id="aiMic" title="تكلم">🎤</button>
          <input class="input" id="aiText" placeholder="اكتب سؤالك…" autocomplete="off">
          <button class="btn gold" type="submit">إرسال</button>
        </form>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="stats" style="grid-template-columns:1fr 1fr;margin:0">
          <div class="stat"><div class="label">إيراد اليوم</div><div class="value">${jod(s.totals.todayRevenue)}<small>د.أ</small></div></div>
          <div class="stat"><div class="label">طلبات اليوم</div><div class="value">${s.totals.todayOrders}</div></div>
        </div>
        ${can('messages') ? `<div class="panel"><h3>✉ آخر رسائل الزباين</h3>${msgs.length ? msgs.map(m => `<div style="border-bottom:1px dashed var(--border);padding:8px 0"><strong class="no-tr">${esc(m.name)}</strong> <span class="pill gold" style="font-size:.7rem">${MSG_TYPES[m.type]}</span><p class="no-tr" style="margin:4px 0 0;font-size:.88rem">${esc(m.message.slice(0, 140))}</p></div>`).join('') : '<div class="empty">ما في رسائل.</div>'}</div>` : ''}
      </div>
    </div>`;
  const log = $('aiLog');
  log.scrollTop = log.scrollHeight;
  const send = async text => {
    text = (text || '').trim();
    if (!text) return;
    aiChat.push({ role: 'user', content: text });
    log.insertAdjacentHTML('beforeend', aiBubble({ role: 'user', content: text }) + '<div class="ai-msg bot" id="aiTyping"><span class="dots">…</span></div>');
    log.scrollTop = log.scrollHeight;
    $('aiText').value = '';
    try {
      const { reply } = await api('/api/admin/ai', { method: 'POST', body: { message: text, history: aiChat.slice(-11, -1) } });
      aiChat.push({ role: 'assistant', content: reply });
    } catch (e) {
      aiChat.push({ role: 'assistant', content: `⚠️ ${e.message}` });
    }
    if (location.hash.slice(1) === 'ai') PAGES.ai();
  };
  $('aiForm').onsubmit = e => { e.preventDefault(); send($('aiText').value); };
  document.querySelectorAll('[data-q]').forEach(b => { b.onclick = () => send(b.dataset.q); });
  $('aiLang').onclick = () => { aiMicLang = aiMicLang === 'ar-SA' ? 'en-US' : 'ar-SA'; $('aiLang').textContent = aiMicLang === 'ar-SA' ? 'ع' : 'EN'; };
  $('aiMic').onclick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('المتصفح ما بيدعم الإدخال الصوتي، جرّب Chrome', true); return; }
    const r = new SR();
    r.lang = aiMicLang;
    r.onstart = () => $('aiMic').classList.add('listening');
    r.onend = () => $('aiMic').classList.remove('listening');
    r.onresult = ev => { $('aiText').value += ($('aiText').value ? ' ' : '') + ev.results[0][0].transcript; $('aiText').focus(); };
    r.start();
  };
  document.querySelectorAll('[data-speak]').forEach(b => {
    b.onclick = () => {
      if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
      const text = aiChat[Number(b.dataset.speak)] ? aiChat[Number(b.dataset.speak)].content : b.closest('.ai-msg').innerText;
      const u = new SpeechSynthesisUtterance(text);
      const ar = /[؀-ۿ]/.test(text);
      u.lang = ar ? 'ar-SA' : 'en-US';
      const v = speechSynthesis.getVoices().find(x => x.lang.startsWith(ar ? 'ar' : 'en'));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    };
  });
};

function aiBubble(m) {
  const i = aiChat.indexOf(m);
  return `<div class="ai-msg ${m.role === 'user' ? 'me' : 'bot'} no-tr">${esc(m.content).replace(/\n/g, '<br>')}${m.role === 'assistant' ? `<button class="ai-speak" data-speak="${i}" title="اسمع">🔊</button>` : ''}</div>`;
}

// ── Notify-me requests ──
// ── Team (owner) ──
const ROLE_LABEL = { owner: 'المالك', manager: 'مسؤول', employee: 'موظف' };
PAGES.team = async () => {
  const { items } = await api('/api/admin/team');
  $('page').innerHTML = pageHead('👥', 'الفريق', 'كل شخص بيدخل باسم مستخدم وكلمة سر خاصين فيه، وكل اللي بيعمله بينسجل باسمه بلوحة القائد.', `<div class="head-chips"><button class="btn" id="tmPrint">🖨 PDF</button></div>`) + `
    <div class="panel" style="margin-bottom:18px">
      <h3>＋ إضافة شخص للفريق</h3>
      <form class="team-form" id="teamForm" autocomplete="off">
        <label>الاسم<input class="input" id="tName" placeholder="مثلاً: أحمد" required></label>
        <label>اسم المستخدم<input class="input" id="tUser" dir="ltr" placeholder="ahmad" required autocapitalize="none" spellcheck="false"></label>
        <label>كلمة السر<input class="input" id="tPass" type="text" dir="ltr" placeholder="8 أحرف أو أكثر" required></label>
        <label>الصلاحية<select class="input" id="tRole"><option value="employee">موظف</option><option value="manager">مسؤول</option></select></label>
        <button class="btn gold" type="submit">إضافة</button>
      </form>
      <div class="roles-help">
        <div><strong>♛ المالك (انت)</strong>كل إشي، ومعه الفريق ولوحة القائد وسجل كل حركة.</div>
        <div><strong>مسؤول</strong>الطلبات والمنتجات والأسعار والعروض وأكواد الخصم والتقييمات وإعدادات الموقع.</div>
        <div><strong>موظف</strong>الطلبات (تأكيد وتوصيل وتسليم)، والتقييمات، وطلبات التنبيه بس.</div>
      </div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>الشخص</th><th>اسم المستخدم</th><th>الصلاحية</th><th class="hide-sm">آخر نشاط</th><th class="hide-sm">الحركات</th><th>فعّال</th><th></th></tr></thead>
      <tbody>${items.map(u => `
        <tr data-user="${esc(u.username)}">
          <td><div style="display:flex;align-items:center;gap:10px"><span class="avatar" style="width:34px;height:34px;font-size:1rem">${esc(u.name.charAt(0))}</span><strong>${esc(u.name)}</strong></div></td>
          <td dir="ltr" style="text-align:end">${esc(u.username)}</td>
          <td>${u.role === 'owner' ? '<span class="role-pill owner">المالك</span>' : `<select class="input" data-role style="width:auto;padding:7px 10px"><option value="employee"${u.role === 'employee' ? ' selected' : ''}>موظف</option><option value="manager"${u.role === 'manager' ? ' selected' : ''}>مسؤول</option></select>`}</td>
          <td class="hide-sm muted">${u.lastSeen ? fmtDate(u.lastSeen) : '—'}</td>
          <td class="hide-sm">${u.actions}</td>
          <td>${u.role === 'owner' ? '' : `<label class="switch"><input type="checkbox" data-active${u.active ? ' checked' : ''}><span></span></label>`}</td>
          <td>${u.role === 'owner' ? '' : '<div style="display:flex;gap:6px"><button class="btn sm" data-pass>🔑 كلمة سر</button><button class="icon-btn del" data-del title="حذف">🗑</button></div>'}</td>
        </tr>`).join('')}</tbody>
    </table></div>`;
  $('tmPrint').onclick = () => exportPrint('الفريق', ['الاسم', 'اسم المستخدم', 'الصلاحية', 'فعّال', 'آخر نشاط', 'الحركات'], items.map(u => [u.name, u.username, ROLE_LABEL[u.role], u.active ? 'نعم' : 'لا', u.lastSeen ? fmtDate(u.lastSeen) : '-', u.actions]));
  $('tUser').oninput = e => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''); };
  $('teamForm').onsubmit = async e => {
    e.preventDefault();
    try {
      await api('/api/admin/team', { method: 'POST', body: { name: $('tName').value, username: $('tUser').value, password: $('tPass').value, role: $('tRole').value } });
      toast(`تمت إضافة ${$('tName').value} ✅ ابعتله اسم المستخدم وكلمة السر`);
      PAGES.team();
    } catch (err) { toast(err.message, true); }
  };
  document.querySelectorAll('tr[data-user]').forEach(row => {
    const u = row.dataset.user;
    const patch = async (body, msg) => {
      try { await api(`/api/admin/team/${encodeURIComponent(u)}`, { method: 'PATCH', body }); toast(msg); PAGES.team(); } catch (err) { toast(err.message, true); }
    };
    const role = row.querySelector('[data-role]');
    if (role) role.onchange = () => patch({ role: role.value }, `صارت الصلاحية: ${ROLE_LABEL[role.value]}`);
    const active = row.querySelector('[data-active]');
    if (active) active.onchange = () => patch({ active: active.checked }, active.checked ? 'الحساب فعّال' : 'تم إيقاف الحساب، وما بيقدر يدخل');
    const pass = row.querySelector('[data-pass]');
    if (pass) pass.onclick = () => {
      const p = prompt('كلمة السر الجديدة (8 أحرف أو أكثر):');
      if (p) patch({ password: p }, 'تم تغيير كلمة السر، وانطلع من أي جهاز كان داخل منه');
    };
    const del = row.querySelector('[data-del]');
    if (del) del.onclick = async () => {
      if (!confirm('حذف هالشخص من الفريق؟ سجل حركاته بيضل محفوظ.')) return;
      try { await api(`/api/admin/team/${encodeURIComponent(u)}`, { method: 'DELETE' }); PAGES.team(); } catch (err) { toast(err.message, true); }
    };
  });
};

// ── Leader view (owner): who did what, and reviews that need attention ──
const KIND_AR = { order: 'الطلبات', product: 'المنتجات', coupon: 'أكواد الخصم', offer: 'العروض', review: 'التقييمات', notify: 'التنبيهات', message: 'الرسائل', job: 'الوظائف', application: 'طلبات التوظيف', ai: 'المساعد الذكي', settings: 'الإعدادات', team: 'الفريق', auth: 'الدخول والخروج', view: 'فتح صفحات', export: 'تصدير' };
const leaderQuery = { user: '', kind: '', q: '' };
let leaderTimer = null;
PAGES.leader = async () => {
  const [{ items, critical }, team] = await Promise.all([
    api(`/api/admin/activity?user=${encodeURIComponent(leaderQuery.user)}&kind=${encodeURIComponent(leaderQuery.kind)}`),
    api('/api/admin/team'),
  ]);
  const q = leaderQuery.q.trim();
  const rows = q ? items.filter(l => `${l.text} ${l.by ? l.by.name : ''}`.includes(q)) : items;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Amman' });
  const isToday = l => new Date(l.at).toLocaleDateString('en-CA', { timeZone: 'Asia/Amman' }) === today;
  window.__leaderRows = rows;
  $('page').innerHTML = pageHead('♛', 'لوحة القائد', 'مين عمل شو ومتى: كل تأكيد طلب، تعديل سعر، كود خصم، تقييم، ودخول وخروج. بتتحدث لحالها كل 15 ثانية.', `
    <div class="head-chips">
      <div class="chip"><small>الفريق</small><strong>${team.items.length}</strong></div>
      <div class="chip"><small>حركات اليوم</small><strong>${items.filter(isToday).filter(l => l.by).length}</strong></div>
      <div class="chip"><small>تحتاج متابعة</small><strong style="color:var(--danger)">${critical.length}</strong></div>
      <button class="btn" id="exportLog">⬇ Excel</button>
      <button class="btn" id="printLog">🖨 PDF</button>
    </div>`) + `
    <div class="stats" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      ${team.items.map(u => {
        const mine = items.filter(l => l.by && l.by.u === u.username);
        return `<div class="stat">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span class="avatar" style="width:38px;height:38px;font-size:1.1rem">${esc(u.name.charAt(0))}</span><div><strong>${esc(u.name)}</strong><div><span class="role-pill ${u.role}">${ROLE_LABEL[u.role]}</span></div></div></div>
          <div class="label">اليوم: ${mine.filter(isToday).length} حركة · طلبات: ${mine.filter(l => l.kind === 'order').length}</div>
          <div class="foot">آخر نشاط: ${u.lastSeen ? fmtDate(u.lastSeen) : '—'}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="grid-2">
      <div class="panel" style="padding:0;overflow:hidden">
        <div class="toolbar" style="padding:16px 18px 0">
          <select class="input" id="lUser"><option value="">كل الأشخاص</option>${team.items.map(u => `<option value="${esc(u.username)}"${u.username === leaderQuery.user ? ' selected' : ''}>${esc(u.name)}</option>`).join('')}<option value="customers"${leaderQuery.user === 'customers' ? ' selected' : ''}>الزباين</option></select>
          <select class="input" id="lKind"><option value="">كل الأقسام</option>${Object.entries(KIND_AR).map(([k, v]) => `<option value="${k}"${k === leaderQuery.kind ? ' selected' : ''}>${v}</option>`).join('')}</select>
          <input class="input grow" id="lSearch" placeholder="ابحث بالسجل…" value="${esc(leaderQuery.q)}">
        </div>
        <div style="max-height:620px;overflow-y:auto"><table>
          <thead><tr><th>الوقت</th><th>الشخص</th><th class="hide-sm">القسم</th><th>التفاصيل</th></tr></thead>
          <tbody>${rows.slice(0, 300).map(l => `<tr>
            <td class="muted" dir="ltr" style="text-align:end;white-space:nowrap">${fmtDate(l.at)}</td>
            <td><strong>${l.by ? esc(l.by.name) : '<span class="muted">زبون</span>'}</strong></td>
            <td class="hide-sm"><span class="pill gold">${KIND_AR[l.kind] || l.kind}</span></td>
            <td>${esc(l.text)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">ما في حركات</td></tr>'}</tbody>
        </table></div>
      </div>
      <div class="panel">
        <h3>⚠️ تحتاج متابعة <span class="tag">تقييم 3 نجوم أو أقل · شكاوى</span></h3>
        ${critical.length ? critical.map(r => `
          <div style="border-bottom:1px dashed var(--border);padding:10px 0">
            <div style="display:flex;justify-content:space-between;gap:8px"><strong class="no-tr">${esc(r.name)}</strong>${r.kind === 'review' ? `<span class="rv-stars">${'★'.repeat(r.rating)}<i>${'★'.repeat(5 - r.rating)}</i></span>` : '<span class="pill bad">رسالة</span>'}</div>
            <div class="muted no-tr" style="font-size:.8rem">${esc(r.about || '')} · ${fmtDate(r.at)}</div>
            ${r.text ? `<p class="no-tr" style="margin:6px 0 0">${esc(r.text)}</p>` : ''}
          </div>`).join('') + '<div style="display:flex;gap:8px;margin-top:12px"><a class="btn sm" href="#reviews">التقييمات</a><a class="btn sm" href="#messages">الرسائل</a></div>'
          : '<div class="empty"><div class="big">🌷</div>ما في تقييمات منخفضة.</div>'}
      </div>
    </div>`;
  $('lUser').onchange = e => { leaderQuery.user = e.target.value; PAGES.leader(); };
  $('lKind').onchange = e => { leaderQuery.kind = e.target.value; PAGES.leader(); };
  let t;
  $('lSearch').oninput = e => { clearTimeout(t); t = setTimeout(() => { leaderQuery.q = e.target.value; PAGES.leader().then(() => { const i = $('lSearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 300); };
  $('printLog').onclick = () => exportPrint('سجل نشاط الفريق', ['الوقت', 'الشخص', 'الصلاحية', 'القسم', 'التفاصيل'],
    (window.__leaderRows || []).map(l => [fmtDate(l.at), l.by ? l.by.name : 'زبون', l.by ? ROLE_LABEL[l.by.role] || '' : '', KIND_AR[l.kind] || l.kind, l.text]));
  $('exportLog').onclick = () => {
    track('export', 'leader', 'سجل نشاط الفريق (Excel)');
    const csv = '\ufeff' + [['الوقت', 'الشخص', 'الصلاحية', 'القسم', 'التفاصيل']]
      .concat((window.__leaderRows || []).map(l => [fmtDate(l.at), l.by ? l.by.name : 'زبون', l.by ? ROLE_LABEL[l.by.role] || '' : '', KIND_AR[l.kind] || l.kind, l.text]))
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `zahrat-beesan-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  clearInterval(leaderTimer);
  leaderTimer = setInterval(() => {
    if ((location.hash.slice(1) || '') !== 'leader') { clearInterval(leaderTimer); return; }
    if (document.activeElement && document.activeElement.id === 'lSearch') return;
    PAGES.leader().catch(() => {});
  }, 15000);
};

PAGES.notify = async () => {
  const { items } = await api('/api/admin/notify');
  $('page').innerHTML = pageHead('🔔', 'طلبات التنبيه', 'المنتجات اللي الزباين طلبوا يتبلغوا لما ترجع. الزبون بيبعتلك كمان على واتساب.', `<div class="head-chips"><button class="btn" id="ntPrint">🖨 PDF</button></div>`) + (items.length ? `
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
  $('ntPrint').onclick = () => exportPrint('طلبات التنبيه', ['المنتج', 'الدار', 'بانتظار', 'الكل', 'متوفر الآن', 'آخر طلب'], items.map(n => [n.title, HOUSE_AR[n.house] || '', n.open, n.count, n.inStock ? 'نعم' : 'لا', fmtDate(n.last)]));
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
      <div class="set-row col">
        <div><h4>استقبال الطلبات</h4><p>تلقائي: الموقع بيستقبل طلبات بس خلال ساعات الدوام. مفتوح أو مغلق: انت بتقرر. لما يكون مغلق، زر "أكمل الطلب" بيختفي.</p></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          ${Object.entries(STORE_MODES).map(([k, v]) => `<button type="button" class="btn sm${(s.storeMode || (s.ordersOpen === false ? 'closed' : 'open')) === k ? ' gold' : ''}" data-mode="${k}">${v}</button>`).join('')}
          <span class="inline-field" style="margin-inline-start:auto">الدوام من <input class="input" type="time" id="hFrom" value="${esc((s.hours || {}).from || '10:00')}" style="width:120px"> إلى <input class="input" type="time" id="hTo" value="${esc((s.hours || {}).to || '23:00')}" style="width:120px"></span>
        </div>
      </div>
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
      if ('ordersOpen' in body || 'storeMode' in body) poll();
    } catch (e) { toast(e.message, true); }
  };
  document.querySelectorAll('[data-set]').forEach(i => {
    i.onchange = () => {
      if (i.dataset.set === 'announcementOn') return $('saveAnn').click();
      save({ [i.dataset.set]: i.checked });
    };
  });
  document.querySelectorAll('[data-mode]').forEach(b => {
    b.onclick = async () => { await save({ storeMode: b.dataset.mode }, `وضع المتجر: ${STORE_MODES[b.dataset.mode]}`); poll(); PAGES.settings(); };
  });
  $('hFrom').onchange = $('hTo').onchange = () => save({ hours: { from: $('hFrom').value, to: $('hTo').value } }, `ساعات الدوام: ${$('hFrom').value} – ${$('hTo').value}`);
  $('freeDelivery').onchange = e => save({ freeDeliveryJod: Number(e.target.value) }, Number(e.target.value) ? `توصيل مجاني فوق ${e.target.value} د.أ` : 'تم إخفاء شريط التوصيل المجاني');
  $('saveAnn').onclick = () => save({ announcement: { enabled: document.querySelector('[data-set="announcementOn"]').checked, ar: $('annAr').value, en: $('annEn').value } }, 'تم حفظ الإعلان');
  document.querySelectorAll('[data-house]').forEach(i => {
    i.onchange = () => save({ hiddenHouses: [...document.querySelectorAll('[data-house]')].filter(x => !x.checked).map(x => x.dataset.house) });
  });
};

boot();
