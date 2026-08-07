/**
 * Weekly zodiac ranking email — tag astro:weekly
 * Default interval 7 days.
 */
const { readPositiveIntegerEnv } = require('./ops-env.js');

const intervalMs = readPositiveIntegerEnv('ASTRO_WEEKLY_EMAIL_INTERVAL_MS', 1000 * 60 * 60 * 24 * 7, {
  min: 60_000,
  max: 86_400_000 * 14,
});
const runUrl =
  process.env.ASTRO_WEEKLY_EMAIL_RUN_URL
  || 'http://127.0.0.1:8080/api/admin/astro-weekly/email/cron?limit=50';
const token =
  process.env.ASTRO_WEEKLY_EMAIL_CRON_TOKEN
  || process.env.TIMING_EMAIL_CRON_TOKEN
  || '';
const requestTimeoutMs = readPositiveIntegerEnv('ASTRO_WEEKLY_EMAIL_REQUEST_TIMEOUT_MS', 120_000, {
  min: 30_000,
  max: 900_000,
});
const startupDelayMs = readPositiveIntegerEnv('ASTRO_WEEKLY_EMAIL_STARTUP_DELAY_MS', 80_000, {
  min: 5_000,
  max: 300_000,
});
const enabled = `${process.env.ASTRO_WEEKLY_EMAIL_ENABLED || '1'}` !== '0';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runOnce() {
  if (!token) {
    console.warn('[astro-weekly-email] missing token');
    return;
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const res = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'x-astro-weekly-email-cron-token': token,
        'x-timing-email-cron-token': token,
      },
      signal: controller.signal,
    });
    console.log(`[astro-weekly-email] ${res.status} ${(await res.text()).slice(0, 400)}`);
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  if (!enabled) return;
  console.log(`[astro-weekly-email] start interval=${intervalMs}`);
  await sleep(startupDelayMs);
  for (;;) {
    try {
      await runOnce();
    } catch (e) {
      console.error('[astro-weekly-email]', e instanceof Error ? e.message : e);
    }
    await sleep(intervalMs);
  }
}

main();
