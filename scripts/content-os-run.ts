/**
 * Content OS CLI (tsx)
 *
 *   npx tsx scripts/content-os-run.ts --dry-run
 *   npx tsx scripts/content-os-run.ts --limit 3 --locales zh-CN,en-US
 *   CONTENT_OS_API_KEY=sk-... npx tsx scripts/content-os-run.ts --limit 2
 */

import {
  buildContentOsMatrix,
  buildContentOsRunPlan,
  resolveContentOsTextEndpoint,
  runContentOsCycle,
  summarizeContentOsMatrix,
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
    limit: Number(get('--limit', '4')) || 4,
    locales: get('--locales', 'zh-CN,en-US')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as ContentOsLocale[],
    concurrency: Number(get('--concurrency', '2')) || 2,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const endpoint = resolveContentOsTextEndpoint();
  console.log(
    JSON.stringify(
      {
        phase: 'endpoint',
        baseUrl: endpoint.baseUrl,
        model: endpoint.model,
        hasKey: Boolean(endpoint.apiKey),
      },
      null,
      2,
    ),
  );

  const matrix = buildContentOsMatrix({
    locales: args.locales,
    includeSeasonal: true,
  });
  console.log(
    JSON.stringify(
      { phase: 'matrix', ...summarizeContentOsMatrix(matrix) },
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
          reasons: plan.reasons,
          queue: plan.queue.map((s) => ({
            key: s.key,
            topic: s.topic,
            locale: s.locale,
            priority: s.priority,
            template: s.template,
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
  });

  console.log(
    JSON.stringify(
      {
        phase: 'result',
        coverage: result.plan.coverage,
        draftDir: result.draftDir,
        savedIds: result.savedIds,
        articles: result.articles.map((a) => ({
          slug: a.slug,
          title: a.title,
          locale: a.locale,
          llmUsed: a.llmUsed,
          model: a.model,
          quality: a.quality,
        })),
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
