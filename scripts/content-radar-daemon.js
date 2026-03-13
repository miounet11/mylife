const intervalMs = Math.max(60_000, Number(process.env.CONTENT_RADAR_INTERVAL_MS || 1000 * 60 * 45));
const runUrl = process.env.CONTENT_RADAR_RUN_URL || 'http://127.0.0.1:3000/api/admin/content/radar/cron';
const token = process.env.CONTENT_RADAR_CRON_TOKEN || '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCycle() {
  if (!token) {
    console.error('[content-radar-daemon] missing CONTENT_RADAR_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetch(runUrl, {
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
    console.error('[content-radar-daemon] request failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  console.log(`[content-radar-daemon] started interval=${intervalMs}ms url=${runUrl}`);
  await sleep(15_000);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : Math.min(intervalMs, 60_000));
  }
}

main().catch((error) => {
  console.error('[content-radar-daemon] fatal:', error);
  process.exit(1);
});
