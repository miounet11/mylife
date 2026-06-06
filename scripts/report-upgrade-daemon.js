const intervalMs = Math.max(30_000, Number(process.env.REPORT_UPGRADE_INTERVAL_MS || 1000 * 60 * 3));
const runUrl = process.env.REPORT_UPGRADE_RUN_URL || 'http://127.0.0.1:8080/api/admin/report-upgrade/cron';
const token = process.env.REPORT_UPGRADE_CRON_TOKEN || '';
const requestTimeoutMs = Math.max(10_000, Number(process.env.REPORT_UPGRADE_REQUEST_TIMEOUT_MS || 60_000));
const startupDelayMs = Math.max(5_000, Number(process.env.REPORT_UPGRADE_STARTUP_DELAY_MS || 20_000));
const retryDelayMs = Math.max(15_000, Number(process.env.REPORT_UPGRADE_RETRY_DELAY_MS || Math.min(intervalMs, 60_000)));

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
    console.error('[report-upgrade-daemon] missing REPORT_UPGRADE_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-report-upgrade-cron-token': token,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[report-upgrade-daemon] run failed:', data.error || response.statusText);
      return false;
    }

    console.log(
      `[report-upgrade-daemon] processed=${data.processedCount || (data.processed ? 1 : 0)} status=${data.reason || data.jobs?.[0]?.status || 'idle'} jobs=${JSON.stringify(data.jobs || [])}`
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    if (isTransientStartupError(message)) {
      console.warn('[report-upgrade-daemon] upstream not ready yet, will retry:', message);
    } else {
      console.error('[report-upgrade-daemon] request failed:', message);
    }
    return false;
  }
}

async function main() {
  console.log(
    `[report-upgrade-daemon] started interval=${intervalMs}ms url=${runUrl}`
    + ` timeout=${requestTimeoutMs}ms startupDelay=${startupDelayMs}ms retryDelay=${retryDelayMs}ms`
  );
  await sleep(startupDelayMs);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : retryDelayMs);
  }
}

main().catch((error) => {
  console.error('[report-upgrade-daemon] fatal:', error);
  process.exit(1);
});
