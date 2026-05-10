const intervalMs = Math.max(60_000, Number(process.env.TIMING_EMAIL_INTERVAL_MS || 1000 * 60 * 60 * 6)); // 默认 6 小时
const runUrl = process.env.TIMING_EMAIL_RUN_URL || 'http://127.0.0.1:3000/api/admin/timing/email/cron?mode=auto';
const token = process.env.TIMING_EMAIL_CRON_TOKEN || '';
const requestTimeoutMs = Math.max(30_000, Number(process.env.TIMING_EMAIL_REQUEST_TIMEOUT_MS || 60_000));
const startupDelayMs = Math.max(5_000, Number(process.env.TIMING_EMAIL_STARTUP_DELAY_MS || 30_000));
const retryDelayMs = Math.max(15_000, Number(process.env.TIMING_EMAIL_RETRY_DELAY_MS || 60_000));

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
    'fetch failed', 'ECONNREFUSED', 'connect ECONNREFUSED',
    'bad port', 'socket hang up', 'network timeout',
    'This operation was aborted',
  ].some((pattern) => message.includes(pattern));
}

async function runCycle() {
  if (!token) {
    console.error('[timing-email-daemon] missing TIMING_EMAIL_CRON_TOKEN');
    return false;
  }
  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-timing-email-cron-token': token,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[timing-email-daemon] run failed:', data.error || response.statusText);
      return false;
    }
    console.log(
      `[timing-email-daemon] monthly=${data.monthlySent || 0} solar_term=${data.solarTermSent || 0} errors=${(data.errors || []).length}`
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    if (isTransientStartupError(message)) {
      console.warn('[timing-email-daemon] upstream not ready yet, will retry:', message);
    } else {
      console.error('[timing-email-daemon] request failed:', message);
    }
    return false;
  }
}

async function main() {
  console.log(
    `[timing-email-daemon] started interval=${intervalMs}ms url=${runUrl}`
    + ` timeout=${requestTimeoutMs}ms startupDelay=${startupDelayMs}ms`
  );
  await sleep(startupDelayMs);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : retryDelayMs);
  }
}

main().catch((error) => {
  console.error('[timing-email-daemon] fatal:', error);
  process.exit(1);
});
