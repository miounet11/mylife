// @ts-nocheck
/**
 * Redis-backed multi-tier cache for SSR performance & stability.
 *
 * Tiers:
 *   HOT   (30s)  — real-time data: stats, counts, feeds
 *   WARM  (300s) — semi-static: page data, lists, queries
 *   COLD  (1800s)— static: knowledge articles, case studies, visual assets
 *
 * Features:
 *   - Stale-while-revalidate: serve stale data while async refresh
 *   - Page cache: full page data with namespace isolation
 *   - Query cache: lightweight DB query wrapper
 *   - Startup warmup: preload critical pages after restart
 *   - Graceful degradation: falls back to direct fetch if Redis unreachable
 */

import Redis from "ioredis";

// ── TTL tiers ──────────────────────────────────────────────
export const CacheTTL = {
  HOT: 30,
  WARM: 300,
  COLD: 1800,
  LONG: 7200,
} as const;

// ── Redis connection ───────────────────────────────────────
let redis: Redis | null = null;
let redisErrorLogged = false;
let redisConnected = false;

function getRedis(): Redis | null {
  if (redis && redisConnected) return redis;
  if (redis) return redis; // try anyway, might reconnect
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      connectTimeout: 2000,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 1000);
      },
    });
    redis.on("error", () => {
      if (!redisErrorLogged) {
        console.warn("[redis-cache] Redis unavailable, skipping cache");
        redisErrorLogged = true;
      }
      redisConnected = false;
    });
    redis.on("connect", () => {
      redisErrorLogged = false;
      redisConnected = true;
    });
    redis.on("close", () => {
      redisConnected = false;
    });
    return redis;
  } catch {
    return null;
  }
}

// ── Core cache wrapper ─────────────────────────────────────

export async function cacheWithRedis<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const r = getRedis();
  if (!r) return fetchFn();

  const namespacedKey = "lk:" + key;

  try {
    const cached = await r.get(namespacedKey);
    if (cached) return JSON.parse(cached) as T;
  } catch { /* read failed, continue to fetch */ }

  const result = await fetchFn();

  try {
    const serialized = JSON.stringify(result);
    if (serialized.length < 2_000_000) {
      await r.set(namespacedKey, serialized, "EX", ttlSeconds);
    }
  } catch { /* write failed, continue without caching */ }

  return result;
}

// ── Stale-while-revalidate ─────────────────────────────────

/**
 * Serve cached data immediately, refresh in background if stale.
 * Uses a "stale threshold" — data served from cache if within threshold,
 * otherwise falls through to fresh fetch.
 */
export async function cacheStaleWhileRevalidate<T>(
  key: string,
  ttlSeconds: number,
  staleThresholdSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const r = getRedis();
  if (!r) return fetchFn();

  const dataKey = "lk:" + key;
  const staleKey = "lk:" + key + ":stale";

  try {
    // Check primary cache
    const cached = await r.get(dataKey);
    if (cached) return JSON.parse(cached) as T;

    // Check stale cache
    const stale = await r.get(staleKey);
    if (stale) {
      // Trigger async refresh
      refreshInBackground(key, ttlSeconds, staleThresholdSeconds, fetchFn);
      return JSON.parse(stale) as T;
    }
  } catch { /* fall through */ }

  // No cache — fetch fresh
  const result = await fetchFn();
  try {
    const serialized = JSON.stringify(result);
    if (serialized.length < 2_000_000) {
      await Promise.all([
        r.set(dataKey, serialized, "EX", ttlSeconds),
        r.set(staleKey, serialized, "EX", ttlSeconds + staleThresholdSeconds),
      ]);
    }
  } catch { /* best effort */ }
  return result;
}

function refreshInBackground<T>(
  key: string,
  ttlSeconds: number,
  staleThresholdSeconds: number,
  fetchFn: () => Promise<T>
): void {
  const r = getRedis();
  if (!r) return;

  const dataKey = "lk:" + key;
  const staleKey = "lk:" + key + ":stale";

  fetchFn()
    .then(async (result) => {
      const serialized = JSON.stringify(result);
      if (serialized.length < 2_000_000) {
        await Promise.all([
          r!.set(dataKey, serialized, "EX", ttlSeconds),
          r!.set(staleKey, serialized, "EX", ttlSeconds + staleThresholdSeconds),
        ]);
      }
    })
    .catch(() => { /* background refresh failure is silent */ });
}

// ── Page cache ─────────────────────────────────────────────

/**
 * Cache entire page data payload.
 * Use for heavy SSR pages (knowledge, tools, reports, insights).
 * Keys are namespaced with "page:" prefix.
 */
export async function cachePage<T>(
  route: string,
  params: Record<string, string>,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const paramStr = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const key = `page:${route}${paramStr ? "?" + paramStr : ""}`;
  return cacheWithRedis(key, ttlSeconds, fetchFn);
}

/**
 * Invalidate page caches for a route.
 */
export async function invalidatePageCache(route: string): Promise<void> {
  await invalidateCache(`page:${route}*`);
}

// ── Query cache ────────────────────────────────────────────

/**
 * Cache DB query results.
 * Keys auto-generated from function name + arguments.
 */
export async function cacheQuery<T>(
  queryName: string,
  args: unknown[],
  ttlSeconds: number,
  fetchFn: () => T
): Promise<T> {
  const argsKey = JSON.stringify(args);
  const key = `query:${queryName}:${argsKey}`;
  return cacheWithRedis(key, ttlSeconds, async () => fetchFn());
}

// ── Rate limiter ───────────────────────────────────────────

/**
 * Simple sliding-window rate limiter backed by Redis.
 * Returns true if request is allowed, false if rate-limited.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const r = getRedis();
  if (!r) return { allowed: true, remaining: maxRequests, resetAt: 0 };

  const now = Math.floor(Date.now() / 1000);
  const rlKey = "lk:rl:" + key;
  const windowStart = now - windowSeconds;

  try {
    const multi = r.multi();
    multi.zremrangebyscore(rlKey, 0, windowStart);
    multi.zcard(rlKey);
    multi.zadd(rlKey, now, `${now}-${Math.random().toString(36).slice(2, 8)}`);
    multi.expire(rlKey, windowSeconds + 5);
    const results = await multi.exec();

    if (!results) return { allowed: true, remaining: maxRequests, resetAt: now + windowSeconds };

    const count = (results[1]?.[1] as number) ?? 0;
    const remaining = Math.max(0, maxRequests - count);
    return {
      allowed: count <= maxRequests,
      remaining,
      resetAt: now + windowSeconds,
    };
  } catch {
    return { allowed: true, remaining: maxRequests, resetAt: 0 };
  }
}

// ── Cache invalidation ─────────────────────────────────────

export async function invalidateCache(pattern: string): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    const keys = await r.keys("lk:" + pattern);
    if (keys.length > 0) {
      await r.del(...keys);
    }
  } catch { /* best effort */ }
}

/**
 * Invalidate all caches — use after major data changes.
 */
export async function invalidateAllCaches(): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const keys = await r.keys("lk:*");
    if (keys.length > 0) {
      // Delete in batches to avoid blocking
      const batchSize = 500;
      for (let i = 0; i < keys.length; i += batchSize) {
        await r.del(...keys.slice(i, i + batchSize));
      }
    }
  } catch { /* best effort */ }
}

// ── Cache warmup ───────────────────────────────────────────

export interface WarmupEntry {
  key: string;
  ttlSeconds: number;
  fetchFn: () => Promise<unknown>;
}

/**
 * Preload multiple cache entries. Used on startup to warm critical pages.
 * Runs fetches in parallel with concurrency limit.
 * Failures are silent — if a fetch fails, cache simply won't be warm.
 */
export async function warmupCache(
  entries: WarmupEntry[],
  concurrency = 3
): Promise<{ warmed: number; failed: number }> {
  const r = getRedis();
  if (!r) return { warmed: 0, failed: entries.length };

  let warmed = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (entry) => {
        const result = await entry.fetchFn();
        const serialized = JSON.stringify(result);
        if (serialized.length < 2_000_000) {
          await r.set("lk:" + entry.key, serialized, "EX", entry.ttlSeconds);
        }
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") warmed++;
      else failed++;
    }
  }

  if (warmed > 0) {
    console.log(`[redis-cache] Warmed ${warmed} cache entries (${failed} failed)`);
  }
  return { warmed, failed };
}

// ── Health / stats ─────────────────────────────────────────

export async function getCacheStats(): Promise<{
  keys: number;
  memory: string;
  hitRate: number;
}> {
  const r = getRedis();
  if (!r) return { keys: 0, memory: "0", hitRate: 0 };

  try {
    const keys = await r.keys("lk:*");
    const info = await r.info("stats");
    const memInfo = await r.info("memory");

    const hits = Number(info.match(/keyspace_hits:(\d+)/)?.[1] || "0");
    const misses = Number(info.match(/keyspace_misses:(\d+)/)?.[1] || "0");
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;
    const memory = memInfo.match(/used_memory_human:(.+)/)?.[1] || "0";

    return { keys: keys.length, memory, hitRate };
  } catch {
    return { keys: 0, memory: "0", hitRate: 0 };
  }
}

/**
 * Health check — returns true if Redis is responsive.
 */
export async function isRedisHealthy(): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    await r.ping();
    return true;
  } catch {
    return false;
  }
}
