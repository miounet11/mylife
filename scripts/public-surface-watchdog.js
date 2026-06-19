#!/usr/bin/env node
/**
 * Probes the real user-facing paths via nginx (443), not just port 3000.
 * Recovers public web replicas only; user tier (3000) and cron tier (3004) are
 * guarded by their own watchdogs.
 */

const { execFileSync } = require('child_process');
const https = require('https');
const { withCurrentBuildEnv } = require('./pm2-build-env.js');
const { readNonEmptyCsvEnv, readPositiveIntegerEnv } = require('./ops-env.js');

const CHECK_INTERVAL_MS = readPositiveIntegerEnv('CHECK_INTERVAL_MS', 45000, { min: 5000, max: 300000 });
const RECOVERY_COOLDOWN_MS = readPositiveIntegerEnv('RECOVERY_COOLDOWN_MS', 600000, { min: 60000, max: 3600000 });
const FAIL_STREAK_BEFORE_ACT = readPositiveIntegerEnv('FAIL_STREAK_BEFORE_ACT', 2, { min: 1, max: 20 });
const PROBE_TIMEOUT_MS = readPositiveIntegerEnv('PROBE_TIMEOUT_MS', 8000, { min: 1000, max: 60000 });
const NGINX_HOST = process.env.PUBLIC_SURFACE_HOST || 'www.life-kline.com';
const RECOVERY_PM2_NAMES = readNonEmptyCsvEnv('PUBLIC_SURFACE_RECOVERY_PM2', [
  'life-kline-next-web1',
  'life-kline-next-web2',
]);
const PATHS = readNonEmptyCsvEnv('PUBLIC_SURFACE_PATHS', ['/', '/analyze', '/robots.txt']);

let failStreak = 0;
let lastRecoveryAt = 0;
let tickRunning = false;

function probeGet(path) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: '127.0.0.1',
        port: 443,
        path,
        method: 'GET',
        headers: { Host: NGINX_HOST },
        timeout: PROBE_TIMEOUT_MS,
        rejectUnauthorized: false,
      },
      (res) => {
        res.resume();
        resolve({ ok: true, status: res.statusCode || 0, path });
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, path, error: 'timeout' });
    });
    req.on('error', (e) => resolve({ ok: false, status: 0, path, error: e.message }));
    req.end();
  });
}

function pathHealthy(result) {
  if (!result.ok || result.status === 0) return false;
  if (result.status >= 500) return false;
  // 429 = rate limit but stack alive
  return result.status < 500;
}

async function publicSurfaceHealthy() {
  const results = [];
  for (const path of PATHS) {
    results.push(await probeGet(path));
  }
  const bad = results.filter((r) => !pathHealthy(r));
  if (bad.length === 0) {
    return {
      healthy: true,
      detail: results.map((r) => `${r.path}=${r.status}`).join(' '),
    };
  }
  return {
    healthy: false,
    detail: bad.map((r) => `${r.path}=${r.status || r.error}`).join('; '),
  };
}

function recoverPublicSurface(reason) {
  const now = Date.now();
  if (now - lastRecoveryAt < RECOVERY_COOLDOWN_MS) {
    console.log(
      `[public-surface-watchdog] skip recovery (${reason}); cooldown ${Math.round((RECOVERY_COOLDOWN_MS - (now - lastRecoveryAt)) / 1000)}s`,
    );
    return false;
  }
  console.log(`[public-surface-watchdog] RECOVERY (${reason}) — pm2 restart ${RECOVERY_PM2_NAMES.join(', ')}`);
  try {
    for (const name of RECOVERY_PM2_NAMES) {
      execFileSync('pm2', ['restart', name, '--update-env'], {
        stdio: 'inherit',
        timeout: 120000,
        env: withCurrentBuildEnv(),
      });
    }
  } catch (e) {
    console.error('[public-surface-watchdog] pm2 restart failed:', e.message);
    return false;
  }
  lastRecoveryAt = now;
  failStreak = 0;
  return true;
}

async function tick() {
  if (tickRunning) {
    console.log('[public-surface-watchdog] skip tick; previous tick still running');
    return;
  }
  tickRunning = true;
  try {
    const { healthy, detail } = await publicSurfaceHealthy();
    if (healthy) {
      if (failStreak > 0) {
        console.log(`[public-surface-watchdog] recovered ${detail}`);
      }
      failStreak = 0;
      return;
    }
    failStreak += 1;
    console.warn(`[public-surface-watchdog] unhealthy streak=${failStreak} ${detail}`);
    if (failStreak >= FAIL_STREAK_BEFORE_ACT) {
      recoverPublicSurface(detail);
    }
  } finally {
    tickRunning = false;
  }
}

async function main() {
  console.log(
    `[public-surface-watchdog] host=${NGINX_HOST} paths=${PATHS.join(',')} recovery=${RECOVERY_PM2_NAMES.join(',')} interval=${CHECK_INTERVAL_MS}ms`,
  );
  if (process.argv.includes('--once')) {
    const { healthy, detail } = await publicSurfaceHealthy();
    if (!healthy) {
      console.error('[public-surface-watchdog] FAIL', detail);
      process.exit(1);
    }
    console.log('[public-surface-watchdog] OK', detail);
    return;
  }
  await tick();
  setInterval(() => {
    tick().catch((e) => console.error('[public-surface-watchdog] tick error:', e.message));
  }, CHECK_INTERVAL_MS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
