/**
 * Startup cache warming script.
 *
 * Runs after PM2 restart to preload critical pages into Redis cache.
 * This reduces the 2-minute cold-start vulnerability window where
 * Next.js is compiling pages and can't serve requests.
 *
 * Usage: node scripts/warm-cache.mjs
 * PM2:   pm2 start warm-cache --node-args="--max-old-space-size=512" --no-autorestart
 */

import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: 2,
  connectTimeout: 3000,
  lazyConnect: true,
});

const TTL_WARM = 300;
const TTL_COLD = 1800;

/**
 * Pages to warm on startup. Each entry:
 *   - url: Next.js internal URL to fetch
 *   - ttl: cache TTL in seconds
 *   - description: for logging
 */
const WARMUP_PAGES = [
  { url: "http://127.0.0.1:3000/", ttl: 180, description: "homepage" },
  { url: "http://127.0.0.1:3000/knowledge", ttl: TTL_COLD, description: "knowledge index" },
  { url: "http://127.0.0.1:3000/tools", ttl: TTL_COLD, description: "tools index" },
  { url: "http://127.0.0.1:3000/reports", ttl: TTL_WARM, description: "reports feed" },
  { url: "http://127.0.0.1:3000/cases", ttl: TTL_COLD, description: "case studies" },
  { url: "http://127.0.0.1:3000/insights", ttl: TTL_COLD, description: "insights" },
  { url: "http://127.0.0.1:3000/world-yi", ttl: TTL_COLD, description: "world-yi" },
  { url: "http://127.0.0.1:3000/community", ttl: TTL_WARM, description: "community" },
];

async function warmPage(redis, url, ttl, description) {
  const cacheKey = `lk:warmup:page:${new URL(url).pathname}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(45_000),
      headers: { "Host": "www.life-kline.com" },
    });

    if (response.ok) {
      const html = await response.text();
      // Only cache if reasonable size
      if (html.length > 500 && html.length < 2_000_000) {
        await redis.set(cacheKey, html, "EX", ttl);
        return { ok: true, size: html.length };
      }
    }
    return { ok: false, status: response.status, size: 0 };
  } catch (err) {
    return { ok: false, error: err.message, size: 0 };
  }
}

async function main() {
  console.log("[warm-cache] Connecting to Redis...");
  try {
    await redis.connect();
    console.log("[warm-cache] Redis connected");
  } catch {
    console.log("[warm-cache] Redis unavailable, skipping warmup");
    process.exit(0);
  }

  console.log(`[warm-cache] Warming ${WARMUP_PAGES.length} pages...`);

  // Wait for Next.js to be ready (may take up to 2 min after restart)
  let ready = false;
  for (let i = 0; i < 24; i++) {
    try {
      const res = await fetch("http://127.0.0.1:3000/", {
        signal: AbortSignal.timeout(10_000),
        headers: { "Host": "www.life-kline.com" },
      });
      if (res.ok) {
        ready = true;
        break;
      }
    } catch { /* still starting */ }
    console.log(`[warm-cache] Waiting for Next.js to be ready... (${(i + 1) * 5}s)`);
    await new Promise((r) => setTimeout(r, 5000));
  }

  if (!ready) {
    console.log("[warm-cache] Next.js not ready after 2 min, aborting");
    process.exit(0);
  }

  console.log("[warm-cache] Next.js ready, starting warmup...");

  // Warm pages sequentially (don't overload the starting server)
  let warmed = 0;
  let failed = 0;

  for (const page of WARMUP_PAGES) {
    const result = await warmPage(redis, page.url, page.ttl, page.description);
    if (result.ok) {
      warmed++;
      console.log(`[warm-cache] ✓ ${page.description} (${(result.size / 1024).toFixed(1)} KB)`);
    } else {
      failed++;
      console.log(`[warm-cache] ✗ ${page.description} (${result.status || result.error})`);
    }
    // Small delay between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`[warm-cache] Done: ${warmed} warmed, ${failed} failed`);
  await redis.quit();
  process.exit(0);
}

main().catch((err) => {
  console.error("[warm-cache] Fatal:", err.message);
  process.exit(1);
});
