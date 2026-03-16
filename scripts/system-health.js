const runUrl = process.env.SYSTEM_HEALTH_RUN_URL || 'http://127.0.0.1:3000/api/admin/system/health';
const token = process.env.SYSTEM_HEALTH_TOKEN
  || process.env.KNOWLEDGE_ACQUISITION_CRON_TOKEN
  || process.env.CONTENT_RADAR_CRON_TOKEN
  || process.env.CONTENT_SCHEDULER_CRON_TOKEN
  || '';
const requestTimeoutMs = Math.max(5_000, Number(process.env.SYSTEM_HEALTH_REQUEST_TIMEOUT_MS || 15_000));

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

async function main() {
  if (!token) {
    console.error('[system-health] missing SYSTEM_HEALTH_TOKEN or fallback cron token');
    process.exit(1);
  }

  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'GET',
      headers: {
        'x-system-health-token': token,
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      console.error('[system-health] request failed:', data.error || response.statusText);
      process.exit(1);
    }

    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[system-health] request failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
