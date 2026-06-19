#!/usr/bin/env node
/**
 * Production stability monitor (Phase 0 containment).
 * Measures *online* web replica memory via PM2 — never the monitor's own heap.
 * Never reloads processes in transitional states (stopping/launching) to avoid reload loops.
 *
 * @see docs/stability-engineering-plan.md
 */

const { performance } = require('perf_hooks');
const { execFileSync } = require('child_process');
const { withCurrentBuildEnv } = require('./pm2-build-env.js');
const { readPositiveIntegerEnv } = require('./ops-env.js');

const WEB_MEMORY_MB = readPositiveIntegerEnv('WEB_MEMORY_THRESHOLD_MB', 1100, { min: 256, max: 16384 });
const WEB_RESTART_MB = readPositiveIntegerEnv('WEB_RESTART_THRESHOLD_MB', 1350, { min: 256, max: 16384 });
const CHECK_INTERVAL_MS = readPositiveIntegerEnv('CHECK_INTERVAL_MS', 45000, { min: 5000, max: 300000 });
const RELOAD_COOLDOWN_MS = readPositiveIntegerEnv('RELOAD_COOLDOWN_MS', 300000, { min: 60000, max: 3600000 });

const TRANSITIONAL_STATUSES = new Set(['stopping', 'launching']);
const DEAD_STATUSES = new Set(['errored', 'stopped']);

let lastActionAt = 0;
let tickRunning = false;

function getPM2Status() {
  try {
    const out = execFileSync('pm2', ['jlist'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 8000,
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function summarizeWebReplicas(list) {
  const webApps = list.filter((p) => p.name && p.name.startsWith('life-kline-next-web'));
  if (webApps.length === 0) {
    return null;
  }

  const rows = webApps.map((app) => {
    const memoryMb = Math.round((app.monit?.memory || 0) / 1024 / 1024);
    const status = app.pm2_env?.status || 'unknown';
    return {
      name: app.name,
      memoryMb,
      cpu: app.monit?.cpu ?? 0,
      restarts: app.pm2_env?.restart_time ?? 0,
      status,
    };
  });

  const onlineRows = rows
    .filter((row) => row.status === 'online')
    .sort((a, b) => b.memoryMb - a.memoryMb);
  const deadRows = rows.filter((row) => DEAD_STATUSES.has(row.status));
  const transitional = rows.filter((row) => TRANSITIONAL_STATUSES.has(row.status));

  const onlineMaxMb = onlineRows[0]?.memoryMb ?? 0;
  const memoryPressure = onlineRows.filter((row) => row.memoryMb >= WEB_MEMORY_MB);
  const memoryCritical = onlineRows.filter((row) => row.memoryMb >= WEB_RESTART_MB);

  return {
    rows,
    onlineRows,
    deadRows,
    transitional,
    onlineMaxMb,
    memoryPressure,
    memoryCritical,
    hottestOnline: onlineRows[0] || null,
  };
}

function reloadWebInstance(target, reason) {
  const now = Date.now();
  if (now - lastActionAt < RELOAD_COOLDOWN_MS) {
    console.log(`[stability-monitor] skip reload ${target.name} (cooldown ${Math.round((RELOAD_COOLDOWN_MS - (now - lastActionAt)) / 1000)}s left)`);
    return false;
  }

  if (TRANSITIONAL_STATUSES.has(target.status)) {
    console.log(`[stability-monitor] skip reload ${target.name} (transitional status=${target.status})`);
    return false;
  }

  console.log(`[stability-monitor] Triggering reload of ${target.name} (${reason}, memory ${target.memoryMb}MB, status ${target.status})`);
  try {
    execFileSync('pm2', ['reload', target.name, '--update-env'], {
      stdio: 'inherit',
      timeout: 120000,
      env: withCurrentBuildEnv(),
    });
    lastActionAt = now;
    return true;
  } catch (e) {
    console.error('[stability-monitor] reload failed:', e.message);
    return false;
  }
}

function tick() {
  if (tickRunning) {
    console.log('[stability-monitor] skip tick; previous tick still running');
    return;
  }
  tickRunning = true;
  try {
    const list = getPM2Status();
    const web = list ? summarizeWebReplicas(list) : null;

    if (!web) {
      console.log('[stability-monitor] no web replicas in pm2 jlist');
      return;
    }

    const summary = web.rows.map((r) => `${r.name}=${r.memoryMb}MB/${r.status}`).join(' ');
    const memoryHot = web.onlineMaxMb >= WEB_MEMORY_MB;
    const memoryCritical = web.onlineMaxMb >= WEB_RESTART_MB;
    const shouldAct = web.deadRows.length > 0 || memoryCritical || memoryHot;

    console.log(
      `[stability-monitor] onlineMax=${web.onlineMaxMb}MB (warn>${WEB_MEMORY_MB} restart>${WEB_RESTART_MB})`
      + `  action=${shouldAct}`
      + (web.transitional.length ? `  transitional=[${web.transitional.map((r) => r.name).join(',')}]` : '')
      + `  [${summary}]`
    );

    if (!shouldAct) {
      return;
    }

    if (web.deadRows.length > 0) {
      reloadWebInstance(web.deadRows[0], `dead-status`);
      return;
    }

    const target = web.memoryCritical[0] || web.memoryPressure[0] || web.hottestOnline;
    if (!target) {
      return;
    }

    reloadWebInstance(target, memoryCritical ? 'critical-heap' : 'elevated-heap');
  } finally {
    tickRunning = false;
  }
}

console.log('[stability-monitor] starting (online-only memory actions, skip stopping/launching)');
setInterval(tick, CHECK_INTERVAL_MS);
tick();
