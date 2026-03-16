import './load-env';
import wave2Targets from '@/data/public-growth-targets-wave2.json';
import { generateManagedContentDrafts, type ContentGenerationLocale } from '@/lib/content-generation';
import { listManagedContentEntries, saveManagedContentEntry } from '@/lib/content-store';

type Wave2Target = {
  key: string;
  title: string;
  topic: string;
  angle: string;
  primaryType: 'knowledge' | 'case' | 'insight';
  locale: ContentGenerationLocale;
  market: string;
  keywords: string[];
  audience: string;
  sourceSignals?: string[];
};

function parseLimitArg() {
  const raw = process.argv.find((arg) => arg.startsWith('--limit='));
  const value = raw ? Number(raw.split('=')[1]) : 2;
  return Number.isFinite(value) && value > 0 ? Math.min(6, Math.round(value)) : 2;
}

function parseKeyArg() {
  const raw = process.argv.find((arg) => arg.startsWith('--key='));
  return raw ? raw.split('=')[1]?.trim() : '';
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
  const key = parseKeyArg();
  const targets = (wave2Targets as Wave2Target[])
    .filter((item) => !key || item.key === key);
  const existingEntries = listManagedContentEntries();
  const usedSlugs = new Set(existingEntries.map((entry) => entry.slug));
  const queue = targets
    .filter((item) => !existingEntries.some((entry) => (
      entry.meta?.growthPlanKey === item.key
      && entry.meta?.sourceType === 'public-growth-wave2'
      && (entry.status === 'draft' || entry.status === 'published')
    )))
    .slice(0, limit);

  const savedEntries = [];
  let llmSucceededCount = 0;
  let fallbackCount = 0;

  for (const item of queue) {
    const generated = await generateManagedContentDrafts({
      mode: 'single',
      contentType: item.primaryType,
      topic: item.topic,
      angle: item.angle,
      platform: 'public-growth-wave2',
      keywords: uniqueStrings(item.keywords),
      audience: item.audience,
      locale: item.locale,
      market: item.market,
      sourceSignals: uniqueStrings(item.sourceSignals || []).join(' | ') || item.angle,
      status: 'draft',
      featured: false,
    });

    llmSucceededCount += generated.llmSucceededCount;
    fallbackCount += generated.fallbackCount;

    for (const draft of generated.entries) {
      const slug = ensureUniqueSlug(draft.slug, usedSlugs);
      const entry = saveManagedContentEntry({
        id: '',
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
        source: `${draft.source}:public-growth-wave2`,
        meta: {
          growthPlanKey: item.key,
          market: item.market,
          locale: item.locale,
          sourceType: 'public-growth-wave2',
          wave: 'wave2',
          automationReason: item.angle,
          sourceSignals: item.sourceSignals || [],
        },
      }, 'system_public_growth_wave2');

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
    requestedKey: key || null,
    targetCount: targets.length,
    queuedCount: queue.length,
    generatedCount: savedEntries.length,
    llmSucceededCount,
    fallbackCount,
    queue: queue.map((item) => ({
      key: item.key,
      title: item.title,
      locale: item.locale,
      market: item.market,
      primaryType: item.primaryType,
    })),
    savedEntries,
  }, null, 2));
}

main().catch((error) => {
  console.error('[public-growth-wave2-generate] failed:', error);
  process.exit(1);
});
