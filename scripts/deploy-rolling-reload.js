#!/usr/bin/env node
/**
 * Rolling reload for production Next tiers (v5-Hotfix 2026-06-03).
 *
 * Order: cron (3004) → user (3000) → public web replicas (3001/3002).
 * Public nginx upstream currently serves 3001/3002, so replicas must reload by default.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { withBuildIdEnv } = require('./pm2-build-env.js');
const { readPositiveIntegerEnv } = require('./ops-env.js');

const GAP_MS = readPositiveIntegerEnv('ROLLING_GAP_MS', 12000, { min: 1000, max: 120000 });
const HEALTH_TIMEOUT_MS = readPositiveIntegerEnv('ROLLING_HEALTH_TIMEOUT_MS', 8000, { min: 1000, max: 60000 });
const HEALTH_RETRY = readPositiveIntegerEnv('ROLLING_HEALTH_RETRY', 60, { min: 1, max: 300 });
const HEALTH_INTERVAL_MS = readPositiveIntegerEnv('ROLLING_HEALTH_INTERVAL_MS', 2000, { min: 500, max: 30000 });
const BUILD_ID_PATH = path.join(process.cwd(), '.next', 'BUILD_ID');
const BUILD_ENDPOINT_PATH = '/api/runtime/build';
const DRY_RUN = process.argv.includes('--dry-run');
const ALLOW_PARTIAL_TARGETS = process.env.ALLOW_PARTIAL_PM2_TARGETS === '1';

const TARGETS = [
  { name: 'life-kline-next-cron', port: 3004 },
  { name: 'life-kline-next', port: 3000 },
  { name: 'life-kline-next-web1', port: 3001 },
  { name: 'life-kline-next-web2', port: 3002 },
];

function readExpectedBuildId() {
  if (!fs.existsSync(BUILD_ID_PATH)) {
    throw new Error('.next/BUILD_ID 不存在；先 build');
  }
  const buildId = fs.readFileSync(BUILD_ID_PATH, 'utf8').trim();
  if (!buildId) {
    throw new Error('.next/BUILD_ID 为空；build 产物损坏');
  }
  return buildId;
}

function probeBuildId(port) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: BUILD_ENDPOINT_PATH, method: 'GET', timeout: HEALTH_TIMEOUT_MS },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolve({ ok: false, statusCode: res.statusCode || 0, buildId: '', error: `HTTP ${res.statusCode || 0}` });
            return;
          }
          try {
            const data = JSON.parse(body);
            resolve({
              ok: Boolean(data?.success && data?.buildId),
              statusCode: res.statusCode,
              buildId: `${data?.buildId || ''}`.trim(),
              source: `${data?.source || ''}`.trim(),
              filesystemBuildId: `${data?.filesystemBuildId || ''}`.trim(),
              error: '',
            });
          } catch (err) {
            resolve({ ok: false, statusCode: res.statusCode, buildId: '', source: '', filesystemBuildId: '', error: `invalid JSON: ${err.message}` });
          }
        });
      },
    );
    req.on('error', (err) => resolve({ ok: false, statusCode: 0, buildId: '', source: '', filesystemBuildId: '', error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, statusCode: 0, buildId: '', source: '', filesystemBuildId: '', error: 'timeout' });
    });
    req.end();
  });
}

async function waitBuildId(port, expectedBuildId) {
  let last = { ok: false, statusCode: 0, buildId: '', source: '', filesystemBuildId: '', error: 'not probed' };
  for (let i = 0; i < HEALTH_RETRY; i += 1) {
    last = await probeBuildId(port);
    if (last.ok && last.buildId === expectedBuildId && last.source === 'process-env') {
      return { ok: true, last };
    }
    await new Promise((r) => setTimeout(r, HEALTH_INTERVAL_MS));
  }
  return { ok: false, last };
}

function pm2Exists(name) {
  try {
    const out = execFileSync('pm2', ['describe', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.includes('status');
  } catch {
    return false;
  }
}

function reloadPM2(name, expectedBuildId) {
  execFileSync('pm2', ['reload', name, '--update-env'], {
    stdio: 'inherit',
    env: withBuildIdEnv(expectedBuildId),
  });
}

async function main() {
  const expectedBuildId = readExpectedBuildId();
  console.log(`[deploy] expected buildId = ${expectedBuildId}`);

  if (DRY_RUN) {
    console.log(`[deploy] dry-run: inject LIFE_KLINE_BUILD_ID=${expectedBuildId}`);
    console.log(`[deploy] dry-run: targets = ${TARGETS.map((t) => `${t.name}:${t.port}`).join(', ')}`);
    return;
  }

  const active = TARGETS.filter((t) => pm2Exists(t.name));
  const missing = TARGETS.filter((target) => !active.some((candidate) => candidate.name === target.name));
  if (!active.length) {
    console.error('[deploy] 无可用 pm2 实例，先执行: pm2 startOrReload ecosystem.config.js');
    process.exit(1);
  }
  if (missing.length && !ALLOW_PARTIAL_TARGETS) {
    console.error(`[deploy] 缺少 pm2 目标：${missing.map((t) => t.name).join(', ')}`);
    console.error('[deploy] 默认要求 cron/user/public replicas 全部参与滚动；如需临时跳过，显式设置 ALLOW_PARTIAL_PM2_TARGETS=1');
    process.exit(1);
  }
  if (missing.length) {
    console.warn(`[deploy] ALLOW_PARTIAL_PM2_TARGETS=1，跳过缺失目标：${missing.map((t) => t.name).join(', ')}`);
  }
  console.log(`[deploy] targets = ${active.map((t) => `${t.name}:${t.port}`).join(', ')}`);

  for (const t of active) {
    console.log(`[deploy] reload ${t.name}…`);
    try {
      reloadPM2(t.name, expectedBuildId);
    } catch (err) {
      console.error(`[deploy] pm2 reload ${t.name} 失败：${err.message}`);
      process.exit(1);
    }
    const result = await waitBuildId(t.port, expectedBuildId);
    if (!result.ok) {
      const last = result.last;
      console.error(`[deploy] ${t.name} (:${t.port}) buildId 验证失败，停止滚动`);
      console.error(`[deploy] expected=${expectedBuildId} actual=${last.buildId || '<empty>'} source=${last.source || '<empty>'} fs=${last.filesystemBuildId || '<empty>'} status=${last.statusCode} error=${last.error || '<none>'}`);
      process.exit(2);
    }
    console.log(`[deploy] ${t.name} buildId OK (${expectedBuildId}). wait ${GAP_MS}ms…`);
    await new Promise((r) => setTimeout(r, GAP_MS));
  }

  console.log(`[deploy] 滚动 reload 完成，全部实例 buildId=${expectedBuildId}。`);
}

main().catch((err) => {
  console.error('[deploy] fatal:', err);
  process.exit(1);
});
