#!/usr/bin/env node
/**
 * Batch publish case drafts that meet minimum quality thresholds.
 * Usage: node scripts/batch-publish-case-drafts.mjs [limit] [--dry-run]
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const limit = Number(process.argv[2] || 100);
const dryRun = process.argv.includes('--dry-run');

const dbPath = process.env.DATABASE_PATH || path.join(root, 'data', 'lifekline.db');
const db = new Database(dbPath);

function parseSections(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sectionTextLength(sections) {
  return sections.reduce((sum, section) => {
    if (typeof section === 'string') return sum + section.length;
    if (section && typeof section === 'object') {
      const title = String(section.title || section.heading || '');
      const content = String(section.content || section.body || section.text || '');
      const paragraphs = Array.isArray(section.paragraphs)
        ? section.paragraphs.join('\n')
        : '';
      return sum + title.length + content.length + paragraphs.length;
    }
    return sum;
  }, 0);
}

function isPublishable(row) {
  if (!row.title?.trim() || !row.slug?.trim()) return false;
  const excerptLength = row.excerpt?.trim()?.length || 0;
  const sections = parseSections(row.sections);
  const textLength = sectionTextLength(sections);

  if (sections.length >= 2 && (textLength >= 250 || excerptLength >= 60)) return true;
  if (sections.length >= 1 && (textLength >= 500 || excerptLength >= 100)) return true;
  if (textLength >= 800) return true;
  return false;
}

const scanPool = Math.max(limit * 12, 1200);
const candidates = db.prepare(`
  SELECT id, slug, title, excerpt, sections, meta, updated_at
  FROM content_entries
  WHERE content_type = 'case' AND status = 'draft'
  ORDER BY updated_at DESC
  LIMIT ?
`).all(scanPool);

const selected = [];
for (const row of candidates) {
  if (selected.length >= limit) break;
  if (isPublishable(row)) selected.push(row);
}

console.log(`[batch-publish-case-drafts] candidates=${candidates.length} selected=${selected.length} dryRun=${dryRun}`);

if (dryRun) {
  for (const row of selected.slice(0, 10)) {
    console.log(`  - ${row.slug} | ${row.title}`);
  }
  if (selected.length > 10) console.log(`  ... and ${selected.length - 10} more`);
  process.exit(0);
}

const update = db.prepare(`
  UPDATE content_entries
  SET status = 'published', updated_at = datetime('now')
  WHERE id = ?
`);

const updateMeta = db.prepare(`
  UPDATE content_entries
  SET meta = ?, updated_at = datetime('now')
  WHERE id = ?
`);

let published = 0;
for (const row of selected) {
  let meta = {};
  try {
    meta = row.meta ? JSON.parse(row.meta) : {};
  } catch {
    meta = {};
  }
  if (!meta.schedulePublishedAt) {
    meta.schedulePublishedAt = new Date().toISOString();
  }
  meta.batchPublishedBy = 'batch-publish-case-drafts';
  update.run(row.id);
  updateMeta.run(JSON.stringify(meta), row.id);
  published += 1;
}

const publishedTotal = db.prepare(`SELECT COUNT(*) as n FROM content_entries WHERE content_type='case' AND status='published'`).get().n;
const draftTotal = db.prepare(`SELECT COUNT(*) as n FROM content_entries WHERE content_type='case' AND status='draft'`).get().n;

console.log(`[batch-publish-case-drafts] published=${published} casePublished=${publishedTotal} caseDraft=${draftTotal}`);