const intervalMs = Math.max(30_000, Number(process.env.EMAIL_RETRY_INTERVAL_MS || 1000 * 60 * 2));
const runUrl = process.env.EMAIL_RETRY_RUN_URL || 'http://127.0.0.1:3000/api/admin/email/retry/cron';
const token = process.env.EMAIL_RETRY_CRON_TOKEN || process.env.REPORT_UPGRADE_CRON_TOKEN || '';

async function runCycle() {
  if (!token) {
    console.error('[email-retry-daemon] missing EMAIL_RETRY_CRON_TOKEN');
    return;
  }

  try {
    const response = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-retry-cron-token': token,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[email-retry-daemon] run failed:', data.error || response.statusText);
      return;
    }

    console.log(
      `[email-retry-daemon] processed=${data.processedCount || 0} results=${JSON.stringify(data.results || [])}`
    );
  } catch (error) {
    console.error('[email-retry-daemon] request failed:', error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log(`[email-retry-daemon] started interval=${intervalMs}ms url=${runUrl}`);
  await runCycle();
  setInterval(() => {
    void runCycle();
  }, intervalMs);
}

main().catch((error) => {
  console.error('[email-retry-daemon] fatal:', error);
  process.exit(1);
});
