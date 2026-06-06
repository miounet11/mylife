const intervalMs = Math.max(30_000, Number(process.env.CONTENT_GENERATION_JOB_INTERVAL_MS || 60_000));
const runUrl = process.env.CONTENT_GENERATION_JOB_RUN_URL || 'http://127.0.0.1:8080/api/admin/content/generate/cron';
const token = process.env.CONTENT_GENERATION_CRON_TOKEN
  || process.env.CONTENT_SCHEDULER_CRON_TOKEN
  || process.env.CONTENT_RADAR_CRON_TOKEN
  || '';
const requestTimeoutMs = Math.max(30_000, Number(process.env.CONTENT_GENERATION_JOB_REQUEST_TIMEOUT_MS || 1000 * 60 * 15));
const startupDelayMs = Math.max(5_000, Number(process.env.CONTENT_GENERATION_JOB_STARTUP_DELAY_MS || 15_000));
const retryDelayMs = Math.max(15_000, Number(process.env.CONTENT_GENERATION_JOB_RETRY_DELAY_MS || 60_000));

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
    'socket hang up',
    'network timeout',
    'This operation was aborted',
  ].some((pattern) => message.includes(pattern));
}

async function runCycle() {
  if (!token) {
    console.error('[content-generation-daemon] missing CONTENT_GENERATION_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'POST',
      headers: {
        'x-content-generation-cron-token': token,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[content-generation-daemon] run failed:', data.error || response.statusText);
      return false;
    }

    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    console.log(
      `[content-generation-daemon] processed=${data.processedCount || 0} reason=${data.reason || 'idle'}`
      + `${jobs[0]?.jobId ? ` firstJob=${jobs[0].jobId}` : ''}`
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    if (isTransientStartupError(message)) {
      console.warn('[content-generation-daemon] upstream not ready yet, will retry:', message);
    } else {
      console.error('[content-generation-daemon] request failed:', message);
    }
    return false;
  }
}

async function main() {
  console.log(
    `[content-generation-daemon] started interval=${intervalMs}ms url=${runUrl}`
    + ` timeout=${requestTimeoutMs}ms startupDelay=${startupDelayMs}ms retryDelay=${retryDelayMs}ms`
  );
  await sleep(startupDelayMs);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : retryDelayMs);
  }
}

main().catch((error) => {
  console.error('[content-generation-daemon] fatal:', error);
  process.exit(1);
});
