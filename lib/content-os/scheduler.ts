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
  summarizeContentOsMatrix,
  type ContentOsLocale,
  type DestinyMatrixSlot,
} from '@/lib/content-os/matrix';
import {
  articleToManagedInput,
  generateBatchFromSlots,
  type ContentOsGeneratedArticle,
} from '@/lib/content-os/generator';
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
  draftDir: string;
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
  const slots = buildContentOsMatrix({
    locales: params?.locales,
    includeSeasonal: true,
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
  const limit = Math.max(1, Math.min(params?.limit || 8, 40));
  const prefer = params?.prefer || ['missing', 'stale'];
  const minPriority = params?.minPriority ?? 0;
  const matrix = buildContentOsMatrix({
    locales: params?.locales,
    includeSeasonal: true,
  });
  const coverage = buildCoverageMap({ locales: params?.locales });
  const coverageByKey = new Map(coverage.map((row) => [row.key, row]));

  const reasons: string[] = [];
  const queue: DestinyMatrixSlot[] = [];

  const pick = (status: ContentOsCoverageRow['status'], reason: string) => {
    const candidates = matrix
      .filter((slot) => slot.priority >= minPriority)
      .filter((slot) => coverageByKey.get(slot.key)?.status === status)
      .sort((a, b) => b.priority - a.priority);

    for (const slot of candidates) {
      if (queue.length >= limit) break;
      if (queue.some((item) => item.key === slot.key)) continue;
      queue.push(slot);
      reasons.push(`${reason}: ${slot.key}`);
    }
  };

  for (const status of prefer) {
    if (queue.length >= limit) break;
    pick(status, status === 'missing' ? '补齐缺口' : status === 'stale' ? '刷新过期' : '推进草稿');
  }

  // If still empty (local stub with no locale match), take top priority pillars.
  if (queue.length === 0) {
    queue.push(...matrix.filter((s) => s.priority >= minPriority).slice(0, limit));
    reasons.push('冷启动：按优先级生成支柱内容');
  }

  const counts = {
    missing: coverage.filter((r) => r.status === 'missing').length,
    draft: coverage.filter((r) => r.status === 'draft').length,
    published: coverage.filter((r) => r.status === 'published').length,
    stale: coverage.filter((r) => r.status === 'stale').length,
  };

  return {
    generatedAt: new Date().toISOString(),
    matrixSummary: summarizeContentOsMatrix(matrix),
    coverage: counts,
    queue: queue.slice(0, limit),
    reasons: reasons.slice(0, limit),
  };
}

async function ensureDirs() {
  await mkdir(STATE_DIR, { recursive: true });
  await mkdir(DRAFT_DIR, { recursive: true });
}

export async function persistContentOsArticles(articles: ContentOsGeneratedArticle[]) {
  await ensureDirs();
  const savedIds: string[] = [];
  const day = new Date().toISOString().slice(0, 10);
  const batchDir = path.join(DRAFT_DIR, day);
  await mkdir(batchDir, { recursive: true });

  const existingSlugs = new Set(
    listManagedContentEntries().map((entry) => `${entry.slug || ''}`.trim()).filter(Boolean),
  );

  for (const article of articles) {
    const input = articleToManagedInput(article);
    // Avoid SQLITE_CONSTRAINT_UNIQUE on slug when re-running matrix slots
    let slug = input.slug;
    let n = 2;
    while (existingSlugs.has(slug)) {
      slug = `${input.slug}-${n}`;
      n += 1;
    }
    input.slug = slug;
    existingSlugs.add(slug);
    article.slug = slug;

    let saved: ManagedContentEntry;
    try {
      saved = saveManagedContentEntry(input, 'content-os');
    } catch (error) {
      // Production CMS may enforce unique slug/id — retry once with entropy suffix
      const suffix = Date.now().toString(36);
      input.slug = `${input.slug}-${suffix}`.slice(0, 80);
      article.slug = input.slug;
      existingSlugs.add(input.slug);
      saved = saveManagedContentEntry(input, 'content-os');
      console.warn('[content-os] save retry after error', error instanceof Error ? error.message : error);
    }
    savedIds.push(saved.id);

    const filePath = path.join(batchDir, `${article.slug}.json`);
    await writeFile(
      filePath,
      JSON.stringify(
        {
          ...article,
          coverImageB64: article.coverImageB64
            ? `[omitted ${article.coverImageB64.length} chars]`
            : undefined,
          managedId: saved.id,
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
        slugs: articles.map((a) => a.slug),
        savedIds,
        draftDir: batchDir,
      },
      null,
      2,
    ),
    'utf8',
  );

  return { savedIds, draftDir: batchDir };
}

export async function runContentOsCycle(params?: {
  locales?: ContentOsLocale[];
  limit?: number;
  withImage?: boolean;
  concurrency?: number;
  dryRun?: boolean;
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
      draftDir: DRAFT_DIR,
    };
  }

  const articles = await generateBatchFromSlots(plan.queue, {
    withImage: params?.withImage,
    concurrency: params?.concurrency || 2,
  });

  const { savedIds, draftDir } = await persistContentOsArticles(articles);

  return {
    plan,
    articles,
    savedIds,
    draftDir,
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
