import {
  generateManagedContentDrafts,
  type ContentGenerationInput,
  type GeneratedManagedContentDraft,
} from '@/lib/content-generation';
import {
  contentGenerationJobOperations,
} from '@/lib/database';
import {
  getContentGenerationJobBatchSize,
  getContentGenerationJobMaxAttempts,
  getContentGenerationJobRetryDelayMs,
  getContentGenerationJobStaleLockMinutes,
} from '@/lib/env';
import {
  listManagedContentEntries,
  saveManagedContentEntry,
  type ManagedContentEntry,
} from '@/lib/content-store';
import { generateId } from '@/lib/utils';
import type { ContentGenerationJobRecord } from '@/lib/user-types';

const DEFAULT_MAX_ATTEMPTS = getContentGenerationJobMaxAttempts();
const RETRY_DELAY_MS = getContentGenerationJobRetryDelayMs();
const STALE_LOCK_MINUTES = getContentGenerationJobStaleLockMinutes();
const DEFAULT_BATCH_SIZE = getContentGenerationJobBatchSize();

function ensureUniqueSlugs(entries: GeneratedManagedContentDraft[]) {
  const existingSlugs = new Set(listManagedContentEntries().map((item) => item.slug));
  const batchSlugs = new Set<string>();

  return entries.map((entry) => {
    let slug = entry.slug;
    let suffix = 2;

    while (existingSlugs.has(slug) || batchSlugs.has(slug)) {
      slug = `${entry.slug}-${suffix}`;
      suffix += 1;
    }

    batchSlugs.add(slug);
    return {
      ...entry,
      slug,
    };
  });
}

function saveGeneratedEntries(entries: GeneratedManagedContentDraft[], userId: string) {
  return ensureUniqueSlugs(entries)
    .map((entry) =>
      saveManagedContentEntry({
        id: '',
        contentType: entry.contentType,
        subtype: entry.subtype,
        slug: entry.slug,
        title: entry.title,
        name: entry.name,
        excerpt: entry.excerpt,
        category: entry.category,
        readTime: entry.readTime,
        tags: entry.tags,
        featured: entry.featured,
        seoTitle: entry.seoTitle,
        seoDescription: entry.seoDescription,
        sections: entry.sections,
        status: entry.status,
        source: entry.source,
        meta: {
          contentGenerationJob: true,
        },
      } as unknown as Omit<ManagedContentEntry, 'source' | 'createdAt' | 'updatedAt'> & { source?: string }, userId)
    )
    .filter((entry): entry is ManagedContentEntry => !!entry);
}

function summarizeSavedEntries(entries: ManagedContentEntry[]) {
  return entries.map((entry) => ({
    id: entry.id,
    contentType: entry.contentType,
    subtype: entry.subtype,
    slug: entry.slug,
    title: entry.title,
    name: entry.name,
    excerpt: entry.excerpt,
    category: entry.category,
    readTime: entry.readTime,
    tags: entry.tags,
    featured: entry.featured,
    seoTitle: entry.seoTitle,
    seoDescription: entry.seoDescription,
    sections: entry.sections,
    status: entry.status,
    source: entry.source,
    updatedAt: entry.updatedAt,
  }));
}

export function enqueueContentGenerationJob(params: {
  userId: string;
  input: ContentGenerationInput;
  meta?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const job: ContentGenerationJobRecord = {
    id: `content_job_${generateId()}`,
    userId: params.userId,
    status: 'pending',
    request: params.input as unknown as Record<string, unknown>,
    result: {},
    generatedCount: 0,
    llmSucceededCount: 0,
    fallbackCount: 0,
    attempts: 0,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    nextRunAt: now,
    meta: {
      ...(params.meta || {}),
      topic: params.input.topic,
      mode: params.input.mode || 'single',
      contentType: params.input.contentType || 'knowledge',
      platform: params.input.platform || 'site',
    },
  };

  contentGenerationJobOperations.create(job);
  return contentGenerationJobOperations.getById(job.id);
}

export function getContentGenerationJob(jobId: string) {
  return contentGenerationJobOperations.getById(jobId);
}

export async function processNextContentGenerationJob() {
  const job = contentGenerationJobOperations.claimNextRunnable(STALE_LOCK_MINUTES);
  if (!job) {
    return {
      processed: false,
      reason: 'empty',
    };
  }

  // High-concurrency World Yi v2 jobs are exclusively handled by the dedicated
  // high-concurrency-world-yi-generator.ts (on content-workers). Skip here to
  // prevent polluting main LLM chain and standard content-generation path.
  const meta = (job.meta || {}) as Record<string, unknown>;
  if (meta.isWorldYiV2HighConc === true || meta.worldYiV2 === true) {
    // Requeue for specialized worker; do not process via standard drafts generator.
    const nextRunAt = new Date(Date.now() + 60_000).toISOString();
    contentGenerationJobOperations.markRetry(job.id, {
      result: { skippedForWorldYiV2Worker: true, requeuedAt: nextRunAt },
      nextRunAt,
      lastError: 'ROUTE_TO_WORLD_YI_HIGHCONC_WORKER',
    });
    return {
      processed: true,
      status: 'retry',
      jobId: job.id,
      reason: 'routed-to-world-yi-v2-highconc-worker',
      nextRunAt,
    };
  }

  try {
    const generated = await generateManagedContentDrafts(job.request as unknown as ContentGenerationInput);
    const savedEntries = saveGeneratedEntries(generated.entries, job.userId);
    const result = {
      entries: summarizeSavedEntries(savedEntries),
      generatedCount: savedEntries.length,
      llmSucceededCount: generated.llmSucceededCount,
      fallbackCount: generated.fallbackCount,
      completedAt: new Date().toISOString(),
    };

    contentGenerationJobOperations.markCompleted(job.id, {
      result,
      generatedCount: savedEntries.length,
      llmSucceededCount: generated.llmSucceededCount,
      fallbackCount: generated.fallbackCount,
      meta: {
        ...(job.meta || {}),
        completedAt: result.completedAt,
      },
    });

    return {
      processed: true,
      status: 'completed',
      jobId: job.id,
      generatedCount: savedEntries.length,
      llmSucceededCount: generated.llmSucceededCount,
      fallbackCount: generated.fallbackCount,
    };
  } catch (error) {
    const lastError = error instanceof Error ? error.message : `${error}`;
    const current = contentGenerationJobOperations.getById(job.id);
    const attempts = current?.attempts || job.attempts || 0;
    const maxAttempts = current?.maxAttempts || job.maxAttempts || DEFAULT_MAX_ATTEMPTS;

    if (attempts >= maxAttempts) {
      contentGenerationJobOperations.markFailed(job.id, {
        result: {
          failedAt: new Date().toISOString(),
        },
        generatedCount: job.generatedCount || 0,
        llmSucceededCount: job.llmSucceededCount || 0,
        fallbackCount: job.fallbackCount || 0,
        lastError,
        meta: {
          ...(job.meta || {}),
          failedAt: new Date().toISOString(),
        },
      });

      return {
        processed: true,
        status: 'failed',
        jobId: job.id,
        reason: lastError,
      };
    }

    const nextRunAt = new Date(Date.now() + RETRY_DELAY_MS).toISOString();
    contentGenerationJobOperations.markRetry(job.id, {
      result: {
        retryScheduledAt: nextRunAt,
      },
      generatedCount: job.generatedCount || 0,
      llmSucceededCount: job.llmSucceededCount || 0,
      fallbackCount: job.fallbackCount || 0,
      nextRunAt,
      lastError,
      meta: {
        ...(job.meta || {}),
        retryScheduledAt: nextRunAt,
      },
    });

    return {
      processed: true,
      status: 'retry',
      jobId: job.id,
      reason: lastError,
      nextRunAt,
    };
  }
}

export async function processContentGenerationJobBatch(limit = DEFAULT_BATCH_SIZE) {
  const jobs = [];

  for (let index = 0; index < limit; index += 1) {
    const result = await processNextContentGenerationJob();
    if (!result.processed) {
      if (index === 0) {
        return {
          processed: false,
          processedCount: 0,
          reason: 'empty',
          jobs,
        };
      }
      break;
    }

    jobs.push(result);
  }

  return {
    processed: jobs.length > 0,
    processedCount: jobs.length,
    reason: jobs[0]?.status || 'empty',
    jobs,
  };
}

// ============================================================================
// World Yi v2 High-Concurrency Job Queue Helpers (reuses content_generation_jobs)
// ============================================================================
// Design: Simple, safe multi-agent submission for 50-100 thread World Yi v2 elevation.
// - Tag with meta.isWorldYiV2HighConc + meta.worldYiLane + v2 rubric fields.
// - Specialized claim bypasses standard processor (see guard above).
// - Workers (high-concurrency generator on content-workers) claim directly.
// - Agents submit via CLI or by importing enqueueWorldYiV2Task.
// - DB provides atomic claim + lock + retry. No new tables needed.
// - For ultra-high scale alternative (future): file-backed queue under data/runtime/world-yi-v2-queue/ (atomic rename claim).
// ============================================================================

export interface WorldYiV2TaskInput {
  topic: string;
  lane?: string; // 'main' | 'wave2' | 'global' | custom
  priority?: number;
  rubricMinOverall?: number;
  v2Meta?: Record<string, unknown>;
  source?: string;
}

export function enqueueWorldYiV2Task(params: {
  userId?: string;
  tasks: WorldYiV2TaskInput[] | string[]; // topics or full inputs
  lane?: string;
  meta?: Record<string, unknown>;
}): { enqueued: number; jobIds: string[] } {
  const now = new Date().toISOString();
  const effectiveUserId = params.userId || 'system:world-yi-v2-bulk';
  const effectiveLane = params.lane || 'main';
  const jobIds: string[] = [];

  const inputs: WorldYiV2TaskInput[] = (params.tasks || []).map((t) =>
    typeof t === 'string' ? { topic: t, lane: effectiveLane } : t
  );

  for (const input of inputs) {
    const jobId = `worldyi_v2_${generateId()}`;
    const job: ContentGenerationJobRecord = {
      id: jobId,
      userId: effectiveUserId,
      status: 'pending',
      request: {
        mode: 'world-yi-v2-highconc',
        topic: input.topic,
        lane: input.lane || effectiveLane,
        worldYiV2: true,
      } as unknown as Record<string, unknown>,
      result: {},
      generatedCount: 0,
      attempts: 0,
      maxAttempts: 5, // higher tolerance for high-conc external API
      nextRunAt: now,
      meta: {
        isWorldYiV2HighConc: true,
        worldYiLane: input.lane || effectiveLane,
        worldYiV2: true,
        rubricMinOverall: input.rubricMinOverall || 82,
        priority: input.priority ?? 100,
        v2Meta: input.v2Meta || {},
        source: params.meta?.source || input.source || 'high-concurrency-generator',
        ...(params.meta || {}),
      },
    };

    try {
      contentGenerationJobOperations.create(job);
      jobIds.push(jobId);
    } catch (e) {
      console.error('[WorldYi-Queue] enqueue failed for topic', input.topic, e);
    }
  }

  return { enqueued: jobIds.length, jobIds };
}

export function claimNextWorldYiV2Task(staleLockMinutes = 45) {
  // Leverage existing stale handling + custom filter for v2 flag.
  // We re-use claimNextRunnable which does the heavy lifting, then verify tag.
  // If mismatch, we immediately markRetry so it becomes available again (light penalty).
  const candidate = contentGenerationJobOperations.claimNextRunnable(staleLockMinutes);
  if (!candidate) return null;

  const meta = (candidate.meta || {}) as Record<string, unknown>;
  if (meta.isWorldYiV2HighConc === true || meta.worldYiV2 === true) {
    return candidate;
  }

  // Not for us — immediately unlock for standard path
  const next = new Date(Date.now() + 10_000).toISOString();
  contentGenerationJobOperations.markRetry(candidate.id, {
    result: { misrouted: true },
    nextRunAt: next,
    lastError: 'MISROUTED_FROM_WORLDYI_V2_CLAIM',
  });
  return null;
}

export function listWorldYiV2QueueSummary() {
  const all = contentGenerationJobOperations.listRecent(200);
  const v2Jobs = all.filter((j) => {
    const m = (j.meta || {}) as Record<string, unknown>;
    return m.isWorldYiV2HighConc === true || m.worldYiV2 === true;
  });
  const byStatus: Record<string, number> = {};
  v2Jobs.forEach((j) => {
    byStatus[j.status] = (byStatus[j.status] || 0) + 1;
  });
  return {
    totalV2: v2Jobs.length,
    byStatus,
    pending: byStatus['pending'] || 0,
    running: byStatus['running'] || 0,
    completed: byStatus['completed'] || 0,
    failed: byStatus['failed'] || 0,
    recent: v2Jobs.slice(0, 5).map((j) => ({
      id: j.id,
      status: j.status,
      topic: (j.request as any)?.topic,
      lane: (j.meta as any)?.worldYiLane,
      attempts: j.attempts,
    })),
  };
}
