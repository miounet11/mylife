#!/usr/bin/env node
/**
 * Keeps cron instance (3004) alive for :8080 daemons + /api/admin/*.
 * Must NOT receive public SEO traffic (nginx web_upstream → 3000 only).
 */

const { execSync } = require('child_process');
const http = require('http');

const CHECK_INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL_MS || '60000', 10);
const RECOVERY_COOLDOWN_MS = parseInt(process.env.RECOVERY_COOLDOWN_MS || '300000', 10);
const FAIL_STREAK_BEFORE_ACT = parseInt(process.env.FAIL_STREAK_BEFORE_ACT || '3', 10);
const PROBE_TIMEOUT_MS = parseInt(process.env.PROBE_TIMEOUT_MS || '5000', 10);
const CRON_PORT = process.env.CRON_TIER_PORT || '3004';
const ROBOTS_PATH = process.env.CRON_TIER_ROBOTS_PATH || '/robots.txt';

let failStreak = 0;
let lastRecoveryAt = 0;

function probe() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: Number(CRON_PORT),
        path: ROBOTS_PATH,
        method: 'GET',
        timeout: PROBE_TIMEOUT_MS,
      },
      (res) => {
        res.resume();
        resolve({ ok: true, status: res.statusCode || 0 });
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, error: 'timeout' });
    });
    req.on('error', (e) => resolve({ ok: false, status: 0, error: e.message }));
    req.end();
  });
}

function recoverCron(reason) {
  const now = Date.now();
  if (now - lastRecoveryAt < RECOVERY_COOLDOWN_MS) {
    console.log(
      `[cron-tier-watchdog] skip recovery (${reason}); cooldown ${Math.round((RECOVERY_COOLDOWN_MS - (now - lastRecoveryAt)) / 1000)}s`,
    );
    return false;
  }
  console.log(`[cron-tier-watchdog] RECOVERY (${reason}) — pm2 restart life-kline-next-cron`);
  try {
    execSync('pm2 restart life-kline-next-cron --update-env', { stdio: 'inherit', timeout: 120000 });
  } catch (e) {
    console.error('[cron-tier-watchdog] pm2 restart failed:', e.message);
    return false;
  }
  lastRecoveryAt = now;
  failStreak = 0;
  return true;
}

async function tick() {
  const r = await probe();
  const healthy = r.ok && r.status >= 200 && r.status < 500;
  if (healthy) {
    if (failStreak > 0) {
      console.log(`[cron-tier-watchdog] recovered status=${r.status}`);
    }
    failStreak = 0;
    return;
  }
  failStreak += 1;
  console.warn(
    `[cron-tier-watchdog] unhealthy streak=${failStreak} port=${CRON_PORT} status=${r.status} err=${r.error || ''}`,
  );
  if (failStreak >= FAIL_STREAK_BEFORE_ACT) {
    recoverCron(`status=${r.status} err=${r.error || ''}`);
  }
}

console.log(`[cron-tier-watchdog] start port=${CRON_PORT} interval=${CHECK_INTERVAL_MS}ms`);
tick();
setInterval(() => {
  tick().catch((e) => console.error('[cron-tier-watchdog] tick error:', e.message));
}, CHECK_INTERVAL_MS);