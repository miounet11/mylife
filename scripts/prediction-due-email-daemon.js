const { readPositiveIntegerEnv } = require('./ops-env.js');

const intervalMs = readPositiveIntegerEnv('PREDICTION_DUE_EMAIL_INTERVAL_MS', 86_400_000, { min: 3_600_000, max: 86_400_000 });
const runUrl = process.env.PREDICTION_DUE_EMAIL_RUN_URL
  || 'http://127.0.0.1:8080/api/admin/predictions/email/cron?limit=50';
const token = process.env.PREDICTION_EMAIL_CRON_TOKEN
  || process.env.TIMING_EMAIL_CRON_TOKEN
  || '';
const requestTimeoutMs = readPositiveIntegerEnv('PREDICTION_DUE_EMAIL_REQUEST_TIMEOUT_MS', 60_000, { min: 30_000, max: 900_000 });
const startupDelayMs = readPositiveIntegerEnv('PREDICTION_DUE_EMAIL_STARTUP_DELAY_MS', 45_000, { min: 5_000, max: 300_000 });
const retryDelayMs = readPositiveIntegerEnv('PREDICTION_DUE_EMAIL_RETRY_DELAY_MS', 120_000, { min: 15_000, max: 900_000 });

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
    console.error('[prediction-due-email-daemon] missing PREDICTION_EMAIL_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-prediction-email-cron-token': token,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[prediction-due-email-daemon] run failed:', data.error || response.statusText);
      return false;
    }

    console.log(
      `[prediction-due-email-daemon] campaign=${data.campaign || 'n/a'}`
      + ` candidates=${data.candidateRows || 0}`
      + ` sent=${data.sentCount || 0}`
      + ` skipped=${data.skippedCount || 0}`
      + ` errors=${(data.errors || []).length}`,
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    if (isTransientStartupError(message)) {
      console.warn('[prediction-due-email-daemon] upstream not ready yet, will retry:', message);
    } else {
      console.error('[prediction-due-email-daemon] request failed:', message);
    }
    return false;
  }
}

async function main() {
  console.log(
    `[prediction-due-email-daemon] started interval=${intervalMs}ms url=${runUrl}`
    + ` timeout=${requestTimeoutMs}ms startupDelay=${startupDelayMs}ms`,
  );
  await sleep(startupDelayMs);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : retryDelayMs);
  }
}

main().catch((error) => {
  console.error('[prediction-due-email-daemon] fatal:', error);
  process.exit(1);
});