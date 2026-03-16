import type Database from 'better-sqlite3';
import { db } from '@/lib/database';
import {
  sourceDocumentOperations,
  type SourceDocumentRecord,
  type UpsertSourceDocumentInput,
} from '@/lib/knowledge-base-store';

export interface SignalLike {
  id: string;
  sourceId: string;
  sourceLabel: string;
  platform: string;
  title: string;
  url: string;
  author?: string;
  summary?: string;
  publishedAt?: string;
  matchedKeywords?: string[];
  score?: number;
  meta?: Record<string, unknown>;
}

function isRestrictedPlatform(platform: string) {
  const normalized = platform.trim().toLowerCase();
  return [
    'zhihu',
    'xiaohongshu',
    'bilibili',
    'youtube',
    'reddit',
    'weibo',
    'x',
    'twitter',
    'douban',
    'csdn',
  ].includes(normalized);
}

export function inferRightsStatusFromPlatform(platform: string): UpsertSourceDocumentInput['rightsStatus'] {
  if (isRestrictedPlatform(platform) || /google-news/i.test(platform)) {
    return 'platform_restricted';
  }

  return 'unknown';
}

export function inferSourceTypeFromSignal(signal: SignalLike): UpsertSourceDocumentInput['sourceType'] {
  if (/google-news|rss|atom/i.test(signal.platform)) {
    return 'rss';
  }

  return 'site';
}

export function buildSourceDocumentInputFromSignal(signal: SignalLike): UpsertSourceDocumentInput {
  return {
    sourceType: inferSourceTypeFromSignal(signal),
    platform: signal.platform,
    sourceId: signal.sourceId,
    canonicalUrl: signal.url,
    title: signal.title,
    author: signal.author,
    publishedAt: signal.publishedAt,
    summary: signal.summary,
    tags: signal.matchedKeywords || [],
    rightsStatus: inferRightsStatusFromPlatform(signal.platform),
    rawMeta: {
      signalId: signal.id,
      sourceLabel: signal.sourceLabel,
      score: signal.score || 0,
      ...(signal.meta || {}),
    },
  };
}

export function promoteSignalsToSourceDocuments(
  signals: SignalLike[],
  database: Database.Database = db
): SourceDocumentRecord[] {
  return signals
    .map((signal) => sourceDocumentOperations.upsert(database, buildSourceDocumentInputFromSignal(signal)))
    .filter((item): item is SourceDocumentRecord => !!item);
}
