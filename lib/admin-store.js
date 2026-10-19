// ══════════════════════════════════════════════════════════
// 🗄️ Dashboard data: settings, coupons, product overrides, orders and
// notify-me requests, kept in one JSON document.
//
// On Vercel the disk is wiped on every deploy, so with ADMIN_GITHUB_TOKEN set the
// document lives in admin-data.json in a separate PRIVATE GitHub repo
// (ADMIN_DATA_REPO). The store repo is public, so the data never goes there,
// and a public data repo is refused. Without a token it is a local file:
// data/admin-state.json, or /tmp on Vercel (temporary).
// ══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const GH_TOKEN = process.env.ADMIN_GITHUB_TOKEN || '';
const GH_REPO = process.env.ADMIN_DATA_REPO || 'Sultanaladawi/zahrat-beesan-data';
const GH_FILE = 'admin-data.json';
const LOCAL_FILE = process.env.VERCEL
  ? path.join('/tmp', 'zb-admin-state.json')
  : path.join(__dirname, '..', 'data', 'admin-state.json');
const CACHE_MS = 20 * 1000;
const MAX_ORDERS = 2000;
const MAX_NOTIFY = 2000;
const MAX_REVIEWS = 3000;
const MAX_LOG = 120;

function defaultState() {
  return {
    settings: {
      ordersOpen: true,
      freeDeliveryJod: 100,
      couponsEnabled: true,
      reviewsEnabled: true,
      showQuiz: true,
      showRecent: true,
      announcement: { enabled: false, ar: '', en: '' },
      hiddenHouses: [],
      offers: {},
    },
    coupons: [],
    products: {},
    orders: [],
    notify: [],
    reviews: [],
    log: [],
    orderSeq: 1000,
  };
}

function normalize(state) {
  const base = defaultState();
  const s = state && typeof state === 'object' ? state : {};
  return {
    ...base,
    ...s,
    settings: { ...base.settings, ...(s.settings || {}), announcement: { ...base.settings.announcement, ...((s.settings || {}).announcement || {}) } },
  };
}

const storageMode = () => (GH_TOKEN ? 'github' : process.env.VERCEL ? 'temporary' : 'local');

// ── GitHub contents API ──
async function gh(method, url, body) {
  const res = await fetch(`https://api.github.com/repos/${GH_REPO}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'zahrat-beesan-admin',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

// The data repo must exist and be private; checked once per server start.
let repoChecked = false;
async function checkRepo() {
  if (repoChecked) return;
  const r = await gh('GET', '');
  if (r.status === 404) throw new Error(`مستودع البيانات ${GH_REPO} غير موجود أو المفتاح ما عنده صلاحية عليه`);
  if (r.status !== 200) throw new Error(`GitHub (${r.status})`);
  if (!r.json.private) throw new Error(`مستودع البيانات ${GH_REPO} عام (Public)، لازم يكون Private`);
  repoChecked = true;
}

async function ghRead() {
  await checkRepo();
  const r = await gh('GET', `/contents/${GH_FILE}`);
  if (r.status === 404) return { state: defaultState(), sha: null };
  if (r.status !== 200) throw new Error(`GitHub read failed (${r.status})`);
  return { state: normalize(JSON.parse(Buffer.from(r.json.content, 'base64').toString('utf8'))), sha: r.json.sha };
}

async function ghWrite(state, sha, message) {
  const r = await gh('PUT', `/contents/${GH_FILE}`, {
    message,
    content: Buffer.from(JSON.stringify(state, null, 1)).toString('base64'),
    ...(sha ? { sha } : {}),
  });
  if (r.status === 409 || r.status === 422) return null; // someone saved first
  if (r.status !== 200 && r.status !== 201) throw new Error(`GitHub write failed (${r.status})`);
  return r.json.content.sha;
}

// ── Cache and serialized writes ──
let cache = null; // { state, sha, at }
let lastError = '';
const storageError = () => lastError;
let queue = Promise.resolve();

async function load(fresh = false) {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache;
  if (storageMode() === 'github') {
    const { state, sha } = await ghRead();
    cache = { state, sha, at: Date.now() };
  } else {
    let state = defaultState();
    try { state = normalize(JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'))); } catch (e) { /* first run */ }
    cache = { state, sha: null, at: Date.now() };
  }
  return cache;
}

async function getState() {
  try {
    const { state } = await load();
    lastError = '';
    return state;
  } catch (e) {
    console.error('[admin-store]', e.message);
    lastError = e.message;
    return cache ? cache.state : defaultState();
  }
}

// Runs mutate(state) on the newest copy and saves it. Retries when another
// server instance saved in between.
function update(message, mutate) {
  const run = async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { state, sha } = await load(true);
      const draft = JSON.parse(JSON.stringify(state));
      const result = await mutate(draft);
      if (storageMode() === 'github') {
        const newSha = await ghWrite(draft, sha, message);
        if (!newSha) continue;
        cache = { state: draft, sha: newSha, at: Date.now() };
      } else {
        fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
        fs.writeFileSync(LOCAL_FILE, JSON.stringify(draft, null, 1));
        cache = { state: draft, sha: null, at: Date.now() };
      }
      return result;
    }
    throw new Error('Could not save, please try again');
  };
  const p = queue.then(run, run);
  queue = p.catch(() => {});
  return p;
}

function addLog(state, text, kind = 'info') {
  state.log = [{ at: new Date().toISOString(), text, kind }, ...(state.log || [])].slice(0, MAX_LOG);
}

module.exports = { getState, update, addLog, storageMode, storageError, MAX_ORDERS, MAX_NOTIFY, MAX_REVIEWS };
