import './load-env';
import { assessGrowthPublication } from '@/lib/public-growth-plan';
import { listManagedContentEntries, saveManagedContentEntry } from '@/lib/content-store';

function parseLimitArg() {
  const raw = process.argv.find((arg) => arg.startsWith('--limit='));
  const value = raw ? Number(raw.split('=')[1]) : 3;
  return Number.isFinite(value) && value > 0 ? Math.min(8, Math.round(value)) : 3;
}

function main() {
  const limit = parseLimitArg();
  const drafts = listManagedContentEntries()
    .filter((entry) => entry.status === 'draft')
    .filter((entry) => entry.meta?.sourceType === 'public-growth-wave2')
    .map((entry) => ({
      entry,
      assessment: assessGrowthPublication(entry, 'public-growth-wave2'),
    }))
    .sort((left, right) => right.assessment.score - left.assessment.score)
    .slice(0, Math.max(8, limit));

  const ready = drafts
    .filter((item) => item.assessment.ready)
    .slice(0, limit);

  const publishedEntries = ready.map(({ entry, assessment }) => (
    saveManagedContentEntry({
      ...entry,
      status: 'published',
      meta: {
        ...(entry.meta || {}),
        publicationReady: true,
        editorialScore: assessment.score,
        surfaceVisibility: 'public',
        autoPublishedAt: new Date().toISOString(),
        publishReasons: assessment.reasons,
      },
    }, 'system_public_growth_wave2_promote')
  )).filter(Boolean);

  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    considered: drafts.map(({ entry, assessment }) => ({
      slug: entry.slug,
      title: entry.title,
      growthPlanKey: entry.meta?.growthPlanKey,
      locale: entry.meta?.locale,
      market: entry.meta?.market,
      source: entry.source,
      score: assessment.score,
      ready: assessment.ready,
      reasons: assessment.reasons,
    })),
    publishedCount: publishedEntries.length,
    publishedEntries: publishedEntries.map((entry) => ({
      slug: entry?.slug,
      title: entry?.title,
      source: entry?.source,
      status: entry?.status,
    })),
  }, null, 2));
}

main();
