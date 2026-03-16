require('./load-env');

const Database = require('better-sqlite3');
const targets = require('../data/public-growth-targets-wave2.json');

const db = new Database('data/lifekline.db', { readonly: true });

function parseJson(value, fallback = {}) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const rows = db.prepare(`
  SELECT id, slug, title, status, source, meta, updated_at
  FROM content_entries
  ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
`).all();

const coverage = targets.map((target) => {
  const matched = rows
    .map((row) => ({
      ...row,
      meta: parseJson(row.meta),
    }))
    .filter((row) => row.meta.growthPlanKey === target.key)
    .filter((row) => row.meta.sourceType === 'public-growth-wave2');

  const published = matched.filter((row) => row.status === 'published');
  const drafts = matched.filter((row) => row.status === 'draft');

  return {
    key: target.key,
    title: target.title,
    locale: target.locale,
    market: target.market,
    primaryType: target.primaryType,
    publishedCount: published.length,
    draftCount: drafts.length,
    missing: published.length === 0 && drafts.length === 0,
    sampleTitles: matched.slice(0, 3).map((row) => row.title),
  };
});

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  targetCount: targets.length,
  missingCount: coverage.filter((item) => item.missing).length,
  draftOnlyCount: coverage.filter((item) => !item.missing && item.publishedCount === 0 && item.draftCount > 0).length,
  publishedCount: coverage.filter((item) => item.publishedCount > 0).length,
  queue: coverage.filter((item) => item.missing).slice(0, 8),
  coverage,
}, null, 2));
