/**
 * Publish ready content-os drafts (quality score ≥ threshold) in production CMS.
 *
 *   npx tsx scripts/publish-content-os-drafts.ts --min-score 90 --limit 50
 *   npx tsx scripts/publish-content-os-drafts.ts --dry-run
 */

import {
  listManagedContentEntries,
  saveManagedContentEntry,
  type ManagedContentEntry,
} from '../lib/content-store';

function parseArgs(argv: string[]) {
  const get = (name: string, fallback = '') => {
    const idx = argv.indexOf(name);
    if (idx === -1) return fallback;
    return argv[idx + 1] || fallback;
  };
  return {
    dryRun: argv.includes('--dry-run'),
    minScore: Number(get('--min-score', '90')) || 90,
    limit: Number(get('--limit', '100')) || 100,
  };
}

function qualityScore(entry: ManagedContentEntry) {
  const meta = entry.meta || {};
  const quality = (meta.quality || {}) as { score?: number; ready?: boolean };
  if (typeof quality.score === 'number') return quality.score;
  // Fallback heuristic for entries without quality blob
  const textLen = (entry.sections || []).reduce(
    (sum, s) => sum + (s.paragraphs || []).join('').length,
    0,
  );
  if ((entry.sections || []).length >= 5 && textLen >= 800 && (entry.excerpt || '').length >= 60) {
    return 90;
  }
  return 0;
}

function isContentOs(entry: ManagedContentEntry) {
  const source = `${entry.source || ''}`.toLowerCase();
  const matrixKey = `${(entry.meta as { matrixKey?: string } | undefined)?.matrixKey || ''}`;
  return source.includes('content-os') || matrixKey.length > 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const entries = listManagedContentEntries().filter(
    (entry) =>
      isContentOs(entry) &&
      entry.status === 'draft' &&
      qualityScore(entry) >= args.minScore,
  );

  const batch = entries
    .sort((a, b) => qualityScore(b) - qualityScore(a) || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, args.limit);

  console.log(
    JSON.stringify(
      {
        phase: 'plan',
        dryRun: args.dryRun,
        minScore: args.minScore,
        candidates: batch.length,
        sample: batch.slice(0, 10).map((e) => ({
          id: e.id,
          slug: e.slug,
          type: e.contentType,
          score: qualityScore(e),
          title: e.title,
        })),
      },
      null,
      2,
    ),
  );

  if (args.dryRun) return;

  const published: string[] = [];
  for (const entry of batch) {
    const saved = saveManagedContentEntry(
      {
        ...entry,
        status: 'published',
        meta: {
          ...(entry.meta || {}),
          publishedVia: 'publish-content-os-drafts',
          publishedAt: new Date().toISOString(),
        },
      },
      'content-os-publish',
    );
    published.push(saved.id);
    console.log('published', saved.contentType, saved.slug, saved.id);
  }

  console.log(JSON.stringify({ phase: 'done', published: published.length, ids: published }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
