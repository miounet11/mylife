import './load-env';
import { generateManagedContentDrafts, type ContentGenerationLocale } from '@/lib/content-generation';
import { getContentOpsSnapshot } from '@/lib/content-ops';
import { listManagedContentEntries, saveManagedContentEntry } from '@/lib/content-store';

function parseLimitArg() {
  const raw = process.argv.find((arg) => arg.startsWith('--limit='));
  const value = raw ? Number(raw.split('=')[1]) : 3;
  return Number.isFinite(value) && value > 0 ? Math.min(8, Math.round(value)) : 3;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function ensureUniqueSlug(slug: string, used: Set<string>) {
  let nextSlug = slug;
  let suffix = 2;
  while (used.has(nextSlug)) {
    nextSlug = `${slug}-${suffix}`;
    suffix += 1;
  }
  used.add(nextSlug);
  return nextSlug;
}

async function main() {
  const limit = parseLimitArg();
  const queue = getContentOpsSnapshot().generationQueue
    .filter((item) => item.sourceType === 'public-growth')
    .slice(0, limit);
  const existingEntries = listManagedContentEntries();
  const usedSlugs = new Set(existingEntries.map((entry) => entry.slug));
  const savedEntries = [];
  let llmSucceededCount = 0;
  let fallbackCount = 0;

  for (const item of queue) {
    const generated = await generateManagedContentDrafts({
      mode: 'single',
      contentType: item.contentType,
      subtype: item.subtype,
      topic: item.topic,
      angle: item.angle,
      platform: 'public-growth',
      keywords: uniqueStrings(item.keywords),
      audience: item.audience,
      locale: item.locale as ContentGenerationLocale | undefined,
      market: item.market,
      sourceSignals: item.reason,
      status: 'draft',
      featured: false,
    });

    llmSucceededCount += generated.llmSucceededCount;
    fallbackCount += generated.fallbackCount;

    for (const draft of generated.entries) {
      const existingDraft = existingEntries.find((entry) => (
        entry.status === 'draft'
        && entry.meta?.growthPlanKey === item.key
        && entry.meta?.sourceType === 'public-growth'
      ));
      const slug = existingDraft
        ? existingDraft.slug
        : ensureUniqueSlug(draft.slug, usedSlugs);
      const entry = saveManagedContentEntry({
        id: existingDraft?.id || '',
        contentType: draft.contentType,
        subtype: draft.subtype,
        slug,
        title: draft.title,
        name: draft.name,
        excerpt: draft.excerpt,
        category: draft.category,
        readTime: draft.readTime,
        tags: draft.tags,
        featured: draft.featured,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        sections: draft.sections,
        status: 'draft',
        source: `${draft.source}:public-growth`,
        meta: {
          growthPlanKey: item.key,
          market: item.market,
          locale: item.locale,
          sourceType: 'public-growth',
          automationReason: item.reason,
        },
      }, 'system_public_growth');

      if (entry) {
        savedEntries.push({
          key: item.key,
          locale: item.locale,
          market: item.market,
          title: entry.title,
          slug: entry.slug,
          source: entry.source,
          status: entry.status,
        });
      }
    }
  }

  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    generatedCount: savedEntries.length,
    llmSucceededCount,
    fallbackCount,
    queue: queue.map((item) => ({
      key: item.key,
      title: item.title,
      locale: item.locale,
      market: item.market,
      contentType: item.contentType,
      priorityScore: item.priorityScore,
    })),
    savedEntries,
  }, null, 2));
}

main().catch((error) => {
  console.error('[public-growth-generate] failed:', error);
  process.exit(1);
});
