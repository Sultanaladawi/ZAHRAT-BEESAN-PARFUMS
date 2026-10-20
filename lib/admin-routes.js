// ══════════════════════════════════════════════════════════
// 👑 Dashboard API: login, stats, products, orders, coupons, offers,
// notify-me requests and site settings. Also the small public endpoints the
// store calls (coupon check, order log, notify-me) and the public config
// that decides what the site shows.
// ══════════════════════════════════════════════════════════

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const store = require('./admin-store');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET
  || crypto.createHash('sha256').update(`zb-admin|${ADMIN_PASSWORD}`).digest('hex');
const SESSION_DAYS = 7;
const COOKIE = 'zb_admin';

const HOUSES = [
  { id: 'ghalati', file: 'perfumes', ar: 'غلاتي', en: 'Ghalati' },
  { id: 'assaf', file: 'assaf_perfumes', ar: 'عساف', en: 'Assaf' },
  { id: 'thunayan', file: 'thnyan_perfumes', ar: 'ثنيان', en: 'Thnyan' },
  { id: 'rasasi', file: 'rasasi_perfumes', ar: 'الرصاصي', en: 'Rasasi' },
  { id: 'al-rehab', file: 'alrehab_perfumes', ar: 'الرحاب', en: 'Al-Rehab' },
  { id: 'labonair', file: 'lebonheur_perfumes', ar: 'لو بانهور', en: 'Le Bonheur' },
  { id: 'laverne', file: 'laverne_perfumes', ar: 'لافيرن', en: 'Laverne' },
  { id: 'deraah', file: 'deraah_perfumes', ar: 'درعة', en: 'Deraah' },
];

// Offer rules live in public/js/cart.js; the dashboard can switch each one
// off and change its profit.
const OFFERS = [
  { key: 'assaf-3+1', house: 'assaf', ar: 'عساف: اشترِ 3 والرابع مجاناً', size: 4, profit: 10 },
  { key: 'assaf-2+1', house: 'assaf', ar: 'عساف: اشترِ 2 والثالث مجاناً', size: 3, profit: 10 },
  { key: 'ghalati-2', house: 'ghalati', ar: 'غلاتي: أي عطرين بسعر مميز', size: 2, profit: 10 },
  { key: 'thnyan-4', house: 'thunayan', ar: 'ثنيان: أي 4 عطور بسعر مميز', size: 4, profit: 15 },
  { key: 'rasasi-2+1', house: 'rasasi', ar: 'الرصاصي: اشترِ 2 والثالث مجاناً', size: 3, profit: 10 },
];

const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// ── Catalog (read from the house files) ──
let catalog = null;
function loadCatalog() {
  if (catalog) return catalog;
  catalog = { list: [], byId: new Map() };
  for (const h of HOUSES) {
    try {
      const items = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'data', `${h.file}.json`), 'utf8'));
      for (const p of items) {
        if (!p || !p.id) continue;
        const item = { ...p, houseId: h.id };
        catalog.list.push(item);
        catalog.byId.set(String(p.id), item);
      }
    } catch (e) { /* skip a missing file */ }
  }
  return catalog;
}

const isOut = p => p.isAvailable === false || p.status === 'out';
const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};
const str = (v, max = 200) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const ammanDay = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Amman' });

// ── Overrides the store applies to the catalog ──
function publicConfig(state) {
  const s = state.settings;
  const hidden = [], featured = [], prices = {};
  for (const [id, o] of Object.entries(state.products || {})) {
    if (o.hidden) hidden.push(id);
    if (o.featured) featured.push(id);
    if (o.priceJod) prices[id] = o.priceJod;
  }
  // Approved reviews: [average, count] per product, and the ones pinned to the home page.
  const ratings = {};
  const approved = (state.reviews || []).filter(r => r.status === 'approved');
  for (const r of approved) {
    const cur = ratings[r.productId] || [0, 0];
    ratings[r.productId] = [cur[0] + r.rating, cur[1] + 1];
  }
  for (const id of Object.keys(ratings)) ratings[id] = [Math.round(ratings[id][0] / ratings[id][1] * 10) / 10, ratings[id][1]];
  const homeReviews = approved.filter(r => r.home).slice(0, 12).map(publicReview);
  const now = Date.now();
  const liveCoupons = (state.coupons || []).some(c => c.active && (!c.expiresAt || Date.parse(c.expiresAt) > now)
    && (!c.maxUses || (c.uses || 0) < c.maxUses));
  return {
    ordersOpen: s.ordersOpen !== false,
    freeDeliveryJod: Number(s.freeDeliveryJod) || 0,
    couponsEnabled: s.couponsEnabled !== false && liveCoupons,
    showQuiz: s.showQuiz !== false,
    showRecent: s.showRecent !== false,
    announcement: s.announcement && s.announcement.enabled ? { ar: s.announcement.ar, en: s.announcement.en } : null,
    hiddenHouses: s.hiddenHouses || [],
    offers: s.offers || {},
    reviewsEnabled: s.reviewsEnabled !== false,
    ratings: s.reviewsEnabled !== false ? ratings : {},
    homeReviews: s.reviewsEnabled !== false ? homeReviews : [],
    hidden,
    featured,
    prices,
  };
}

function publicReview(r) {
  return { id: r.id, productId: r.productId, productTitle: r.productTitle, name: r.name, city: r.city, rating: r.rating, text: r.text, reply: r.reply || '', at: r.at };
}

function applyOverrides(list, cfg) {
  if (!Array.isArray(list)) return list;
  const hidden = new Set(cfg.hidden);
  const featured = new Set(cfg.featured);
  return list.filter(p => p && !hidden.has(String(p.id))).map(p => {
    const id = String(p.id);
    if (!cfg.prices[id] && !featured.has(id)) return p;
    const out = { ...p };
    if (cfg.prices[id]) {
      if (!out.origJod || out.origJod < out.finalJod) out.origJod = out.finalJod;
      out.finalJod = cfg.prices[id];
      out.priceOverridden = true;
    }
    if (featured.has(id)) out.featured = true;
    return out;
  });
}

function findCoupon(state, code) {
  const c = (state.coupons || []).find(x => x.code === str(code, 40).toUpperCase());
  if (!c) return { error: 'الكود غير صحيح' };
  if (!c.active) return { error: 'الكود غير فعّال' };
  if (c.expiresAt && Date.parse(c.expiresAt) < Date.now()) return { error: 'انتهت صلاحية الكود' };
  if (c.maxUses && (c.uses || 0) >= c.maxUses) return { error: 'انتهى عدد استخدامات الكود' };
  return { coupon: c };
}

// ── Sessions ──
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token) {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return null;
  const good = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  if (good.length !== mac.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(mac))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp > Date.now() ? payload : null;
  } catch (e) { return null; }
}

function readCookie(req, name) {
  const m = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : '';
}

function requireAdmin(req, res, next) {
  if (!ADMIN_PASSWORD || !verify(readCookie(req, COOKIE))) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// Tiny per-IP limiter for the login and public write endpoints.
const hits = new Map();
function limited(req, bucket, max, windowMs) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const key = `${bucket}|${ip}`;
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

const wrap = fn => (req, res) => Promise.resolve(fn(req, res)).catch(err => {
  console.error('[admin]', err.message);
  res.status(500).json({ error: err.message || 'server error' });
});

function mountAdmin(app) {
  // ── Public ──
  app.get('/api/site-config', wrap(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(publicConfig(await store.getState()));
  }));

  app.post('/api/coupon', wrap(async (req, res) => {
    if (limited(req, 'coupon', 20, 10 * 60 * 1000)) return res.status(429).json({ error: 'محاولات كثيرة، جرّب بعد قليل' });
    const state = await store.getState();
    const { coupon, error } = findCoupon(state, req.body && req.body.code);
    if (error) return res.status(404).json({ error });
    const subtotal = num(req.body.subtotalJod, 0, 1e6) || 0;
    if (coupon.minJod && subtotal < coupon.minJod) {
      return res.status(400).json({ error: `الكود يعمل على الطلبات من ${coupon.minJod} د.أ وأكثر`, minJod: coupon.minJod });
    }
    res.json({ code: coupon.code, pct: coupon.pct, minJod: coupon.minJod || 0 });
  }));

  app.post('/api/orders', wrap(async (req, res) => {
    if (limited(req, 'order', 12, 10 * 60 * 1000)) return res.status(429).json({ error: 'too many' });
    const b = req.body || {};
    const ref = /^ZB-[A-Z0-9]{5}$/.test(b.ref) ? b.ref : null;
    const lines = (Array.isArray(b.lines) ? b.lines : []).slice(0, 60).map(l => ({
      id: str(l.id, 80), title: str(l.title, 160), qty: num(l.qty, 1, 99) || 1, unitJod: num(l.unitJod, 0, 10000) || 0,
    })).filter(l => l.id);
    if (!ref || !lines.length) return res.status(400).json({ error: 'bad order' });
    const order = await store.update(`Order ${ref}`, state => {
      if (state.orders.some(o => o.ref === ref)) return state.orders.find(o => o.ref === ref);
      const cat = loadCatalog();
      let couponCode = null;
      if (b.coupon) {
        const { coupon } = findCoupon(state, b.coupon);
        if (coupon) { coupon.uses = (coupon.uses || 0) + 1; couponCode = coupon.code; }
      }
      const o = {
        ref,
        at: new Date().toISOString(),
        status: 'new',
        lines: lines.map(l => ({ ...l, house: (cat.byId.get(l.id) || {}).houseId || '' })),
        subtotalJod: num(b.subtotalJod, 0, 1e6) || 0,
        discountJod: num(b.discountJod, 0, 1e6) || 0,
        totalJod: num(b.totalJod, 0, 1e6) || 0,
        coupon: couponCode,
        freeDelivery: !!b.freeDelivery,
        currency: str(b.currency, 8),
        note: '',
      };
      state.orders = [o, ...state.orders].slice(0, store.MAX_ORDERS);
      store.addLog(state, `طلب جديد ${ref} بقيمة ${o.totalJod} د.أ`, 'order');
      return o;
    });
    res.json({ ok: true, ref: order.ref });
  }));

  app.post('/api/notify', wrap(async (req, res) => {
    if (limited(req, 'notify', 15, 10 * 60 * 1000)) return res.status(429).json({ error: 'too many' });
    const p = loadCatalog().byId.get(str(req.body && req.body.id, 80));
    if (!p) return res.status(404).json({ error: 'unknown product' });
    await store.update(`Notify ${p.id}`, state => {
      state.notify = [{ id: String(p.id), title: p.title, house: p.houseId, at: new Date().toISOString(), done: false }, ...state.notify]
        .slice(0, store.MAX_NOTIFY);
      store.addLog(state, `طلب تنبيه: ${p.title}`, 'notify');
    });
    res.json({ ok: true });
  }));

  // ── Reviews (public) ──
  app.get('/api/reviews', wrap(async (req, res) => {
    const state = await store.getState();
    if (state.settings.reviewsEnabled === false) return res.json({ items: [], avg: 0, count: 0 });
    const id = str(req.query.product, 80);
    const items = state.reviews.filter(r => r.status === 'approved' && r.productId === id).map(publicReview);
    const avg = items.length ? Math.round(items.reduce((n, r) => n + r.rating, 0) / items.length * 10) / 10 : 0;
    res.setHeader('Cache-Control', 'no-store');
    res.json({ items, avg, count: items.length });
  }));

  app.post('/api/reviews', wrap(async (req, res) => {
    const b = req.body || {};
    if (b.website) return res.json({ ok: true }); // bots fill the hidden field
    if (limited(req, 'review', 5, 60 * 60 * 1000)) return res.status(429).json({ error: 'استلمنا تقييماتك، شكراً لك 🌷' });
    const p = loadCatalog().byId.get(str(b.productId, 80));
    const rating = Math.round(num(b.rating, 1, 5) || 0);
    const name = str(b.name, 40);
    const text = str(b.text, 600);
    if (!p || !rating || name.length < 2 || text.length < 3) return res.status(400).json({ error: 'اكتب اسمك وتقييمك من فضلك' });
    await store.update(`Review ${p.id}`, state => {
      state.reviews = [{
        id: crypto.randomBytes(6).toString('hex'), productId: String(p.id), productTitle: p.title, house: p.houseId,
        name, city: str(b.city, 40), rating, text, at: new Date().toISOString(), status: 'pending', source: 'customer', home: false, reply: '',
      }, ...state.reviews].slice(0, store.MAX_REVIEWS);
      store.addLog(state, `تقييم جديد ${'★'.repeat(rating)} على ${p.title} من ${name}`, 'review');
    });
    res.json({ ok: true });
  }));

  // ── Login ──
  app.post('/api/admin/login', wrap(async (req, res) => {
    if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'لم يتم ضبط كلمة سر لوحة التحكم بعد (ADMIN_PASSWORD).' });
    if (limited(req, 'login', 8, 15 * 60 * 1000)) return res.status(429).json({ error: 'محاولات كثيرة، جرّب بعد 15 دقيقة.' });
    const given = crypto.createHash('sha256').update(String((req.body && req.body.password) || '')).digest();
    const wanted = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
    if (!crypto.timingSafeEqual(given, wanted)) return res.status(401).json({ error: 'كلمة السر غير صحيحة' });
    const exp = Date.now() + SESSION_DAYS * 864e5;
    const secure = (req.headers['x-forwarded-proto'] || req.protocol) === 'https' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(sign({ exp }))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}${secure}`);
    store.update('Login', state => store.addLog(state, 'تسجيل دخول إلى لوحة التحكم', 'auth')).catch(() => {});
    res.json({ ok: true });
  }));

  app.post('/api/admin/logout', (req, res) => {
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    res.json({ ok: true });
  });

  app.get('/api/admin/me', wrap(async (req, res) => {
    const loggedIn = !!(ADMIN_PASSWORD && verify(readCookie(req, COOKIE)));
    if (loggedIn) await store.getState();
    res.json({ loggedIn, configured: !!ADMIN_PASSWORD, storage: store.storageMode(), storageError: loggedIn ? store.storageError() : '' });
  }));

  app.use('/api/admin', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    requireAdmin(req, res, next);
  });

  // ── Dashboard ──
  app.get('/api/admin/stats', wrap(async (req, res) => {
    const state = await store.getState();
    const cat = loadCatalog();
    const today = ammanDay(Date.now());
    const live = state.orders.filter(o => o.status !== 'cancelled');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = ammanDay(Date.now() - i * 864e5);
      const list = live.filter(o => ammanDay(o.at) === day);
      days.push({ day, orders: list.length, revenue: list.reduce((n, o) => n + o.totalJod, 0) });
    }
    const houses = HOUSES.map(h => {
      const items = cat.list.filter(p => p.houseId === h.id);
      return {
        id: h.id, ar: h.ar, total: items.length,
        out: items.filter(isOut).length,
        hidden: items.filter(p => (state.products[p.id] || {}).hidden).length,
        off: (state.settings.hiddenHouses || []).includes(h.id),
      };
    });
    const sold = new Map();
    for (const o of live) for (const l of o.lines) {
      const e = sold.get(l.id) || { id: l.id, title: l.title, qty: 0, revenue: 0 };
      e.qty += l.qty; e.revenue += l.qty * l.unitJod;
      sold.set(l.id, e);
    }
    const todayOrders = live.filter(o => ammanDay(o.at) === today);
    res.json({
      storage: store.storageMode(),
      ordersOpen: state.settings.ordersOpen !== false,
      totals: {
        products: cat.list.length,
        available: cat.list.filter(p => !isOut(p)).length,
        out: cat.list.filter(isOut).length,
        hidden: Object.values(state.products).filter(o => o.hidden).length,
        featured: Object.values(state.products).filter(o => o.featured).length,
        orders: live.length,
        newOrders: state.orders.filter(o => o.status === 'new').length,
        revenue: live.reduce((n, o) => n + o.totalJod, 0),
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((n, o) => n + o.totalJod, 0),
        coupons: state.coupons.filter(c => c.active).length,
        notify: state.notify.filter(n => !n.done).length,
        reviews: (state.reviews || []).filter(r => r.status === 'pending').length,
      },
      days,
      houses,
      top: [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 6),
      log: state.log.slice(0, 25),
    });
  }));

  // ── Products ──
  app.get('/api/admin/products', wrap(async (req, res) => {
    const state = await store.getState();
    const q = str(req.query.q, 80).toLowerCase();
    const house = str(req.query.house, 30);
    const filter = str(req.query.filter, 20);
    const page = Math.max(1, Number(req.query.page) || 1);
    const per = 40;
    let list = loadCatalog().list.map(p => {
      const o = state.products[p.id] || {};
      return {
        id: p.id, title: p.title, titleEn: p.titleEn || '', house: p.houseId,
        image: String(p.image || ''), priceJod: Number(p.finalJod) || 0, supplierJod: Number(p.baseJod) || 0,
        out: isOut(p), hidden: !!o.hidden, featured: !!o.featured, priceOverride: o.priceJod || null,
        type: p.categoryType || '',
      };
    });
    if (house) list = list.filter(p => p.house === house);
    if (q) list = list.filter(p => `${p.title} ${p.titleEn} ${p.id}`.toLowerCase().includes(q));
    if (filter === 'out') list = list.filter(p => p.out);
    if (filter === 'hidden') list = list.filter(p => p.hidden);
    if (filter === 'featured') list = list.filter(p => p.featured);
    if (filter === 'price') list = list.filter(p => p.priceOverride);
    if (filter === 'available') list = list.filter(p => !p.out);
    res.json({ total: list.length, page, pages: Math.max(1, Math.ceil(list.length / per)), items: list.slice((page - 1) * per, page * per) });
  }));

  app.patch('/api/admin/products/:id', wrap(async (req, res) => {
    const p = loadCatalog().byId.get(String(req.params.id));
    if (!p) return res.status(404).json({ error: 'not found' });
    const b = req.body || {};
    const saved = await store.update(`Product ${p.id}`, state => {
      const o = { ...(state.products[p.id] || {}) };
      const notes = [];
      if ('hidden' in b) { o.hidden = !!b.hidden; notes.push(o.hidden ? 'إخفاء' : 'إظهار'); }
      if ('featured' in b) { o.featured = !!b.featured; notes.push(o.featured ? 'تمييز' : 'إلغاء التمييز'); }
      if ('priceJod' in b) {
        const v = b.priceJod === null || b.priceJod === '' ? null : num(b.priceJod, 1, 10000);
        o.priceJod = v ? Math.round(v * 100) / 100 : undefined;
        notes.push(v ? `سعر ${o.priceJod} د.أ` : 'رجوع للسعر الأصلي');
      }
      Object.keys(o).forEach(k => { if (!o[k]) delete o[k]; });
      if (Object.keys(o).length) state.products[p.id] = o; else delete state.products[p.id];
      store.addLog(state, `${p.title}: ${notes.join('، ')}`, 'product');
      return o;
    });
    res.json({ ok: true, override: saved });
  }));

  // ── Orders ──
  app.get('/api/admin/orders', wrap(async (req, res) => {
    const state = await store.getState();
    const status = str(req.query.status, 20);
    res.json({ items: status ? state.orders.filter(o => o.status === status) : state.orders, statuses: ORDER_STATUSES });
  }));

  app.patch('/api/admin/orders/:ref', wrap(async (req, res) => {
    const b = req.body || {};
    const o = await store.update(`Order ${req.params.ref} update`, state => {
      const order = state.orders.find(x => x.ref === req.params.ref);
      if (!order) return null;
      if (ORDER_STATUSES.includes(b.status)) order.status = b.status;
      if ('note' in b) order.note = str(b.note, 500);
      if ('customer' in b) order.customer = str(b.customer, 120);
      store.addLog(state, `الطلب ${order.ref}: ${order.status}`, 'order');
      return order;
    });
    if (!o) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true, order: o });
  }));

  app.delete('/api/admin/orders/:ref', wrap(async (req, res) => {
    await store.update(`Order ${req.params.ref} delete`, state => {
      state.orders = state.orders.filter(x => x.ref !== req.params.ref);
      store.addLog(state, `حذف الطلب ${req.params.ref}`, 'order');
    });
    res.json({ ok: true });
  }));

  // ── Coupons ──
  app.get('/api/admin/coupons', wrap(async (req, res) => {
    res.json({ items: (await store.getState()).coupons });
  }));

  app.post('/api/admin/coupons', wrap(async (req, res) => {
    const b = req.body || {};
    const code = str(b.code, 24).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const pct = num(b.pct, 1, 90);
    if (code.length < 4 || !pct) return res.status(400).json({ error: 'الكود لازم يكون 4 أحرف أو أكثر، والخصم بين 1 و 90٪' });
    const result = await store.update(`Coupon ${code}`, state => {
      if (state.coupons.some(c => c.code === code)) return { error: 'هذا الكود موجود' };
      const c = {
        code, pct: Math.round(pct),
        minJod: num(b.minJod, 0, 10000) || 0,
        maxUses: Math.round(num(b.maxUses, 0, 100000) || 0),
        uses: 0,
        expiresAt: b.expiresAt && !Number.isNaN(Date.parse(b.expiresAt)) ? new Date(b.expiresAt).toISOString() : null,
        note: str(b.note, 120),
        active: true,
        createdAt: new Date().toISOString(),
      };
      state.coupons.unshift(c);
      store.addLog(state, `كود خصم جديد ${code} (${c.pct}٪)`, 'coupon');
      return { coupon: c };
    });
    if (result.error) return res.status(409).json(result);
    res.json({ ok: true, coupon: result.coupon });
  }));

  app.patch('/api/admin/coupons/:code', wrap(async (req, res) => {
    const b = req.body || {};
    const c = await store.update(`Coupon ${req.params.code} update`, state => {
      const coupon = state.coupons.find(x => x.code === req.params.code);
      if (!coupon) return null;
      if ('active' in b) coupon.active = !!b.active;
      if ('pct' in b && num(b.pct, 1, 90)) coupon.pct = Math.round(num(b.pct, 1, 90));
      if ('minJod' in b) coupon.minJod = num(b.minJod, 0, 10000) || 0;
      if ('maxUses' in b) coupon.maxUses = Math.round(num(b.maxUses, 0, 100000) || 0);
      if ('expiresAt' in b) coupon.expiresAt = b.expiresAt && !Number.isNaN(Date.parse(b.expiresAt)) ? new Date(b.expiresAt).toISOString() : null;
      if ('note' in b) coupon.note = str(b.note, 120);
      store.addLog(state, `تعديل الكود ${coupon.code}${'active' in b ? (coupon.active ? ' (تفعيل)' : ' (إيقاف)') : ''}`, 'coupon');
      return coupon;
    });
    if (!c) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true, coupon: c });
  }));

  app.delete('/api/admin/coupons/:code', wrap(async (req, res) => {
    await store.update(`Coupon ${req.params.code} delete`, state => {
      state.coupons = state.coupons.filter(x => x.code !== req.params.code);
      store.addLog(state, `حذف الكود ${req.params.code}`, 'coupon');
    });
    res.json({ ok: true });
  }));

  // ── Offers ──
  app.get('/api/admin/offers', wrap(async (req, res) => {
    const offers = (await store.getState()).settings.offers || {};
    res.json({ items: OFFERS.map(o => ({ ...o, enabled: (offers[o.key] || {}).enabled !== false, profit: (offers[o.key] || {}).profit || o.profit, defaultProfit: o.profit })) });
  }));

  app.patch('/api/admin/offers/:key', wrap(async (req, res) => {
    const rule = OFFERS.find(o => o.key === req.params.key);
    if (!rule) return res.status(404).json({ error: 'not found' });
    const b = req.body || {};
    await store.update(`Offer ${rule.key}`, state => {
      const cur = { ...(state.settings.offers[rule.key] || {}) };
      if ('enabled' in b) cur.enabled = !!b.enabled;
      if ('profit' in b && num(b.profit, 0, 500) !== null) cur.profit = num(b.profit, 0, 500);
      state.settings.offers[rule.key] = cur;
      store.addLog(state, `${rule.ar}: ${cur.enabled === false ? 'متوقف' : 'فعّال'}، ربح ${cur.profit ?? rule.profit} د.أ`, 'offer');
    });
    res.json({ ok: true });
  }));

  // ── Notify-me requests ──
  app.get('/api/admin/notify', wrap(async (req, res) => {
    const state = await store.getState();
    const cat = loadCatalog();
    const groups = new Map();
    for (const n of state.notify) {
      const g = groups.get(n.id) || { id: n.id, title: n.title, house: n.house, count: 0, open: 0, last: n.at, inStock: false };
      g.count += 1;
      if (!n.done) g.open += 1;
      if (n.at > g.last) g.last = n.at;
      const p = cat.byId.get(n.id);
      g.inStock = !!(p && !isOut(p));
      groups.set(n.id, g);
    }
    res.json({ items: [...groups.values()].sort((a, b) => b.open - a.open || (b.last > a.last ? 1 : -1)) });
  }));

  app.patch('/api/admin/notify/:id', wrap(async (req, res) => {
    await store.update(`Notify ${req.params.id} done`, state => {
      state.notify.forEach(n => { if (n.id === req.params.id) n.done = true; });
      store.addLog(state, `تم التعامل مع طلبات التنبيه للمنتج ${req.params.id}`, 'notify');
    });
    res.json({ ok: true });
  }));

  // ── Reviews (dashboard) ──
  app.get('/api/admin/reviews', wrap(async (req, res) => {
    const state = await store.getState();
    const status = str(req.query.status, 20);
    res.json({ items: status ? state.reviews.filter(r => r.status === status) : state.reviews });
  }));

  // Reviews the owner received elsewhere (WhatsApp, Instagram) can be added by hand.
  app.post('/api/admin/reviews', wrap(async (req, res) => {
    const b = req.body || {};
    const p = loadCatalog().byId.get(str(b.productId, 80));
    const rating = Math.round(num(b.rating, 1, 5) || 0);
    if (!p || !rating || str(b.name, 40).length < 2) return res.status(400).json({ error: 'اختار المنتج واكتب اسم الزبون والتقييم' });
    const review = await store.update(`Review ${p.id} (admin)`, state => {
      const r = {
        id: crypto.randomBytes(6).toString('hex'), productId: String(p.id), productTitle: p.title, house: p.houseId,
        name: str(b.name, 40), city: str(b.city, 40), rating, text: str(b.text, 600), at: new Date().toISOString(),
        status: 'approved', source: str(b.source, 20) || 'whatsapp', home: !!b.home, reply: '',
      };
      state.reviews.unshift(r);
      store.addLog(state, `أُضيف تقييم ${r.name} على ${p.title}`, 'review');
      return r;
    });
    res.json({ ok: true, review });
  }));

  app.patch('/api/admin/reviews/:id', wrap(async (req, res) => {
    const b = req.body || {};
    const r = await store.update(`Review ${req.params.id} update`, state => {
      const review = state.reviews.find(x => x.id === req.params.id);
      if (!review) return null;
      if (['pending', 'approved', 'hidden'].includes(b.status)) review.status = b.status;
      if ('home' in b) review.home = !!b.home;
      if ('reply' in b) review.reply = str(b.reply, 400);
      store.addLog(state, `تقييم ${review.name}: ${{ approved: 'منشور', hidden: 'مخفي', pending: 'بانتظار المراجعة' }[review.status]}${review.home ? ' · بالرئيسية' : ''}`, 'review');
      return review;
    });
    if (!r) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true, review: r });
  }));

  app.delete('/api/admin/reviews/:id', wrap(async (req, res) => {
    await store.update(`Review ${req.params.id} delete`, state => {
      state.reviews = state.reviews.filter(x => x.id !== req.params.id);
    });
    res.json({ ok: true });
  }));

  // Product picker for adding a review by hand.
  app.get('/api/admin/product-search', wrap(async (req, res) => {
    const q = str(req.query.q, 60).toLowerCase();
    if (q.length < 2) return res.json({ items: [] });
    res.json({ items: loadCatalog().list.filter(p => `${p.title} ${p.titleEn || ''}`.toLowerCase().includes(q)).slice(0, 12)
      .map(p => ({ id: p.id, title: p.title, house: p.houseId })) });
  }));

  // ── Settings ──
  app.get('/api/admin/settings', wrap(async (req, res) => {
    res.json({ settings: (await store.getState()).settings, houses: HOUSES.map(h => ({ id: h.id, ar: h.ar })), storage: store.storageMode() });
  }));

  app.put('/api/admin/settings', wrap(async (req, res) => {
    const b = req.body || {};
    const s = await store.update('Settings', state => {
      const cur = state.settings;
      if ('ordersOpen' in b) cur.ordersOpen = !!b.ordersOpen;
      if ('freeDeliveryJod' in b) cur.freeDeliveryJod = num(b.freeDeliveryJod, 0, 10000) || 0;
      if ('couponsEnabled' in b) cur.couponsEnabled = !!b.couponsEnabled;
      if ('reviewsEnabled' in b) cur.reviewsEnabled = !!b.reviewsEnabled;
      if ('showQuiz' in b) cur.showQuiz = !!b.showQuiz;
      if ('showRecent' in b) cur.showRecent = !!b.showRecent;
      if (b.announcement) cur.announcement = { enabled: !!b.announcement.enabled, ar: str(b.announcement.ar, 160), en: str(b.announcement.en, 160) };
      if (Array.isArray(b.hiddenHouses)) cur.hiddenHouses = b.hiddenHouses.filter(id => HOUSES.some(h => h.id === id));
      store.addLog(state, 'تحديث إعدادات الموقع', 'settings');
      return cur;
    });
    res.json({ ok: true, settings: s });
  }));
}

module.exports = { mountAdmin, publicConfig, applyOverrides, getState: store.getState };
