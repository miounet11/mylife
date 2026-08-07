/**
 * Polls /api/admin/astro-daily/email/cron for astro:daily subscribers.
 */
const { readPositiveIntegerEnv } = require('./ops-env.js');

const intervalMs = readPositiveIntegerEnv('ASTRO_DAILY_EMAIL_INTERVAL_MS', 1000 * 60 * 60 * 24, {
  min: 60_000,
  max: 86_400_000 * 2,
});
const runUrl =
  process.env.ASTRO_DAILY_EMAIL_RUN_URL
  || 'http://127.0.0.1:8080/api/admin/astro-daily/email/cron?limit=50';
const token =
  process.env.ASTRO_DAILY_EMAIL_CRON_TOKEN
  || process.env.TIMING_EMAIL_CRON_TOKEN
  || process.env.DAILY_WINDOW_EMAIL_CRON_TOKEN
  || '';
const requestTimeoutMs = readPositiveIntegerEnv('ASTRO_DAILY_EMAIL_REQUEST_TIMEOUT_MS', 90_000, {
  min: 30_000,
  max: 900_000,
});
const startupDelayMs = readPositiveIntegerEnv('ASTRO_DAILY_EMAIL_STARTUP_DELAY_MS', 50_000, {
  min: 5_000,
  max: 300_000,
});
const enabled = `${process.env.ASTRO_DAILY_EMAIL_ENABLED || '1'}` !== '0';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function runOnce() {
  if (!token) {
    console.warn('[astro-daily-email] missing cron token, skip');
    return;
  }
  const res = await fetchWithTimeout(runUrl, {
    method: 'POST',
    headers: {
      'x-astro-daily-email-cron-token': token,
      'x-timing-email-cron-token': token,
    },
  });
  const text = await res.text();
  console.log(`[astro-daily-email] ${res.status} ${text.slice(0, 500)}`);
}

async function main() {
  if (!enabled) {
    console.log('[astro-daily-email] disabled');
    return;
  }
  console.log(`[astro-daily-email] start interval=${intervalMs}ms url=${runUrl}`);
  await sleep(startupDelayMs);
  for (;;) {
    try {
      await runOnce();
    } catch (e) {
      console.error('[astro-daily-email] error', e instanceof Error ? e.message : e);
    }
    await sleep(intervalMs);
  }
}

main();
