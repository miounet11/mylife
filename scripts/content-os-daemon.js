#!/usr/bin/env node
/**
 * Content OS daemon — fill destiny matrix gaps on a cadence.
 *
 * Prefer CLI (tsx) over HTTP: avoids Next route maxDuration + keeps long LLM batches stable.
 * Fallback to POST /api/admin/content-os if CLI fails.
 *
 * Gated by CONTENT_OS_ENABLED=1.
 */

const { spawn } = require('node:child_process');
const path = require('node:path');

const INTERVAL_MS = Math.max(
  60_000,
  Number(process.env.CONTENT_OS_INTERVAL_MS || 4 * 60 * 60 * 1000),
);
const STARTUP_DELAY_MS = Math.max(
  0,
  Number(process.env.CONTENT_OS_STARTUP_DELAY_MS || 25_000),
);
const RUN_URL =
  process.env.CONTENT_OS_RUN_URL ||
  'http://127.0.0.1:3000/api/admin/content-os';
const TOKEN =
  process.env.CONTENT_OS_CRON_TOKEN ||
  process.env.CONTENT_GENERATION_CRON_TOKEN ||
  process.env.CONTENT_SCHEDULER_CRON_TOKEN ||
  '';
const LIMIT = Math.max(1, Math.min(12, Number(process.env.CONTENT_OS_BATCH_LIMIT || 4)));
// People-first default: primary locale first (expand only after hubs exist)
const LOCALES = (process.env.CONTENT_OS_LOCALES || 'zh-CN')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const WITH_IMAGE = ['1', 'true', 'yes'].includes(
  String(process.env.CONTENT_OS_WITH_IMAGE || '').toLowerCase(),
);
const USE_CLI = !['0', 'false', 'no', 'off'].includes(
  String(process.env.CONTENT_OS_USE_CLI || '1').toLowerCase(),
);
const ROOT = process.env.CONTENT_OS_CWD || process.cwd();

function log(...args) {
  console.log(new Date().toISOString(), '[content-os-daemon]', ...args);
}

function runCliTick() {
  return new Promise((resolve, reject) => {
    const script = path.join(ROOT, 'scripts/content-os-run.ts');
    const repairRounds = String(process.env.CONTENT_OS_REPAIR_ROUNDS || '2');
    const args = [
      'tsx',
      script,
      '--limit',
      String(LIMIT),
      '--locales',
      LOCALES.join(','),
      '--concurrency',
      '1',
      '--repair-rounds',
      repairRounds,
    ];
    if (WITH_IMAGE) args.push('--with-image');
    // Default auto-publish when multi-dimension quality passes (no human review)
    if (['0', 'false', 'no'].includes(String(process.env.CONTENT_OS_AUTO_PUBLISH || '1').toLowerCase())) {
      args.push('--no-publish');
    }

    const child = spawn('npx', args, {
      cwd: ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let out = '';
    let err = '';
    child.stdout.on('data', (chunk) => {
      out += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      err += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        log('cli ok', out.slice(-800));
        resolve(out);
      } else {
        reject(new Error(`cli exit ${code}: ${err.slice(-500) || out.slice(-500)}`));
      }
    });
  });
}

async function runHttpTick() {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.CONTENT_OS_REQUEST_TIMEOUT_MS || 900_000),
  );
  try {
    const res = await fetch(RUN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-content-os-token': TOKEN,
        'x-cron-token': TOKEN,
      },
      body: JSON.stringify({
        limit: LIMIT,
        locales: LOCALES,
        withImage: WITH_IMAGE,
        concurrency: 1,
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    log('http status', res.status, text.slice(0, 500));
    if (!res.ok) {
      throw new Error(`http ${res.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function tick() {
  if (!['1', 'true', 'yes', 'on'].includes(String(process.env.CONTENT_OS_ENABLED || '').toLowerCase())) {
    log('CONTENT_OS_ENABLED off — skip');
    return;
  }

  try {
    if (USE_CLI) {
      await runCliTick();
      return;
    }
    await runHttpTick();
  } catch (err) {
    log('primary path failed', err instanceof Error ? err.message : String(err));
    if (USE_CLI) {
      try {
        log('fallback to http');
        await runHttpTick();
      } catch (err2) {
        log('http fallback failed', err2 instanceof Error ? err2.message : String(err2));
      }
    }
  }
}

log('start', {
  INTERVAL_MS,
  LIMIT,
  LOCALES,
  USE_CLI,
  ROOT,
  mode: process.env.CONTENT_OS_MODE || 'people-first',
  northStar: 'indexable clicks → chart/chat (not URL count)',
});
setTimeout(() => {
  tick();
  setInterval(tick, INTERVAL_MS);
}, STARTUP_DELAY_MS);
