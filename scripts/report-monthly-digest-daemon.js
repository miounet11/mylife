const intervalMs = Math.max(60_000, Number(process.env.REPORT_MONTHLY_DIGEST_INTERVAL_MS || 1000 * 60 * 60 * 6));
const runUrl = process.env.REPORT_MONTHLY_DIGEST_RUN_URL || 'http://127.0.0.1:8080/api/admin/report-monthly-digest/cron';
const token = process.env.REPORT_MONTHLY_DIGEST_CRON_TOKEN || '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCycle() {
  if (!token) {
    console.error('[report-monthly-digest-daemon] missing REPORT_MONTHLY_DIGEST_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetch(runUrl, {
      method: 'POST',
      headers: {
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
    console.error('[report-monthly-digest-daemon] request failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  console.log(`[report-monthly-digest-daemon] started interval=${intervalMs}ms url=${runUrl}`);
  await sleep(30_000);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : Math.min(intervalMs, 60_000));
  }
}

main().catch((error) => {
  console.error('[report-monthly-digest-daemon] fatal:', error);
  process.exit(1);
});
