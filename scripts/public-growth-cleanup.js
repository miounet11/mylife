require('./load-env');

const Database = require('better-sqlite3');
const targets = require('../data/public-growth-targets.json');

const db = new Database('data/lifekline.db');
const apply = process.argv.includes('--apply');

function parseMeta(value) {
  if (!value) return {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function parseList(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeText(value) {
  return `${value || ''}`.trim().toLowerCase();
}

function matchesTarget(row, target) {
  const growthPlanKey = typeof row.meta.growthPlanKey === 'string' ? row.meta.growthPlanKey : '';
  if (growthPlanKey === target.key) {
    return true;
  }

  const locale = typeof row.meta.locale === 'string' ? row.meta.locale : '';
  const market = typeof row.meta.market === 'string' ? row.meta.market : '';
  if (locale && locale !== target.locale) {
    return false;
  }
  if (market && market !== target.market) {
    return false;
  }

  const haystack = normalizeText([
    row.title,
    row.excerpt,
    row.category || '',
    locale,
    market,
    ...(row.tags || []),
  ].join(' '));

  const matchedKeywords = (target.keywords || []).filter((keyword) => haystack.includes(normalizeText(keyword)));
  return matchedKeywords.length >= Math.min(2, (target.keywords || []).length);
}

const rows = db.prepare(`
  SELECT id, slug, title, excerpt, category, tags, status, source, meta, updated_at
  FROM content_entries
  ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
`).all();

const publicGrowthRows = rows
  .map((row) => ({
    ...row,
    meta: parseMeta(row.meta),
    tags: parseList(row.tags),
  }))
  .filter((row) => row.meta.sourceType === 'public-growth');

const cleanupTargets = publicGrowthRows
  .filter((row) => row.status === 'draft')
  .filter((row) => row.source.startsWith('agent-fallback:'))
  .filter((row) => {
    const key = typeof row.meta.growthPlanKey === 'string' ? row.meta.growthPlanKey : '';
    const target = targets.find((item) => item.key === key);
    if (!target) {
      return false;
    }

    return rows.some((candidate) => {
      if (candidate.status !== 'published') {
        return false;
      }

      const enriched = {
        ...candidate,
        meta: parseMeta(candidate.meta),
        tags: parseList(candidate.tags),
      };

      return matchesTarget(enriched, target);
    });
  })
  .map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    key: row.meta.growthPlanKey,
    source: row.source,
  }));

if (apply && cleanupTargets.length > 0) {
  const remove = db.prepare(`DELETE FROM content_entries WHERE id = ?`);
  const transaction = db.transaction((items) => {
    items.forEach((item) => remove.run(item.id));
  });
  transaction(cleanupTargets);
}

console.log(JSON.stringify({
  apply,
  removedCount: cleanupTargets.length,
  removedEntries: cleanupTargets,
}, null, 2));
