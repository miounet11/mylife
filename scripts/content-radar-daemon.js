const intervalMs = Math.max(60_000, Number(process.env.CONTENT_RADAR_INTERVAL_MS || 1000 * 60 * 45));
const runUrl = process.env.CONTENT_RADAR_RUN_URL || 'http://127.0.0.1:8080/api/admin/content/radar/cron';
const token = process.env.CONTENT_RADAR_CRON_TOKEN || '';
const requestTimeoutMs = Math.max(10_000, Number(process.env.CONTENT_RADAR_REQUEST_TIMEOUT_MS || 60_000));
const startupDelayMs = Math.max(5_000, Number(process.env.CONTENT_RADAR_STARTUP_DELAY_MS || 15_000));
const retryDelayMs = Math.max(15_000, Number(process.env.CONTENT_RADAR_RETRY_DELAY_MS || Math.min(intervalMs, 60_000)));

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
    console.error('[content-radar-daemon] missing CONTENT_RADAR_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'POST',
      headers: {
        'x-radar-cron-token': token,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[content-radar-daemon] run failed:', data.error || response.statusText);
      return false;
    }

    console.log(
      `[content-radar-daemon] fetchedSources=${data.fetchedSources || 0} fetchedSignals=${data.fetchedSignals || 0}`
      + `${data.automation ? ` generated=${data.automation.generatedCount || 0} published=${data.automation.publishedCount || 0}` : ''}`
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    if (isTransientStartupError(message)) {
      console.warn('[content-radar-daemon] upstream not ready yet, will retry:', message);
    } else {
      console.error('[content-radar-daemon] request failed:', message);
    }
    return false;
  }
}

async function main() {
  console.log(
    `[content-radar-daemon] started interval=${intervalMs}ms url=${runUrl}`
    + ` timeout=${requestTimeoutMs}ms startupDelay=${startupDelayMs}ms retryDelay=${retryDelayMs}ms`
  );
  await sleep(startupDelayMs);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : retryDelayMs);
  }
}

main().catch((error) => {
  console.error('[content-radar-daemon] fatal:', error);
  process.exit(1);
});
