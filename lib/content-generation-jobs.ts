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
