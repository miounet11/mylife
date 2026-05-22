// v5-D68 forum 公开页缓存 — 防 bot/RSC prefetch 风暴打满 SQLite 同步查询
// 模式来自 D34 worldYiPublicStats 60s memoize / D34d public-growth-feed
//
// 注意：community 列表页是高 SEO 流量入口，每次 prefetch 都同步查 forum_questions（1700+ 条 + filter + ORDER BY）。
// 60s TTL 在 300 题/天（≈12/小时）下最多延迟 1 分钟看到新题，业务可接受；用户感知 ≈ 0。

import { forumQuestionOperations, forumAnswerOperations } from './database';

type ListParams = { limit?: number; offset?: number; category?: string; industry?: string; tag?: string };
type CountParams = { category?: string; industry?: string; tag?: string };

const TTL_MS = 60_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function memo<T>(key: string, compute: () => T): T {
  const now = Date.now();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }
  const value = compute();
  cache.set(key, { value, expiresAt: now + TTL_MS });
  return value;
}

function listKey(params: ListParams): string {
  return `list:${params.limit ?? 30}:${params.offset ?? 0}:${params.category ?? ''}:${params.industry ?? ''}:${params.tag ?? ''}`;
}

function countKey(params: CountParams): string {
  return `count:${params.category ?? ''}:${params.industry ?? ''}:${params.tag ?? ''}`;
}

export const forumPublicCache = {
  listVisible: (params: ListParams = {}) =>
    memo(listKey(params), () => forumQuestionOperations.listVisible(params)),
  countVisible: (params: CountParams = {}) =>
    memo(countKey(params), () => forumQuestionOperations.countVisible(params)),
  countTotal: () => memo('countTotal', () => forumQuestionOperations.countTotal()),
  countToday: () => memo('countToday', () => forumQuestionOperations.countToday()),
  listAnswers: (questionId: string) =>
    memo(`answers:${questionId}`, () => forumAnswerOperations.listByQuestion(questionId)),
  searchTitle: (q: string, limit = 30) =>
    memo(`search:${limit}:${q}`, () => forumQuestionOperations.searchTitle(q, limit)),
  /** 写路径或后台手动触发后调用，立即让所有列表/计数失效 */
  invalidateAll: () => {
    cache.clear();
  },
  size: () => cache.size,
};
