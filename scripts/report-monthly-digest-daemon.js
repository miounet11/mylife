const { readPositiveIntegerEnv } = require('./ops-env.js');

const intervalMs = readPositiveIntegerEnv('REPORT_MONTHLY_DIGEST_INTERVAL_MS', 1000 * 60 * 60 * 6, { min: 60_000, max: 86_400_000 });
const runUrl = process.env.REPORT_MONTHLY_DIGEST_RUN_URL || 'http://127.0.0.1:8080/api/admin/report-monthly-digest/cron';
const token = process.env.REPORT_MONTHLY_DIGEST_CRON_TOKEN || '';
const requestTimeoutMs = readPositiveIntegerEnv('REPORT_MONTHLY_DIGEST_REQUEST_TIMEOUT_MS', 60_000, { min: 10_000, max: 900_000 });
const startupDelayMs = readPositiveIntegerEnv('REPORT_MONTHLY_DIGEST_STARTUP_DELAY_MS', 30_000, { min: 5_000, max: 300_000 });
const retryDelayMs = readPositiveIntegerEnv('REPORT_MONTHLY_DIGEST_RETRY_DELAY_MS', Math.min(intervalMs, 60_000), { min: 15_000, max: 900_000 });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
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
  if (!token) {
    console.error('[report-monthly-digest-daemon] missing REPORT_MONTHLY_DIGEST_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-report-monthly-digest-cron-token': token,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[report-monthly-digest-daemon] run failed:', data.error || response.statusText);
      return false;
    }

    console.log(
      `[report-monthly-digest-daemon] cycle=${data.cycleKey || ''} sent=${data.sentCount || 0} skipped=${data.skippedCount || 0} errors=${data.errorCount || 0} reason=${data.reason || ''}`
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    if (isTransientStartupError(message)) {
      console.warn('[report-monthly-digest-daemon] upstream not ready yet, will retry:', message);
    } else {
      console.error('[report-monthly-digest-daemon] request failed:', message);
    }
    return false;
  }
}

async function main() {
  console.log(
    `[report-monthly-digest-daemon] started interval=${intervalMs}ms url=${runUrl}`
    + ` timeout=${requestTimeoutMs}ms startupDelay=${startupDelayMs}ms retryDelay=${retryDelayMs}ms`
  );
  await sleep(startupDelayMs);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : retryDelayMs);
  }
}

main().catch((error) => {
  console.error('[report-monthly-digest-daemon] fatal:', error);
  process.exit(1);
});
