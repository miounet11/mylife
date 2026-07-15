#!/usr/bin/env node
/**
 * Upsert SEO/GEO content seeds into production content_entries.
 *
 * Safety:
 * - Inserts only when slug is missing
 * - Updates only rows owned by seed_seo_* ids or source in (seed, seed-seo-v6)
 * - Never overwrites cms/agent-generated rows with same slug
 *
 * Usage (on server):
 *   node scripts/publish-seo-content-seeds.mjs --payload /tmp/seo-content-payload.json
 *   node scripts/publish-seo-content-seeds.mjs --payload /tmp/seo-content-payload.json --dry-run
 */
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

function parseArgs(argv) {
  const out = { payload: '', dryRun: false, db: '' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--payload') out.payload = argv[++i] || '';
    else if (arg === '--db') out.db = argv[++i] || '';
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const cwd = process.cwd();
  const payloadPath = path.resolve(args.payload || path.join(cwd, 'tmp', 'seo-content-payload.json'));
  const dbPath = path.resolve(args.db || path.join(cwd, 'data', 'lifekline.db'));

  if (!fs.existsSync(payloadPath)) {
    console.error(JSON.stringify({ ok: false, error: `payload not found: ${payloadPath}` }));
    process.exit(1);
  }
  if (!fs.existsSync(dbPath)) {
    console.error(JSON.stringify({ ok: false, error: `db not found: ${dbPath}` }));
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  if (!Array.isArray(payload) || !payload.length) {
    console.error(JSON.stringify({ ok: false, error: 'payload empty' }));
    process.exit(1);
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  const selectBySlug = db.prepare(`SELECT id, source FROM content_entries WHERE slug = ? LIMIT 1`);
  const insert = db.prepare(`
    INSERT INTO content_entries (
      id, content_type, subtype, slug, title, name, excerpt, category, read_time,
      tags, featured, seo_title, seo_description, sections, status, source, meta, created_by, updated_by,
      created_at, updated_at
    ) VALUES (
      @id, @content_type, @subtype, @slug, @title, @name, @excerpt, @category, @read_time,
      @tags, @featured, @seo_title, @seo_description, @sections, @status, @source, @meta, @created_by, @updated_by,
      datetime('now'), datetime('now')
    )
  `);
  const updateOwned = db.prepare(`
    UPDATE content_entries
    SET content_type = @content_type,
        subtype = @subtype,
        title = @title,
        name = @name,
        excerpt = @excerpt,
        category = @category,
        read_time = @read_time,
        tags = @tags,
        featured = @featured,
        seo_title = @seo_title,
        seo_description = @seo_description,
        sections = @sections,
        status = @status,
        source = @source,
        meta = @meta,
        updated_by = @updated_by,
        updated_at = datetime('now')
    WHERE id = @id
  `);

  const stats = {
    total: payload.length,
    inserted: 0,
    updated: 0,
    skippedOwnedByOthers: 0,
    dryRun: args.dryRun,
  };
  const details = [];

  const run = db.transaction((rows) => {
    for (const item of rows) {
      const existing = selectBySlug.get(item.slug);
      const row = {
        id: item.id,
        content_type: item.contentType,
        subtype: item.subtype,
        slug: item.slug,
        title: item.title,
        name: item.name,
        excerpt: item.excerpt,
        category: item.category,
        read_time: item.readTime,
        tags: JSON.stringify(item.tags || []),
        featured: item.featured ? 1 : 0,
        seo_title: item.seoTitle || item.title,
        seo_description: item.seoDescription || item.excerpt,
        sections: JSON.stringify(item.sections || []),
        status: item.status || 'published',
        source: item.source || 'seed',
        meta: JSON.stringify(item.meta || { publicationReady: true }),
        created_by: 'seo-seed-publisher',
        updated_by: 'seo-seed-publisher',
      };

      if (!existing) {
        if (!args.dryRun) insert.run(row);
        stats.inserted += 1;
        details.push({ slug: item.slug, action: 'insert' });
        continue;
      }

      const owned =
        existing.id === item.id ||
        String(existing.id || '').startsWith('seed_seo_') ||
        existing.source === 'seed' ||
        existing.source === 'seed-seo-v6';

      if (!owned) {
        stats.skippedOwnedByOthers += 1;
        details.push({ slug: item.slug, action: 'skip', reason: `owned_by ${existing.id}/${existing.source}` });
        continue;
      }

      // Keep stable id if already seed_seo_* or existing seed id
      row.id = existing.id.startsWith('seed_seo_') || existing.id.startsWith('seed_') ? existing.id : item.id;
      if (!args.dryRun) updateOwned.run(row);
      stats.updated += 1;
      details.push({ slug: item.slug, action: 'update', id: row.id });
    }
  });

  run(payload);
  db.close();

  console.log(JSON.stringify({ ok: true, ...stats, sample: details.slice(0, 12) }, null, 2));
}

main();
