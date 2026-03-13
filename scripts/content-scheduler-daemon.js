const intervalMs = Math.max(60_000, Number(process.env.CONTENT_SCHEDULER_INTERVAL_MS || 1000 * 60 * 20));
const runUrl = process.env.CONTENT_SCHEDULER_RUN_URL || 'http://127.0.0.1:3000/api/admin/content/scheduler/cron';
const token = process.env.CONTENT_SCHEDULER_CRON_TOKEN || process.env.CONTENT_RADAR_CRON_TOKEN || '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCycle() {
  if (!token) {
    console.error('[content-scheduler-daemon] missing CONTENT_SCHEDULER_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetch(runUrl, {
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
    console.error('[content-scheduler-daemon] request failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  console.log(`[content-scheduler-daemon] started interval=${intervalMs}ms url=${runUrl}`);
  await sleep(20_000);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : Math.min(intervalMs, 60_000));
  }
}

main().catch((error) => {
  console.error('[content-scheduler-daemon] fatal:', error);
  process.exit(1);
});
