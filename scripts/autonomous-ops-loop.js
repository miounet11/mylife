#!/usr/bin/env node
/**
 * Autonomous Ops Loop — 自主运维闭环
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ 1. DISK GUARD      磁盘水位 + 自动清理构建残留/日志/WAL      │
 * │ 2. PROCESS HEALTH  PM2 守护进程存活检测 + 自动拉起             │
 * │ 3. API HEALTH      /api/admin/system/health 架构快照         │
 * │ 4. CONTENT LOOP    scheduler/radar 断粮检测 + 窗口内唤醒     │
 * │ 5. REMEDIATE       按严重级别执行清理/重启/补跑              │
 * │ 6. REPORT          结构化周期日志                            │
 * └──────────────────────────────────────────────────────────────┘
 *
 * 内容三线使命（命理普及 / 世界易 / 人生K线）由 life-kline-scheduler 每 20 分钟执行；
 * 本循环负责确保该链路及基础设施持续可运转。
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { runDiskGuardian, readDiskUsage } = require('./disk-guardian.js');
const { readNonEmptyCsvEnv, readPositiveIntegerEnv } = require('./ops-env.js');

const PROJECT_ROOT = process.env.OPS_LOOP_PROJECT_ROOT || process.cwd();
const INTERVAL_MS = readPositiveIntegerEnv('OPS_LOOP_INTERVAL_MS', 600_000, { min: 60_000, max: 3_600_000 });
const STARTUP_DELAY_MS = readPositiveIntegerEnv('OPS_LOOP_STARTUP_DELAY_MS', 30_000, { min: 5_000, max: 300_000 });
const REQUEST_TIMEOUT_MS = readPositiveIntegerEnv('OPS_LOOP_REQUEST_TIMEOUT_MS', 90_000, { min: 10_000, max: 600_000 });
const DISK_WARN_PERCENT = readPositiveIntegerEnv('OPS_LOOP_DISK_WARN_PERCENT', 80, { min: 50, max: 98 });
const DISK_CRITICAL_PERCENT = readPositiveIntegerEnv('OPS_LOOP_DISK_CRITICAL_PERCENT', 90, { min: 60, max: 99 });
const DISK_MIN_FREE_GB = readPositiveIntegerEnv('OPS_LOOP_DISK_MIN_FREE_GB', 8, { min: 1, max: 64 });
const SCHEDULER_MAX_IDLE_MS = readPositiveIntegerEnv('OPS_LOOP_SCHEDULER_MAX_IDLE_MS', 2_700_000, { min: 600_000, max: 7_200_000 });
const RECOVERY_COOLDOWN_MS = readPositiveIntegerEnv('OPS_LOOP_RECOVERY_COOLDOWN_MS', 600_000, { min: 120_000, max: 3_600_000 });
const INTERNAL_API_HOST = process.env.INTERNAL_API_HOST || '127.0.0.1:8080';

const HEALTH_URL = process.env.OPS_LOOP_HEALTH_URL || `http://${INTERNAL_API_HOST}/api/admin/system/health`;
const SCHEDULER_URL = process.env.OPS_LOOP_SCHEDULER_URL || `http://${INTERNAL_API_HOST}/api/admin/content/scheduler/cron`;
const HEALTH_TOKEN = process.env.OPS_LOOP_HEALTH_TOKEN
  || process.env.SYSTEM_HEALTH_TOKEN
  || process.env.CONTENT_SCHEDULER_CRON_TOKEN
  || process.env.CONTENT_RADAR_CRON_TOKEN
  || 'life-kline-scheduler-local-2026';

const REQUIRED_DAEMONS = readNonEmptyCsvEnv('OPS_LOOP_REQUIRED_DAEMONS', [
  'life-kline-next',
  'life-kline-scheduler',
  'life-kline-radar',
  'forum-daemon',
  'life-kline-forum',
]);

const DB_PATH = process.env.OPS_LOOP_DATABASE_PATH || path.join(PROJECT_ROOT, 'data', 'lifekline.db');

let tickRunning = false;
let lastRecoveryAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

function parsePm2JlistOutput(output) {
  const raw = `${output || ''}`.trim();
  const jsonStart = raw.indexOf('[');
  if (jsonStart < 0) return [];
  const parsed = JSON.parse(raw.slice(jsonStart));
  return Array.isArray(parsed) ? parsed : [];
}

function getPm2Processes() {
  try {
    const output = execFileSync('pm2', ['jlist'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10_000,
      env: {
        ...process.env,
        PM2_SILENT: 'true',
        PM2_HOME: process.env.PM2_HOME || '/root/.pm2',
      },
    });
    return parsePm2JlistOutput(output);
  } catch (error) {
    console.warn('[ops-loop] pm2 jlist failed:', error instanceof Error ? error.message : error);
    return [];
  }
}

function summarizeDaemons(processes) {
  const byName = new Map(processes.map((item) => [item.name, item]));
  return REQUIRED_DAEMONS.map((name) => {
    const process = byName.get(name);
    if (!process) {
      return { name, status: 'missing', memoryMb: 0, restarts: 0 };
    }
    return {
      name,
      status: process.pm2_env?.status || 'unknown',
      memoryMb: Math.round((process.monit?.memory || 0) / 1024 / 1024),
      restarts: process.pm2_env?.restart_time || 0,
      uptimeSec: process.pm2_env?.pm_uptime
        ? Math.round((Date.now() - process.pm2_env.pm_uptime) / 1000)
        : 0,
    };
  });
}

function restartDaemon(name) {
  const now = Date.now();
  if (now - lastRecoveryAt < RECOVERY_COOLDOWN_MS) {
    return { restarted: false, reason: 'cooldown' };
  }

  try {
    execFileSync('pm2', ['restart', name, '--update-env'], {
      stdio: 'ignore',
      timeout: 120_000,
    });
    lastRecoveryAt = now;
    return { restarted: true };
  } catch (error) {
    return {
      restarted: false,
      reason: error instanceof Error ? error.message : `${error}`,
    };
  }
}

async function fetchHealthSnapshot() {
  const response = await fetchWithTimeout(HEALTH_URL, {
    method: 'GET',
    headers: { 'x-system-health-token': HEALTH_TOKEN },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || response.statusText || 'health_failed');
  }
  return data.snapshot || data;
}

function readLatestSchedulerRun() {
  if (!fs.existsSync(DB_PATH)) return null;
  try {
    const output = execFileSync('sqlite3', [
      DB_PATH,
      `SELECT status, reason, published_count, created_at
       FROM content_scheduler_runs
       ORDER BY datetime(created_at) DESC
       LIMIT 1;`,
    ], { encoding: 'utf8', timeout: 10_000 }).trim();
    if (!output) return null;
    const [status, reason, publishedCount, createdAt] = output.split('|');
    const createdMs = Date.parse(`${createdAt}`.includes('T') ? createdAt : `${createdAt.replace(' ', 'T')}Z`);
    return {
      status,
      reason,
      publishedCount: Number(publishedCount || 0),
      createdAt,
      ageMs: Number.isFinite(createdMs) ? Math.max(0, Date.now() - createdMs) : null,
    };
  } catch {
    return null;
  }
}

function isPublishWindowOpen(snapshot) {
  const scheduler = snapshot?.services?.content?.scheduler || snapshot?.scheduler;
  return !!scheduler?.publishWindowOpen;
}

async function nudgeSchedulerIfNeeded(healthSnapshot, schedulerRun) {
  if (!schedulerRun || schedulerRun.ageMs === null || schedulerRun.ageMs < SCHEDULER_MAX_IDLE_MS) {
    return { nudged: false, reason: 'scheduler_fresh' };
  }

  const inWindow = isPublishWindowOpen(healthSnapshot);
  if (!inWindow) {
    return { nudged: false, reason: 'outside_publish_window' };
  }

  try {
    const response = await fetchWithTimeout(SCHEDULER_URL, {
      method: 'POST',
      headers: {
        'x-scheduler-cron-token': HEALTH_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'manual' }),
    });
    const data = await response.json().catch(() => ({}));
    return {
      nudged: true,
      success: !!data.success,
      publishedCount: data.publishedCount || 0,
      reason: data.reason || null,
    };
  } catch (error) {
    return {
      nudged: true,
      success: false,
      error: error instanceof Error ? error.message : `${error}`,
    };
  }
}

function resolveDiskMode(disk) {
  if (!disk) return 'light';
  if (disk.usePercent >= DISK_CRITICAL_PERCENT || disk.availGb <= DISK_MIN_FREE_GB) {
    return 'aggressive';
  }
  if (disk.usePercent >= DISK_WARN_PERCENT) {
    return 'light';
  }
  return 'none';
}

async function runCycle() {
  if (tickRunning) {
    console.log('[ops-loop] skip tick; previous cycle still running');
    return;
  }

  tickRunning = true;
  const actions = [];
  const alerts = [];

  try {
    const diskBefore = readDiskUsage('/');
    const diskMode = resolveDiskMode(diskBefore);
    if (diskBefore && diskBefore.usePercent >= DISK_WARN_PERCENT) {
      alerts.push(`disk:${diskBefore.usePercent}%`);
    }

    if (diskMode !== 'none') {
      const cleanup = runDiskGuardian({ mode: diskMode, projectRoot: PROJECT_ROOT, dbPath: DB_PATH });
      if (cleanup.actions.length > 0) {
        actions.push(`disk-cleanup:${cleanup.actions.join(',')}`);
      }
      if (cleanup.freedMb > 0) {
        actions.push(`disk-freed:${cleanup.freedMb}MB`);
      }
    }

    const daemonRows = summarizeDaemons(getPm2Processes());
    const unhealthyDaemons = daemonRows.filter((row) => row.status !== 'online');
    if (unhealthyDaemons.length > 0) {
      alerts.push(`daemons:${unhealthyDaemons.map((row) => `${row.name}=${row.status}`).join(',')}`);
      for (const daemon of unhealthyDaemons) {
        if (daemon.status === 'missing') continue;
        const recovery = restartDaemon(daemon.name);
        if (recovery.restarted) {
          actions.push(`restart:${daemon.name}`);
        }
      }
    }

    let healthSnapshot = null;
    try {
      healthSnapshot = await fetchHealthSnapshot();
      const severity = healthSnapshot?.severity || 'unknown';
      if (severity === 'critical') {
        alerts.push('health:critical');
      } else if (severity === 'warning') {
        alerts.push('health:warning');
      }
    } catch (error) {
      alerts.push(`health:error:${error instanceof Error ? error.message : error}`);
    }

    const schedulerRun = readLatestSchedulerRun();
    if (schedulerRun?.ageMs !== null && schedulerRun.ageMs >= SCHEDULER_MAX_IDLE_MS) {
      alerts.push(`scheduler:idle:${Math.round(schedulerRun.ageMs / 60_000)}m`);
      const nudge = await nudgeSchedulerIfNeeded(healthSnapshot, schedulerRun);
      if (nudge.nudged) {
        actions.push(`scheduler-nudge:${nudge.success ? 'ok' : 'fail'}:${nudge.publishedCount || 0}`);
      }
    }

    const diskAfter = readDiskUsage('/') || diskBefore;
    const contentScheduler = healthSnapshot?.services?.content?.scheduler;
    const publishedToday = contentScheduler?.publishedToday;
    const backlog = contentScheduler?.backlogPublishPressure;

    console.log(
      `[ops-loop] disk=${diskAfter ? `${diskAfter.usePercent}%/${diskAfter.availGb}GB` : 'unknown'}`
      + ` daemons=${daemonRows.map((row) => `${row.name}:${row.status}`).join(',')}`
      + ` scheduler=${schedulerRun ? `${schedulerRun.status}/${schedulerRun.publishedCount}` : 'n/a'}`
      + ` publishedToday=${publishedToday ?? 'n/a'} backlog=${backlog ?? 'n/a'}`
      + ` alerts=${alerts.length ? alerts.join('|') : 'none'}`
      + ` actions=${actions.length ? actions.join('|') : 'none'}`
    );
  } catch (error) {
    console.error('[ops-loop] cycle failed:', error instanceof Error ? error.message : error);
  } finally {
    tickRunning = false;
  }
}

async function main() {
  console.log(
    `[ops-loop] started interval=${INTERVAL_MS}ms project=${PROJECT_ROOT}`
    + ` diskWarn=${DISK_WARN_PERCENT}% diskCritical=${DISK_CRITICAL_PERCENT}%`
    + ` daemons=${REQUIRED_DAEMONS.join(',')}`
  );
  await sleep(STARTUP_DELAY_MS);
  await runCycle();
  setInterval(() => {
    void runCycle();
  }, INTERVAL_MS);
}

main().catch((error) => {
  console.error('[ops-loop] fatal:', error);
  process.exit(1);
});