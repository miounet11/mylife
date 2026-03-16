require('./load-env');

const Database = require('better-sqlite3');

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

function shouldRetire(row) {
  if (row.source.startsWith('agent-fallback:')) {
    return 'fallback-content-not-allowed-on-public-knowledge';
  }

  if (row.source.startsWith('knowledge-synthesis:')) {
    const meta = parseMeta(row.meta);
    if (meta.publicationReady !== true) {
      return 'synthesis-not-public-ready';
    }
  }

  return '';
}

const rows = db.prepare(`
  SELECT id, slug, title, source, status, meta
  FROM content_entries
  WHERE content_type = 'knowledge' AND status = 'published'
  ORDER BY updated_at DESC, created_at DESC
`).all();

const retirements = rows
  .map((row) => ({
    ...row,
    reason: shouldRetire(row),
  }))
  .filter((row) => row.reason);

if (retirements.length === 0) {
  console.log(JSON.stringify({
    apply,
    retiredCount: 0,
    retiredSlugs: [],
  }, null, 2));
  process.exit(0);
}

if (apply) {
  const update = db.prepare(`
    UPDATE content_entries
    SET status = 'draft', meta = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  const transaction = db.transaction((items) => {
    items.forEach((row) => {
      const meta = parseMeta(row.meta);
      update.run(JSON.stringify({
        ...meta,
        retiredFromPublicKnowledgeAt: new Date().toISOString(),
        retiredFromPublicKnowledgeReason: row.reason,
      }), row.id);
    });
  });

  transaction(retirements);
}

console.log(JSON.stringify({
  apply,
  retiredCount: retirements.length,
  retiredSlugs: retirements.map((row) => ({
    slug: row.slug,
    source: row.source,
    reason: row.reason,
  })),
}, null, 2));
