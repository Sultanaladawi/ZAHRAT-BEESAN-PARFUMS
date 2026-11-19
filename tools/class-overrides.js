/**
 * Owner-approved filings (tools/class-overrides.json). A product listed there is
 * filed exactly as the owner approved; the classifier never changes it and the
 * audit never flags it.
 *
 *   applyOverride(catalogId, cls) -> cls with the approved categoryType / bottleCount,
 *                                    confidence 'high' and overridden: true
 *   overrideFor(catalogId)        -> the entry or null
 */
'use strict';
const fs = require('fs');
const path = require('path');

let table = null;
function load() {
  if (table) return table;
  try { table = JSON.parse(fs.readFileSync(path.join(__dirname, 'class-overrides.json'), 'utf8')).overrides || {}; } catch (e) { table = {}; }
  return table;
}

const overrideFor = id => load()[id] || null;

function applyOverride(id, cls) {
  const o = overrideFor(id);
  if (!o) return cls;
  const sub = o.categoryType === 'bundle' ? cls.subCategory : undefined;
  return {
    ...cls,
    categoryType: o.categoryType,
    kind: o.categoryType === 'bundle' ? 'set' : o.categoryType,
    bottleCount: Number(o.bottleCount) || cls.bottleCount,
    confidence: 'high',
    overridden: true,
    subCategory: sub,
    reasons: [`owner-approved filing (${o.categoryType}), see tools/class-overrides.json`].concat(cls.reasons || []),
  };
}

module.exports = { overrideFor, applyOverride };
