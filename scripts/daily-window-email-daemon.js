/**
 * Polls /api/admin/daily-window/email/cron for timing:daily subscribers.
 * Mirrors scripts/timing-email-daemon.js (interval + token + soft startup).
 */
const { readPositiveIntegerEnv } = require('./ops-env.js');

const intervalMs = readPositiveIntegerEnv(
  'DAILY_WINDOW_EMAIL_INTERVAL_MS',
  // Default 24h — educational daily tip, not spam
  1000 * 60 * 60 * 24,
  { min: 60_000, max: 86_400_000 * 2 },
);
const runUrl =
  process.env.DAILY_WINDOW_EMAIL_RUN_URL
  || 'http://127.0.0.1:8080/api/admin/daily-window/email/cron?limit=50';
const token =
  process.env.DAILY_WINDOW_EMAIL_CRON_TOKEN
  || process.env.TIMING_EMAIL_CRON_TOKEN
  || '';
const requestTimeoutMs = readPositiveIntegerEnv(
  'DAILY_WINDOW_EMAIL_REQUEST_TIMEOUT_MS',
  90_000,
  { min: 30_000, max: 900_000 },
);
const startupDelayMs = readPositiveIntegerEnv(
  'DAILY_WINDOW_EMAIL_STARTUP_DELAY_MS',
  45_000,
  { min: 5_000, max: 300_000 },
);
const retryDelayMs = readPositiveIntegerEnv(
  'DAILY_WINDOW_EMAIL_RETRY_DELAY_MS',
  120_000,
  { min: 15_000, max: 900_000 },
);
const enabled = `${process.env.DAILY_WINDOW_EMAIL_ENABLED || '1'}` !== '0';

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

function isTransientStartupError(message) {
  return [
    'fetch failed',
    'ECONNREFUSED',
    'connect ECONNREFUSED',
    'bad port',
    'socket hang up',
    'network timeout',
    'This operation was aborted',
  ].some((pattern) => message.includes(pattern));
}

async function runCycle() {
  if (!enabled) {
    console.log('[daily-window-email-daemon] disabled DAILY_WINDOW_EMAIL_ENABLED=0');
    return true;
  }
  if (!token) {
    console.error(
      '[daily-window-email-daemon] missing DAILY_WINDOW_EMAIL_CRON_TOKEN or TIMING_EMAIL_CRON_TOKEN',
    );
    return false;
  }
  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-timing-email-cron-token': token,
        'x-daily-window-email-cron-token': token,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error(
        '[daily-window-email-daemon] run failed:',
        data.error || response.statusText,
      );
      return false;
    }
    console.log(
      `[daily-window-email-daemon] campaign=${data.campaign || '-'} sent=${data.sent ?? data.sentCount ?? 0} skipped=${data.skipped ?? 0} errors=${(data.errors || []).length}`,
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    if (isTransientStartupError(message)) {
      console.warn(
        '[daily-window-email-daemon] upstream not ready yet, will retry:',
        message,
      );
    } else {
      console.error('[daily-window-email-daemon] request failed:', message);
    }
    return false;
  }
}

async function main() {
  console.log(
    `[daily-window-email-daemon] started interval=${intervalMs}ms url=${runUrl}`
      + ` timeout=${requestTimeoutMs}ms startupDelay=${startupDelayMs}ms`,
  );
  await sleep(startupDelayMs);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : retryDelayMs);
  }
}

main().catch((error) => {
  console.error('[daily-window-email-daemon] fatal:', error);
  process.exit(1);
});
