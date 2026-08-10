/**
 * Content OS CLI v3 (people-first pipeline)
 *
 *   npx tsx scripts/content-os-run.ts --dry-run
 *   npx tsx scripts/content-os-run.ts --limit 3 --locales zh-CN
 *   npx tsx scripts/content-os-run.ts --limit 2 --no-publish
 *
 * Pipeline: demand/catalog queue → generate → multi-dimension score →
 * LLM repair → uniqueness recheck → auto-publish if publishReady.
 *
 * Constitution: docs/ldplayer-ops-and-google-alignment.md
 */

import {
  buildPeopleFirstCatalog,
  buildContentOsRunPlan,
  resolveContentOsTextEndpoint,
  runContentOsCycle,
  summarizeContentOsMatrix,
  PRODUCTION_CONSTITUTION_SUMMARY,
  resolveContentOsMode,
  PIPELINE_VERSION,
  type ContentOsLocale,
} from '../lib/content-os';

function parseArgs(argv: string[]) {
  const get = (name: string, fallback = '') => {
    const idx = argv.indexOf(name);
    if (idx === -1) return fallback;
    return argv[idx + 1] || fallback;
  };
  return {
    dryRun: argv.includes('--dry-run'),
    withImage: argv.includes('--with-image'),
    noPublish: argv.includes('--no-publish'),
    limit: Number(get('--limit', '3')) || 3,
    locales: get('--locales', 'zh-CN')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as ContentOsLocale[],
    concurrency: Number(get('--concurrency', '1')) || 1,
    repairRounds: Number(get('--repair-rounds', '2')) || 2,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const endpoint = resolveContentOsTextEndpoint();
  const mode = resolveContentOsMode();

  console.log(
    JSON.stringify(
      {
        phase: 'boot',
        pipeline: PIPELINE_VERSION,
        mode,
        northStar: PRODUCTION_CONSTITUTION_SUMMARY.northStar,
        notNorthStar: PRODUCTION_CONSTITUTION_SUMMARY.notNorthStar,
        endpoint: {
          baseUrl: endpoint.baseUrl,
          model: endpoint.model,
          hasKey: Boolean(endpoint.apiKey),
        },
      },
      null,
      2,
    ),
  );

  const catalog = buildPeopleFirstCatalog({ locales: args.locales });
  console.log(
    JSON.stringify(
      { phase: 'catalog', ...summarizeContentOsMatrix(catalog) },
      null,
      2,
    ),
  );

  if (args.dryRun) {
    const plan = buildContentOsRunPlan({
      locales: args.locales,
      limit: args.limit,
    });
    console.log(
      JSON.stringify(
        {
          phase: 'plan',
          coverage: plan.coverage,
          demand: plan.demand,
          reasons: plan.reasons,
          queue: plan.queue.map((s) => ({
            key: s.key,
            topic: s.topic,
            angle: s.angle,
            locale: s.locale,
            entityKind: s.entityKind,
            entitySlug: s.entitySlug,
            hubHref: s.hubHref,
            fromDemand: s.key.startsWith('demand__'),
            sourceCommunityHref: s.sourceCommunityHref,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (!endpoint.apiKey) {
    console.error(
      'Missing API key. Set CONTENT_OS_API_KEY or OPENAI_API_KEY / API_KEY.',
    );
    process.exit(2);
  }

  const result = await runContentOsCycle({
    locales: args.locales,
    limit: args.limit,
    withImage: args.withImage,
    concurrency: args.concurrency,
    autoPublish: !args.noPublish,
    repairRounds: args.repairRounds,
  });

  console.log(
    JSON.stringify(
      {
        phase: 'result',
        pipeline: PIPELINE_VERSION,
        coverage: result.plan.coverage,
        demand: result.plan.demand,
        draftDir: result.draftDir,
        savedIds: result.savedIds,
        publishedIds: result.publishedIds,
        qualitySummary: result.qualitySummary,
        articles: result.articles.map((a) => {
          const p = a as {
            multiQuality?: { overall?: number; publishReady?: boolean; summary?: string };
            repairRounds?: number;
            uniquenessOk?: boolean;
            uniquenessScore?: number;
            pipelineVersion?: string;
            gateBlocked?: string[];
          };
          return {
            slug: a.slug,
            title: a.title,
            locale: a.locale,
            llmUsed: a.llmUsed,
            model: a.model,
            entity: `${a.entityKind}/${a.entitySlug}`,
            hubHref: a.hubHref,
            fromDemand: Boolean(a.sourceDemandId),
            quality: a.quality,
            multiQuality: p.multiQuality,
            repairRounds: p.repairRounds,
            uniquenessOk: p.uniquenessOk,
            uniquenessScore: p.uniquenessScore,
            gateBlocked: p.gateBlocked,
            publishedReady: (a as { publishedReady?: boolean }).publishedReady,
          };
        }),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
