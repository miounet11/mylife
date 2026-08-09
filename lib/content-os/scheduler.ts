/**
 * Content OS update engine — coverage gaps, stale refresh, multi-locale expansion.
 * Mirrors LDPlayer's continuous entity×guide publishing cadence.
 */

import {
  listManagedContentEntries,
  saveManagedContentEntry,
  type ManagedContentEntry,
} from '@/lib/content-store';
import {
  buildContentOsMatrix,
  buildPeopleFirstCatalog,
  summarizeContentOsMatrix,
  type ContentOsLocale,
  type DestinyMatrixSlot,
} from '@/lib/content-os/matrix';
import {
  articleToManagedInput,
  generateBatchFromSlots,
  type ContentOsGeneratedArticle,
} from '@/lib/content-os/generator';
import { repairContentOsArticle, type RepairedArticle } from '@/lib/content-os/repair';
import { scoreContentOsDimensions } from '@/lib/content-os/quality-dimensions';
import {
  canExpandLocale,
  gateSlotForProduction,
  peopleFirstPriorityBoost,
  resolveContentOsMode,
  resolveProductionLocales,
  PRODUCTION_CONSTITUTION_SUMMARY,
} from '@/lib/content-os/production-policy';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export type ContentOsCoverageRow = {
  key: string;
  topic: string;
  locale: string;
  entityKind: string;
  priority: number;
  status: 'missing' | 'draft' | 'published' | 'stale';
  entryId?: string;
  updatedAt?: string;
  ageDays?: number;
};

export type ContentOsRunPlan = {
  generatedAt: string;
  matrixSummary: ReturnType<typeof summarizeContentOsMatrix>;
  coverage: {
    missing: number;
    draft: number;
    published: number;
    stale: number;
  };
  queue: DestinyMatrixSlot[];
  reasons: string[];
};

export type ContentOsRunResult = {
  plan: ContentOsRunPlan;
  articles: ContentOsGeneratedArticle[];
  savedIds: string[];
  publishedIds: string[];
  draftDir: string;
  qualitySummary: Array<{
    slug: string;
    overall: number;
    publishReady: boolean;
    repairRounds: number;
    status: 'published' | 'draft';
  }>;
};

const STATE_DIR = path.join(process.cwd(), 'content', 'os-state');
const DRAFT_DIR = path.join(process.cwd(), 'content', 'os-drafts');

function matrixKeyFromEntry(entry: ManagedContentEntry) {
  const meta = entry.meta || {};
  if (typeof meta.matrixKey === 'string' && meta.matrixKey) return meta.matrixKey;
  return `slug:${entry.slug}:${entry.meta?.locale || entry.locale || 'zh-CN'}`;
}

function entryAgeDays(entry: ManagedContentEntry, now = Date.now()) {
  const ts = Date.parse(entry.updatedAt || entry.createdAt || '');
  if (!Number.isFinite(ts)) return 9999;
  return Math.max(0, (now - ts) / 86_400_000);
}

export function buildCoverageMap(params?: {
  locales?: ContentOsLocale[];
  entries?: ManagedContentEntry[];
}): ContentOsCoverageRow[] {
  const mode = resolveContentOsMode();
  const locales = resolveProductionLocales(params?.locales);
  const slots =
    mode === 'people-first'
      ? buildPeopleFirstCatalog({ locales })
      : buildContentOsMatrix({
          locales,
          includeSeasonal: true,
          includeDoorwayRiskKinds: true,
          includeComparisons: true,
        });
  const entries = params?.entries || listManagedContentEntries();
  const byMatrix = new Map<string, ManagedContentEntry>();
  for (const entry of entries) {
    byMatrix.set(matrixKeyFromEntry(entry), entry);
    byMatrix.set(`slug:${entry.slug}`, entry);
  }

  const now = Date.now();
  return slots.map((slot) => {
    const entry =
      byMatrix.get(slot.key) ||
      entries.find(
        (item) =>
          item.slug.includes(slot.entitySlug) &&
          `${item.locale || item.meta?.locale || ''}` === slot.locale,
      );

    if (!entry) {
      return {
        key: slot.key,
        topic: slot.topic,
        locale: slot.locale,
        entityKind: slot.entityKind,
        priority: slot.priority,
        status: 'missing' as const,
      };
    }

    const ageDays = entryAgeDays(entry, now);
    const stale = ageDays > slot.refreshDays;
    return {
      key: slot.key,
      topic: slot.topic,
      locale: slot.locale,
      entityKind: slot.entityKind,
      priority: slot.priority,
      status: entry.status === 'published' ? (stale ? 'stale' : 'published') : 'draft',
      entryId: entry.id,
      updatedAt: entry.updatedAt,
      ageDays: Math.round(ageDays),
    };
  });
}

export function buildContentOsRunPlan(params?: {
  locales?: ContentOsLocale[];
  limit?: number;
  prefer?: Array<'missing' | 'stale' | 'draft'>;
  minPriority?: number;
}): ContentOsRunPlan {
  const limit = Math.max(1, Math.min(params?.limit || 8, 20));
  const prefer = params?.prefer || ['missing', 'stale'];
  const minPriority = params?.minPriority ?? 0;
  const mode = resolveContentOsMode();
  const locales = resolveProductionLocales(params?.locales);
  const entries = listManagedContentEntries();

  // People-first catalog (default): finite hubs + satellites, not 990-slot farm
  const matrix =
    mode === 'people-first'
      ? buildPeopleFirstCatalog({ locales })
      : buildContentOsMatrix({
          locales,
          includeSeasonal: true,
          includeDoorwayRiskKinds: true,
          includeComparisons: true,
        });

  const coverage = buildCoverageMap({ locales, entries });
  const coverageByKey = new Map(coverage.map((row) => [row.key, row]));
  const published = entries.filter((e) => e.status === 'published' || e.status === 'draft');

  const reasons: string[] = [];
  const queue: DestinyMatrixSlot[] = [];
  const skipped: string[] = [];

  const rankSlot = (slot: DestinyMatrixSlot) =>
    slot.priority + peopleFirstPriorityBoost(slot);

  const tryEnqueue = (slot: DestinyMatrixSlot, reason: string) => {
    if (queue.length >= limit) return;
    if (queue.some((item) => item.key === slot.key)) return;

    if (mode === 'people-first' && !canExpandLocale({ slot, published })) {
      skipped.push(`locale-wait:${slot.key}`);
      return;
    }

    const gate = gateSlotForProduction(slot, published, { mode });
    if (!gate.allow) {
      skipped.push(`gate:${slot.key}:${gate.reasons[0] || 'blocked'}`);
      return;
    }

    queue.push(slot);
    reasons.push(`${reason}: ${slot.topic} [${slot.entityKind}/${slot.entitySlug}]`);
  };

  const pick = (status: ContentOsCoverageRow['status'], reason: string) => {
    const candidates = matrix
      .filter((slot) => slot.priority >= minPriority)
      .filter((slot) => coverageByKey.get(slot.key)?.status === status)
      .sort((a, b) => rankSlot(b) - rankSlot(a));

    for (const slot of candidates) {
      if (queue.length >= limit) break;
      tryEnqueue(slot, reason);
    }
  };

  for (const status of prefer) {
    if (queue.length >= limit) break;
    // People-first labels: satellite problem fill, not "刷缺口"
    const label =
      status === 'missing'
        ? mode === 'people-first'
          ? '实体卫星补问'
          : '补齐缺口'
        : status === 'stale'
          ? '真实刷新'
          : '推进草稿';
    pick(status, label);
  }

  // Cold start: top life-question + dimension how-tos only
  if (queue.length === 0) {
    const cold = matrix
      .filter(
        (s) =>
          s.priority >= minPriority &&
          (s.entityKind === 'life-question' ||
            s.entityKind === 'dimension' ||
            s.entityKind === 'methodology' ||
            (s.entityKind === 'tool' && s.template === 'how-to')),
      )
      .sort((a, b) => rankSlot(b) - rankSlot(a));
    for (const slot of cold) {
      if (queue.length >= limit) break;
      tryEnqueue(slot, '冷启动：高意图任务型卫星');
    }
  }

  const counts = {
    missing: coverage.filter((r) => r.status === 'missing').length,
    draft: coverage.filter((r) => r.status === 'draft').length,
    published: coverage.filter((r) => r.status === 'published').length,
    stale: coverage.filter((r) => r.status === 'stale').length,
  };

  if (skipped.length) {
    reasons.push(
      `policy skipped ${skipped.length} (near-dup/locale/doorway); mode=${mode}; ${PRODUCTION_CONSTITUTION_SUMMARY.northStar}`,
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    matrixSummary: summarizeContentOsMatrix(matrix),
    coverage: counts,
    queue: queue.slice(0, limit),
    reasons: reasons.slice(0, limit + 3),
  };
}

async function ensureDirs() {
  await mkdir(STATE_DIR, { recursive: true });
  await mkdir(DRAFT_DIR, { recursive: true });
}

export async function persistContentOsArticles(
  articles: Array<ContentOsGeneratedArticle | RepairedArticle>,
  options?: { autoPublish?: boolean },
) {
  await ensureDirs();
  const savedIds: string[] = [];
  const publishedIds: string[] = [];
  const day = new Date().toISOString().slice(0, 10);
  const batchDir = path.join(DRAFT_DIR, day);
  await mkdir(batchDir, { recursive: true });

  const existingSlugs = new Set(
    listManagedContentEntries().map((entry) => `${entry.slug || ''}`.trim()).filter(Boolean),
  );

  const autoPublish = options?.autoPublish !== false;

  for (const article of articles) {
    const repaired = article as RepairedArticle;
    const multi = repaired.multiQuality || scoreContentOsDimensions(article);
    const shouldPublish = autoPublish && (repaired.publishedReady || multi.publishReady);

    const input = articleToManagedInput(article, {
      status: shouldPublish ? 'published' : 'draft',
      multiQuality: multi,
      repairRounds: repaired.repairRounds ?? 0,
    });

    // Prefer updating same matrixKey slug; else unique suffix
    let slug = input.slug;
    let n = 2;
    while (existingSlugs.has(slug)) {
      // If same matrix already published with this base slug, allow overwrite via save with new id path —
      // keep unique slugs for safety.
      slug = `${input.slug}-r${n}`;
      n += 1;
    }
    input.slug = slug;
    existingSlugs.add(slug);
    article.slug = slug;

    let saved: ManagedContentEntry;
    try {
      saved = saveManagedContentEntry(input, 'content-os');
    } catch (error) {
      const suffix = Date.now().toString(36);
      input.slug = `${input.slug}-${suffix}`.slice(0, 80);
      article.slug = input.slug;
      existingSlugs.add(input.slug);
      saved = saveManagedContentEntry(input, 'content-os');
      console.warn('[content-os] save retry after error', error instanceof Error ? error.message : error);
    }
    savedIds.push(saved.id);
    if (saved.status === 'published') publishedIds.push(saved.id);

    const filePath = path.join(batchDir, `${article.slug}.json`);
    await writeFile(
      filePath,
      JSON.stringify(
        {
          ...article,
          multiQuality: multi,
          coverImageB64: article.coverImageB64
            ? `[omitted ${article.coverImageB64.length} chars]`
            : undefined,
          managedId: saved.id,
          finalStatus: saved.status,
        },
        null,
        2,
      ),
      'utf8',
    );

    if (article.coverImageB64) {
      const imgPath = path.join(batchDir, `${article.slug}.b64.txt`);
      await writeFile(imgPath, article.coverImageB64, 'utf8');
    }
  }

  const ledgerPath = path.join(STATE_DIR, 'last-run.json');
  await writeFile(
    ledgerPath,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        count: articles.length,
        published: publishedIds.length,
        slugs: articles.map((a) => a.slug),
        savedIds,
        publishedIds,
        draftDir: batchDir,
      },
      null,
      2,
    ),
    'utf8',
  );

  return { savedIds, publishedIds, draftDir: batchDir };
}

export async function runContentOsCycle(params?: {
  locales?: ContentOsLocale[];
  limit?: number;
  withImage?: boolean;
  concurrency?: number;
  dryRun?: boolean;
  autoPublish?: boolean;
  repairRounds?: number;
}): Promise<ContentOsRunResult> {
  const plan = buildContentOsRunPlan({
    locales: params?.locales,
    limit: params?.limit,
  });

  if (params?.dryRun) {
    return {
      plan,
      articles: [],
      savedIds: [],
      publishedIds: [],
      draftDir: DRAFT_DIR,
      qualitySummary: [],
    };
  }

  const rawArticles = await generateBatchFromSlots(plan.queue, {
    withImage: params?.withImage,
    concurrency: params?.concurrency || 1,
  });

  // Multi-pass repair: score dimensions → LLM rewrite weak spots → re-score
  const repaired: RepairedArticle[] = [];
  for (let i = 0; i < rawArticles.length; i += 1) {
    const article = rawArticles[i];
    const slot = plan.queue[i];
    if (!slot) {
      const multi = scoreContentOsDimensions(article);
      repaired.push({
        ...article,
        multiQuality: multi,
        repairRounds: 0,
        publishedReady: multi.publishReady,
      });
      continue;
    }
    const fixed = await repairContentOsArticle(article, slot, {
      maxRounds: params?.repairRounds ?? 2,
    });
    repaired.push(fixed);
  }

  const { savedIds, publishedIds, draftDir } = await persistContentOsArticles(repaired, {
    autoPublish: params?.autoPublish !== false,
  });

  return {
    plan,
    articles: repaired,
    savedIds,
    publishedIds,
    draftDir,
    qualitySummary: repaired.map((a) => ({
      slug: a.slug,
      overall: a.multiQuality?.overall ?? a.quality.score,
      publishReady: Boolean(a.publishedReady || a.multiQuality?.publishReady),
      repairRounds: a.repairRounds ?? 0,
      status: a.publishedReady || a.multiQuality?.publishReady ? 'published' : 'draft',
    })),
  };
}

export async function readLastContentOsRun() {
  try {
    const raw = await readFile(path.join(STATE_DIR, 'last-run.json'), 'utf8');
    return JSON.parse(raw) as {
      at: string;
      count: number;
      slugs: string[];
      savedIds: string[];
      draftDir: string;
    };
  } catch {
    return null;
  }
}

export function getContentOsPaths() {
  return { stateDir: STATE_DIR, draftDir: DRAFT_DIR };
}
