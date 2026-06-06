const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

function loadPm2FallbackEnv() {
  try {
    const ecosystem = require('../ecosystem.config.js');
    const apps = Array.isArray(ecosystem?.apps) ? ecosystem.apps : [];
    const primaryApp = apps.find((app) => app?.name === 'life-kline-next') || apps[0];
    return primaryApp?.env && typeof primaryApp.env === 'object' ? primaryApp.env : {};
  } catch {
    return {};
  }
}

const pm2Env = loadPm2FallbackEnv();
const readEnv = (name, fallback = '') => process.env[name] || pm2Env[name] || fallback;

const runUrl = readEnv('SYSTEM_HEALTH_RUN_URL', 'http://127.0.0.1:8080/api/admin/system/health');
const token = readEnv('SYSTEM_HEALTH_TOKEN')
  || readEnv('KNOWLEDGE_ACQUISITION_CRON_TOKEN')
  || readEnv('CONTENT_RADAR_CRON_TOKEN')
  || readEnv('CONTENT_SCHEDULER_CRON_TOKEN')
  || '';
const requestTimeoutMs = Math.max(5_000, Number(readEnv('SYSTEM_HEALTH_REQUEST_TIMEOUT_MS', 60_000)));
const modelWindowArg = process.argv.find((arg) => arg.startsWith('--model-window-minutes='));
const modelWindowMinutes = modelWindowArg ? Number(modelWindowArg.split('=')[1]) : 0;
const effectiveRunUrl = Number.isFinite(modelWindowMinutes) && modelWindowMinutes > 0
  ? `${runUrl}${runUrl.includes('?') ? '&' : '?'}modelWindowMinutes=${Math.round(modelWindowMinutes)}`
  : runUrl;

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
    const response = await fetchWithTimeout(effectiveRunUrl, {
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
