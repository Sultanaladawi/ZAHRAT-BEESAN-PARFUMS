'use strict';
// Static catalog mode.
//
// The scheduled GitHub Action (.github/workflows/sync-catalog.yml) keeps
// public/data/*.json current (prices, stock, offers, galleries, new products)
// and commits it, which redeploys the store. So on a deployed server there is
// no reason to ask the suppliers again on every cold start or every minute:
// the catalog is read from those files once per instance and kept in memory,
// and the answer for each house is built once per dashboard change (JSON text,
// gzip copy and ETag), so a request costs almost no CPU.
//
// Static mode is on when running on Vercel or with NODE_ENV=production.
//   CATALOG_MODE=live    forces the old behaviour (supplier fetch on the server)
//   CATALOG_MODE=static  forces static mode locally
// On a developer's machine (nothing set) the old live behaviour is kept.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');

const STATIC_MODE = process.env.CATALOG_MODE === 'live'
  ? false
  : Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production' || process.env.CATALOG_MODE === 'static');

// On Vercel the files never change after the deploy; elsewhere re-check the
// modification time at most once a minute so a `git pull` shows up.
const RECHECK_MS = process.env.VERCEL ? Infinity : 60 * 1000;

const files = new Map(); // absolute path -> { mtimeMs, checkedAt, list, version }
let versionCounter = 0;

const sallaIdOf = p => String(p.sallaId || ((p.url || '').match(/\/p(\d+)/) || [])[1] || '');

// Parsed contents of a catalog file (cached). `exclude` is a Set of Salla ids
// the store never shows (the same sets the live sync used to apply).
function readCatalog(file, exclude) {
  const now = Date.now();
  let hit = files.get(file);
  if (!hit || now - hit.checkedAt >= RECHECK_MS) {
    let mtimeMs = 0;
    try { mtimeMs = fs.statSync(file).mtimeMs; } catch (e) { return hit ? hit.view(exclude) : { list: [], version: 0 }; }
    if (!hit || hit.mtimeMs !== mtimeMs) {
      let raw = [];
      try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { raw = hit ? hit.raw : []; }
      hit = { mtimeMs, checkedAt: now, raw: Array.isArray(raw) ? raw : [], version: ++versionCounter, views: new Map() };
      hit.view = ex => {
        const k = ex ? 'x' : 'all';
        if (!hit.views.has(k)) hit.views.set(k, ex ? hit.raw.filter(p => !ex.has(sallaIdOf(p))) : hit.raw);
        return { list: hit.views.get(k), version: hit.version };
      };
      files.set(file, hit);
    } else {
      hit.checkedAt = now;
    }
  }
  return hit.view(exclude);
}

const stableHash = s => crypto.createHash('sha1').update(s).digest('base64url').slice(0, 16);

// A response body kept in memory: raw text, a gzip copy (made on first use)
// and an ETag.
function makeEntry(text, type) {
  const raw = Buffer.from(text, 'utf8');
  return { raw, gz: null, type, etag: `W/"${stableHash(text)}-${raw.length}"` };
}

function gzipOf(entry) {
  if (!entry.gz) entry.gz = zlib.gzipSync(entry.raw, { level: 6 });
  return entry.gz;
}

// Sends a cached entry: 304 when the browser/CDN already has it, the gzip copy
// when accepted, otherwise the raw bytes. No compression work per request.
function sendEntry(req, res, entry, cacheControl) {
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('Content-Type', entry.type);
  res.setHeader('ETag', entry.etag);
  res.setHeader('Vary', 'Accept-Encoding');
  if (req.headers['if-none-match'] === entry.etag) { res.statusCode = 304; return res.end(); }
  const acceptsGzip = /\bgzip\b/i.test(String(req.headers['accept-encoding'] || ''));
  if (acceptsGzip) {
    const gz = gzipOf(entry);
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Length', gz.length);
    return res.end(gz);
  }
  res.setHeader('Content-Encoding', 'identity'); // keeps the compression middleware out of it
  res.setHeader('Content-Length', entry.raw.length);
  return res.end(entry.raw);
}

// A small bounded cache for built responses.
function makeCache(max) {
  const m = new Map();
  return {
    get: k => m.get(k),
    set(k, v) {
      if (m.size >= max) m.delete(m.keys().next().value);
      m.set(k, v);
    },
  };
}

module.exports = { STATIC_MODE, DATA_DIR, readCatalog, sallaIdOf, makeEntry, sendEntry, makeCache, stableHash };
