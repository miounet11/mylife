const intervalMs = Math.max(60_000, Number(process.env.CONTENT_SCHEDULER_INTERVAL_MS || 1000 * 60 * 20));
const runUrl = process.env.CONTENT_SCHEDULER_RUN_URL || 'http://127.0.0.1:3000/api/admin/content/scheduler/cron';
const token = process.env.CONTENT_SCHEDULER_CRON_TOKEN || process.env.CONTENT_RADAR_CRON_TOKEN || '';
const requestTimeoutMs = Math.max(10_000, Number(process.env.CONTENT_SCHEDULER_REQUEST_TIMEOUT_MS || 1000 * 60 * 15));
const startupDelayMs = Math.max(5_000, Number(process.env.CONTENT_SCHEDULER_STARTUP_DELAY_MS || 20_000));
const retryDelayMs = Math.max(15_000, Number(process.env.CONTENT_SCHEDULER_RETRY_DELAY_MS || Math.min(intervalMs, 60_000)));

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
    console.error('[content-scheduler-daemon] missing CONTENT_SCHEDULER_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'POST',
      headers: {
        'x-scheduler-cron-token': token,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[content-scheduler-daemon] run failed:', data.error || response.statusText);
      return false;
    }

    console.log(
      `[content-scheduler-daemon] generated=${data.generatedCount || 0} published=${data.publishedCount || 0}`
      + `${data.publishedTitle ? ` title=${data.publishedTitle}` : ''} reason=${data.reason || ''}`
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    if (isTransientStartupError(message)) {
      console.warn('[content-scheduler-daemon] upstream not ready yet, will retry:', message);
    } else {
      console.error('[content-scheduler-daemon] request failed:', message);
    }
    return false;
  }
}

async function main() {
  console.log(
    `[content-scheduler-daemon] started interval=${intervalMs}ms url=${runUrl}`
    + ` timeout=${requestTimeoutMs}ms startupDelay=${startupDelayMs}ms retryDelay=${retryDelayMs}ms`
  );
  await sleep(startupDelayMs);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : retryDelayMs);
  }
}

main().catch((error) => {
  console.error('[content-scheduler-daemon] fatal:', error);
  process.exit(1);
});
