/**
 * Hot-path cache for chat report context (EFC + report id).
 * Cuts repeat buildChatPayload / engine pack cost within a short TTL.
 */

import type { ChatExperienceContext } from '@/lib/chat-context';

type CacheEntry = {
  at: number;
  context: ChatExperienceContext;
  userId: string;
  reportId: string;
  intentKey: string;
};

const TTL_MS = Number(process.env.CHAT_CONTEXT_CACHE_TTL_MS || 45_000) || 45_000;
const MAX = 200;
const store = new Map<string, CacheEntry>();

function keyOf(userId: string, reportId: string, intent?: string | null) {
  return `${userId}|${reportId}|${intent || ''}`;
}

export function getCachedChatContext(
  userId: string,
  reportId: string | null | undefined,
  intent?: string | null,
): ChatExperienceContext | null {
  if (!userId || !reportId) return null;
  const k = keyOf(userId, reportId, intent);
  const hit = store.get(k);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(k);
    return null;
  }
  // LRU touch
  store.delete(k);
  store.set(k, hit);
  return hit.context;
}

export function setCachedChatContext(
  userId: string,
  context: ChatExperienceContext,
  intent?: string | null,
): void {
  const reportId = context?.report?.id;
  if (!userId || !reportId) return;
  const k = keyOf(userId, reportId, intent);
  store.set(k, {
    at: Date.now(),
    context,
    userId,
    reportId,
    intentKey: intent || '',
  });
  while (store.size > MAX) {
    const first = store.keys().next().value;
    if (first == null) break;
    store.delete(first);
  }
}

export function chatContextCacheStats() {
  return { size: store.size, ttlMs: TTL_MS };
}
