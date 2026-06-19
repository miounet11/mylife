#!/usr/bin/env node
/**
 * Keeps the user-tier Next process (port 3000) responsive for /analyze + /api/analyze.
 * Cron/daemon traffic must use port 3004 via nginx :8080 — never wedge 3000.
 */

const { execFileSync } = require('child_process');
const http = require('http');
const { withCurrentBuildEnv } = require('./pm2-build-env.js');
const { readPortEnv, readPositiveIntegerEnv } = require('./ops-env.js');

const CHECK_INTERVAL_MS = readPositiveIntegerEnv('CHECK_INTERVAL_MS', 30000, { min: 5000, max: 300000 });
const RECOVERY_COOLDOWN_MS = readPositiveIntegerEnv('RECOVERY_COOLDOWN_MS', 600000, { min: 60000, max: 3600000 });
const FAIL_STREAK_BEFORE_ACT = readPositiveIntegerEnv('FAIL_STREAK_BEFORE_ACT', 2, { min: 1, max: 20 });
const PROBE_TIMEOUT_MS = readPositiveIntegerEnv('PROBE_TIMEOUT_MS', 4000, { min: 1000, max: 60000 });
const USER_PORT = readPortEnv('USER_TIER_PORT', 3000);
const ROBOTS_PATH = process.env.USER_TIER_ROBOTS_PATH || '/robots.txt';
const ANALYZE_PATH = process.env.USER_TIER_ANALYZE_PATH || '/api/analyze';

let failStreak = 0;
let lastRecoveryAt = 0;
let tickRunning = false;

function probe(method, path, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: USER_PORT,
        path,
        method,
        headers: payload
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
          : {},
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
    if (payload) req.write(payload);
    req.end();
  });
}

async function userTierHealthy() {
  const robots = await probe('GET', ROBOTS_PATH);
  if (!robots.ok || robots.status < 200 || robots.status >= 500) {
    return { healthy: false, detail: `robots status=${robots.status} err=${robots.error || ''}` };
  }
  const analyze = await probe('POST', ANALYZE_PATH, {});
  // Empty body → 400 validation is success (stack alive).
  if (!analyze.ok || analyze.status === 0) {
    return { healthy: false, detail: `analyze status=${analyze.status} err=${analyze.error || ''}` };
  }
  if (analyze.status >= 500) {
    return { healthy: false, detail: `analyze status=${analyze.status}` };
  }
  return { healthy: true, detail: `robots=${robots.status} analyze=${analyze.status}` };
}

function recoverUserTier(reason) {
  const now = Date.now();
  if (now - lastRecoveryAt < RECOVERY_COOLDOWN_MS) {
    console.log(
      `[user-tier-watchdog] skip recovery (${reason}); cooldown ${Math.round((RECOVERY_COOLDOWN_MS - (now - lastRecoveryAt)) / 1000)}s`,
    );
    return false;
  }
  console.log(`[user-tier-watchdog] RECOVERY (${reason}) — pm2 restart life-kline-next only`);
  try {
    execFileSync('pm2', ['restart', 'life-kline-next', '--update-env'], {
      stdio: 'inherit',
      timeout: 120000,
      env: withCurrentBuildEnv(),
    });
  } catch (e) {
    console.error('[user-tier-watchdog] pm2 restart failed:', e.message);
    return false;
  }
  lastRecoveryAt = now;
  failStreak = 0;
  return true;
}

async function tick() {
  if (tickRunning) {
    console.log('[user-tier-watchdog] skip tick; previous tick still running');
    return;
  }
  tickRunning = true;
  try {
    const result = await userTierHealthy();
    if (result.healthy) {
      if (failStreak > 0) {
        console.log(`[user-tier-watchdog] recovered ${result.detail}`);
      }
      failStreak = 0;
      return;
    }
    failStreak += 1;
    console.log(`[user-tier-watchdog] FAIL streak=${failStreak} ${result.detail}`);
    if (failStreak >= FAIL_STREAK_BEFORE_ACT) {
      recoverUserTier(result.detail);
    }
  } finally {
    tickRunning = false;
  }
}

console.log(`[user-tier-watchdog] port=${USER_PORT} interval=${CHECK_INTERVAL_MS}ms`);
setInterval(() => {
  tick().catch((e) => console.error('[user-tier-watchdog] tick error:', e));
}, CHECK_INTERVAL_MS);
tick().catch((e) => console.error('[user-tier-watchdog] tick error:', e));
