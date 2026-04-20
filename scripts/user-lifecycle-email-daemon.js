const intervalMs = Math.max(60_000, Number(process.env.USER_LIFECYCLE_EMAIL_INTERVAL_MS || 1000 * 60 * 60 * 6));
const runUrl = process.env.USER_LIFECYCLE_EMAIL_RUN_URL || 'http://127.0.0.1:3000/api/admin/email/lifecycle/cron';
const token = process.env.USER_LIFECYCLE_EMAIL_CRON_TOKEN || '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCycle() {
  if (!token) {
    console.error('[user-lifecycle-email-daemon] missing USER_LIFECYCLE_EMAIL_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'x-user-lifecycle-email-cron-token': token,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      console.error('[user-lifecycle-email-daemon] run failed:', data.error || response.statusText);
      return false;
    }

    console.log(
      `[user-lifecycle-email-daemon] sent=${data.sentCount || 0} skipped=${data.skippedCount || 0} errors=${data.errorCount || 0} reason=${data.reason || ''}`
    );
    return true;
  } catch (error) {
    console.error('[user-lifecycle-email-daemon] request failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  console.log(`[user-lifecycle-email-daemon] started interval=${intervalMs}ms url=${runUrl}`);
  await sleep(35_000);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : Math.min(intervalMs, 60_000));
  }
}

main().catch((error) => {
  console.error('[user-lifecycle-email-daemon] fatal:', error);
  process.exit(1);
});
