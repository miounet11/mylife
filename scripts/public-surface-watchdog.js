#!/usr/bin/env node
/**
 * Probes the real user-facing paths via nginx (443), not just port 3000.
 * Recovers by restarting life-kline-next only — never changes nginx routing.
 *
 * @see docs/ops/nginx-lifekline.conf — lifekline_web_upstream must stay on 3000
 */

const { execSync } = require('child_process');
const https = require('https');

const CHECK_INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL_MS || '45000', 10);
const RECOVERY_COOLDOWN_MS = parseInt(process.env.RECOVERY_COOLDOWN_MS || '600000', 10);
const FAIL_STREAK_BEFORE_ACT = parseInt(process.env.FAIL_STREAK_BEFORE_ACT || '2', 10);
const PROBE_TIMEOUT_MS = parseInt(process.env.PROBE_TIMEOUT_MS || '8000', 10);
const NGINX_HOST = process.env.PUBLIC_SURFACE_HOST || 'www.life-kline.com';

const PATHS = (process.env.PUBLIC_SURFACE_PATHS || '/,/analyze,/robots.txt')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

let failStreak = 0;
let lastRecoveryAt = 0;

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
  console.log(`[public-surface-watchdog] RECOVERY (${reason}) — pm2 restart life-kline-next`);
  try {
    execSync('pm2 restart life-kline-next --update-env', { stdio: 'inherit', timeout: 120000 });
  } catch (e) {
    console.error('[public-surface-watchdog] pm2 restart failed:', e.message);
    return false;
  }
  lastRecoveryAt = now;
  failStreak = 0;
  return true;
}

async function tick() {
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
}

async function main() {
  console.log(
    `[public-surface-watchdog] host=${NGINX_HOST} paths=${PATHS.join(',')} interval=${CHECK_INTERVAL_MS}ms`,
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