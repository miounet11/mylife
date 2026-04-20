import { listManagedContentEntries } from '@/lib/content-store';
import { getKnowledgeAcquisitionLockTtlMs } from '@/lib/env';
import { listFeaturedKnowledgeEditorialEntries } from '@/lib/knowledge-editorial';
import { listKnowledgeTopicHubs } from '@/lib/knowledge-network-feed';
import { listKnowledgePublishCandidates } from '@/lib/knowledge-publication-ops';
import {
  readKnowledgeAcquisitionLockStatus,
  readKnowledgeAcquisitionSnapshot,
} from '@/lib/knowledge-runtime-state';

export interface KnowledgeOpsSnapshot {
  metrics: {
    publishedKnowledgeEntries: number;
    draftKnowledgeEntries: number;
    publishedSynthesisEntries: number;
    draftSynthesisEntries: number;
    publishCandidateCount: number;
    topicHubCount: number;
    flagshipCount: number;
    homepageEligibleCount: number;
  };
  acquisition: {
    status: 'idle' | 'running' | 'success' | 'error';
    lastRunAt?: string;
    durationMs?: number;
    error?: string;
    lock: {
      present: boolean;
      stale: boolean;
      ageMs: number;
      ttlMs: number;
    };
  };
  featuredTopics: Array<{
    topicName: string;
    topicSlug: string;
    entryCount: number;
    synthesisTypes: string[];
  }>;
  publishQueue: Array<{
    slug: string;
    title: string;
    synthesisType: string;
    qualityScore: number;
  }>;
}

export function getKnowledgeOpsSnapshot(params?: {
  lockTtlMs?: number;
}) : KnowledgeOpsSnapshot {
  const lockTtlMs = params?.lockTtlMs ?? getKnowledgeAcquisitionLockTtlMs();
  const entries = listManagedContentEntries().filter((entry) => entry.contentType === 'knowledge');
  const topicHubs = listKnowledgeTopicHubs({ limit: 12 });
  const featuredEditorial = listFeaturedKnowledgeEditorialEntries(12);
  const publishQueue = listKnowledgePublishCandidates({ limit: 8 });
  const runtime = readKnowledgeAcquisitionSnapshot();
  const lockStatus = readKnowledgeAcquisitionLockStatus(lockTtlMs);

  return {
    metrics: {
      publishedKnowledgeEntries: entries.filter((entry) => entry.status === 'published').length,
      draftKnowledgeEntries: entries.filter((entry) => entry.status === 'draft').length,
      publishedSynthesisEntries: entries.filter((entry) => entry.status === 'published' && entry.source.startsWith('knowledge-synthesis:')).length,
      draftSynthesisEntries: entries.filter((entry) => entry.status === 'draft' && entry.source.startsWith('knowledge-synthesis:')).length,
      publishCandidateCount: publishQueue.length,
      topicHubCount: topicHubs.length,
      flagshipCount: featuredEditorial.filter((item) => item.editorialTier === 'flagship').length,
      homepageEligibleCount: featuredEditorial.length,
    },
    acquisition: {
      status: runtime?.status || 'idle',
      lastRunAt: runtime?.finishedAt || runtime?.updatedAt,
      durationMs: runtime?.durationMs,
      error: runtime?.error,
      lock: {
        present: !!lockStatus.lock,
        stale: lockStatus.stale,
        ageMs: lockStatus.ageMs,
        ttlMs: lockTtlMs,
      },
    },
    featuredTopics: topicHubs.slice(0, 6).map((hub) => ({
      topicName: hub.topicName,
      topicSlug: hub.topicSlug,
      entryCount: hub.entryCount,
      synthesisTypes: hub.synthesisTypes,
    })),
    publishQueue: publishQueue.map((item) => ({
      slug: item.entry.slug,
      title: item.entry.title,
      synthesisType: item.synthesisType,
      qualityScore: item.qualityScore,
    })),
  };
}
