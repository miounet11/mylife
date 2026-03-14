const intervalMs = Math.max(30_000, Number(process.env.REPORT_UPGRADE_INTERVAL_MS || 1000 * 60 * 3));
const runUrl = process.env.REPORT_UPGRADE_RUN_URL || 'http://127.0.0.1:3000/api/admin/report-upgrade/cron';
const token = process.env.REPORT_UPGRADE_CRON_TOKEN || '';

async function runCycle() {
  if (!token) {
    console.error('[report-upgrade-daemon] missing REPORT_UPGRADE_CRON_TOKEN');
    return;
  }

  try {
    const response = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-report-upgrade-cron-token': token,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[report-upgrade-daemon] run failed:', data.error || response.statusText);
      return;
    }

    console.log(
      `[report-upgrade-daemon] processed=${data.processedCount || (data.processed ? 1 : 0)} status=${data.reason || data.jobs?.[0]?.status || 'idle'} jobs=${JSON.stringify(data.jobs || [])}`
    );
  } catch (error) {
    console.error('[report-upgrade-daemon] request failed:', error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log(`[report-upgrade-daemon] started interval=${intervalMs}ms url=${runUrl}`);
  await runCycle();
  setInterval(() => {
    void runCycle();
  }, intervalMs);
}

main().catch((error) => {
  console.error('[report-upgrade-daemon] fatal:', error);
  process.exit(1);
});
