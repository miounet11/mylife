import { NextRequest, NextResponse } from 'next/server';
import {
  buildContentOsRunPlan,
  buildCoverageMap,
  readLastContentOsRun,
  resolveContentOsTextEndpoint,
  runContentOsCycle,
  summarizeContentOsMatrix,
  buildContentOsMatrix,
  CONTENT_OS_LOCALES,
} from '@/lib/content-os';
import { getContentGenerationCronToken, getSystemHealthTokens } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 800;

function authorize(request: NextRequest) {
  const token =
    request.headers.get('x-content-os-token') ||
    request.headers.get('x-cron-token') ||
    request.nextUrl.searchParams.get('token') ||
    '';
  const allowed = new Set(
    [
      getContentGenerationCronToken(),
      ...getSystemHealthTokens(),
      process.env.CONTENT_OS_CRON_TOKEN || '',
    ].filter(Boolean),
  );
  if (allowed.size === 0) {
    // Local/dev: allow when no tokens configured
    return process.env.NODE_ENV !== 'production';
  }
  return allowed.has(token);
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const localesParam = request.nextUrl.searchParams.get('locales');
  const locales = localesParam
    ? (localesParam.split(',').map((s) => s.trim()).filter(Boolean) as never)
    : undefined;

  const matrix = buildContentOsMatrix({ locales, includeSeasonal: true });
  const plan = buildContentOsRunPlan({
    locales,
    limit: Number(request.nextUrl.searchParams.get('limit') || 8),
  });
  const coverage = buildCoverageMap({ locales });
  const endpoint = resolveContentOsTextEndpoint();
  const lastRun = await readLastContentOsRun();

  return NextResponse.json({
    ok: true,
    endpoint: {
      baseUrl: endpoint.baseUrl,
      model: endpoint.model,
      hasKey: Boolean(endpoint.apiKey),
    },
    locales: CONTENT_OS_LOCALES,
    matrix: summarizeContentOsMatrix(matrix),
    coverageSummary: plan.coverage,
    coverageSample: coverage.slice(0, 30),
    plan: {
      generatedAt: plan.generatedAt,
      queue: plan.queue.map((s) => ({
        key: s.key,
        topic: s.topic,
        locale: s.locale,
        priority: s.priority,
        template: s.template,
      })),
      reasons: plan.reasons,
    },
    lastRun,
  });
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    locales?: string[];
    limit?: number;
    withImage?: boolean;
    dryRun?: boolean;
    concurrency?: number;
    autoPublish?: boolean;
    repairRounds?: number;
  };

  const result = await runContentOsCycle({
    locales: body.locales as never,
    limit: body.limit ?? 4,
    withImage: Boolean(body.withImage),
    dryRun: Boolean(body.dryRun),
    concurrency: body.concurrency ?? 1,
    autoPublish: body.autoPublish !== false,
    repairRounds: body.repairRounds ?? 2,
  });

  return NextResponse.json({
    ok: true,
    dryRun: Boolean(body.dryRun),
    coverage: result.plan.coverage,
    queueSize: result.plan.queue.length,
    generated: result.articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      locale: a.locale,
      quality: a.quality,
      llmUsed: a.llmUsed,
      model: a.model,
    })),
    qualitySummary: result.qualitySummary,
    savedIds: result.savedIds,
    publishedIds: result.publishedIds,
    draftDir: result.draftDir,
    reasons: result.plan.reasons,
  });
}
