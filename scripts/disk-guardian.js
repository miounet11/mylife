#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { readPositiveIntegerEnv } = require('./ops-env.js');

const PROJECT_ROOT = process.env.OPS_LOOP_PROJECT_ROOT || process.cwd();
const NEXT_PREVIOUS_KEEP = readPositiveIntegerEnv('OPS_LOOP_NEXT_PREVIOUS_KEEP', 1, { min: 0, max: 5 });
const TMP_STATIC_MAX_AGE_MS = readPositiveIntegerEnv('OPS_LOOP_TMP_STATIC_MAX_AGE_HOURS', 12, { min: 1, max: 168 }) * 3_600_000;
const PM2_LOG_MAX_MB = readPositiveIntegerEnv('OPS_LOOP_PM2_LOG_MAX_MB', 180, { min: 50, max: 2048 });
const SQLITE_WAL_MAX_MB = readPositiveIntegerEnv('OPS_LOOP_SQLITE_WAL_MAX_MB', 128, { min: 32, max: 1024 });

function readDiskUsage(mount = '/') {
  try {
    const output = execFileSync('df', ['-Pk', mount], { encoding: 'utf8', timeout: 5000 });
    const line = output.trim().split('\n')[1];
    if (!line) return null;
    const parts = line.split(/\s+/);
    const totalKb = Number(parts[1]);
    const usedKb = Number(parts[2]);
    const availKb = Number(parts[3]);
    const usePercent = Number(`${parts[4] || ''}`.replace('%', ''));
    if (!Number.isFinite(totalKb) || !Number.isFinite(usedKb)) return null;
    return {
      mount,
      totalGb: Math.round((totalKb / 1024 / 1024) * 10) / 10,
      usedGb: Math.round((usedKb / 1024 / 1024) * 10) / 10,
      availGb: Math.round((availKb / 1024 / 1024) * 10) / 10,
      usePercent: Number.isFinite(usePercent) ? usePercent : Math.round((usedKb / totalKb) * 100),
    };
  } catch {
    return null;
  }
}

function removePathSafe(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

function cleanupNextPreviousBuilds(projectRoot = PROJECT_ROOT, keep = NEXT_PREVIOUS_KEEP) {
  let removed = 0;
  let freedBytes = 0;

  let entries = [];
  try {
    entries = fs.readdirSync(projectRoot)
      .filter((name) => name.startsWith('.next-previous-'))
      .map((name) => {
        const fullPath = path.join(projectRoot, name);
        const stat = fs.statSync(fullPath);
        return { name, fullPath, mtimeMs: stat.mtimeMs, sizeBytes: dirSizeSafe(fullPath) };
      })
      .sort((left, right) => right.mtimeMs - left.mtimeMs);
  } catch {
    return { removed, freedBytes };
  }

  for (const entry of entries.slice(keep)) {
    if (removePathSafe(entry.fullPath)) {
      removed += 1;
      freedBytes += entry.sizeBytes;
    }
  }

  return { removed, freedBytes };
}

function dirSizeSafe(targetPath) {
  try {
    const output = execFileSync('du', ['-sk', targetPath], { encoding: 'utf8', timeout: 20_000 });
    const kb = Number(`${output.split(/\s+/)[0] || ''}`);
    return Number.isFinite(kb) ? kb * 1024 : 0;
  } catch {
    return 0;
  }
}

function cleanupTmpStaticDirs(maxAgeMs = TMP_STATIC_MAX_AGE_MS) {
  const tmpRoot = '/tmp';
  let removed = 0;
  let freedBytes = 0;
  const now = Date.now();

  let names = [];
  try {
    names = fs.readdirSync(tmpRoot).filter((name) => name.startsWith('lifekline-static-'));
  } catch {
    return { removed, freedBytes };
  }

  for (const name of names) {
    const fullPath = path.join(tmpRoot, name);
    try {
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs < maxAgeMs) continue;
      const sizeBytes = dirSizeSafe(fullPath);
      if (removePathSafe(fullPath)) {
        removed += 1;
        freedBytes += sizeBytes;
      }
    } catch {
      // ignore single-path failures
    }
  }

  return { removed, freedBytes };
}

function getDirectorySizeMb(targetPath) {
  return Math.round(dirSizeSafe(targetPath) / 1024 / 1024);
}

function cleanupPm2Logs(maxTotalMb = PM2_LOG_MAX_MB) {
  const logsDir = '/root/.pm2/logs';
  const currentMb = getDirectorySizeMb(logsDir);
  if (currentMb <= maxTotalMb) {
    return { flushed: false, beforeMb: currentMb, afterMb: currentMb };
  }

  try {
    execFileSync('pm2', ['flush'], { stdio: 'ignore', timeout: 20_000 });
  } catch {
    return { flushed: false, beforeMb: currentMb, afterMb: getDirectorySizeMb(logsDir) };
  }

  return {
    flushed: true,
    beforeMb: currentMb,
    afterMb: getDirectorySizeMb(logsDir),
  };
}

function checkpointSqliteWal(dbPath) {
  const walPath = `${dbPath}-wal`;
  if (!fs.existsSync(walPath)) {
    return { checkpointed: false, walMb: 0 };
  }

  const walMb = Math.round(fs.statSync(walPath).size / 1024 / 1024);
  if (walMb < SQLITE_WAL_MAX_MB) {
    return { checkpointed: false, walMb };
  }

  try {
    execFileSync('sqlite3', [dbPath, 'PRAGMA wal_checkpoint(TRUNCATE);'], {
      encoding: 'utf8',
      timeout: 120_000,
    });
    const nextWalMb = fs.existsSync(walPath)
      ? Math.round(fs.statSync(walPath).size / 1024 / 1024)
      : 0;
    return { checkpointed: true, walMb, nextWalMb };
  } catch {
    return { checkpointed: false, walMb };
  }
}

function runDiskGuardian(params = {}) {
  const mode = params.mode || 'light';
  const projectRoot = params.projectRoot || PROJECT_ROOT;
  const dbPath = params.dbPath || path.join(projectRoot, 'data', 'lifekline.db');
  const diskBefore = readDiskUsage('/');

  const actions = [];
  let freedBytes = 0;

  const nextPrevious = cleanupNextPreviousBuilds(projectRoot);
  if (nextPrevious.removed > 0) {
    actions.push(`next-previous:${nextPrevious.removed}`);
    freedBytes += nextPrevious.freedBytes;
  }

  const tmpStatic = cleanupTmpStaticDirs();
  if (tmpStatic.removed > 0) {
    actions.push(`tmp-static:${tmpStatic.removed}`);
    freedBytes += tmpStatic.freedBytes;
  }

  if (mode === 'aggressive') {
    const pm2Logs = cleanupPm2Logs();
    if (pm2Logs.flushed) {
      actions.push(`pm2-flush:${pm2Logs.beforeMb}MB->${pm2Logs.afterMb}MB`);
    }

    const wal = checkpointSqliteWal(dbPath);
    if (wal.checkpointed) {
      actions.push(`sqlite-wal:${wal.walMb}MB->${wal.nextWalMb}MB`);
    }
  }

  const diskAfter = readDiskUsage('/');

  return {
    mode,
    diskBefore,
    diskAfter,
    actions,
    freedMb: Math.round(freedBytes / 1024 / 1024),
  };
}

module.exports = {
  checkpointSqliteWal,
  cleanupNextPreviousBuilds,
  cleanupPm2Logs,
  cleanupTmpStaticDirs,
  readDiskUsage,
  runDiskGuardian,
};