#!/usr/bin/env node
/**
 * Rolling reload for production Next tiers (v5-Hotfix 2026-06-03).
 *
 * Order: cron (3004) → user (3000) → public web replicas (3001/3002).
 * Public nginx upstream currently serves 3001/3002, so replicas must reload by default.
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const GAP_MS = Number(process.env.ROLLING_GAP_MS) || 12000;
const HEALTH_TIMEOUT_MS = Number(process.env.ROLLING_HEALTH_TIMEOUT_MS) || 8000;
const HEALTH_RETRY = Number(process.env.ROLLING_HEALTH_RETRY) || 60;
const HEALTH_INTERVAL_MS = Number(process.env.ROLLING_HEALTH_INTERVAL_MS) || 2000;

const TARGETS = [
  { name: 'life-kline-next-cron', port: 3004 },
  { name: 'life-kline-next', port: 3000 },
  { name: 'life-kline-next-web1', port: 3001 },
  { name: 'life-kline-next-web2', port: 3002 },
];

function pickFreshCssAsset() {
  const dir = path.join(process.cwd(), '.next/static/css');
  if (!fs.existsSync(dir)) throw new Error('.next/static/css 不存在；先 build');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.css'));
  if (!files.length) throw new Error('.next/static/css 为空');
  return `/_next/static/css/${files[0]}`;
}

function probe(port, urlPath) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: urlPath, method: 'HEAD', timeout: HEALTH_TIMEOUT_MS },
      (res) => {
        res.resume();
        resolve(res.statusCode || 0);
      },
    );
    req.on('error', () => resolve(0));
    req.on('timeout', () => {
      req.destroy();
      resolve(0);
    });
    req.end();
  });
}

async function waitHealthy(port, urlPath) {
  for (let i = 0; i < HEALTH_RETRY; i += 1) {
    const code = await probe(port, urlPath);
    if (code === 200) return true;
    await new Promise((r) => setTimeout(r, HEALTH_INTERVAL_MS));
  }
  return false;
}

function pm2Exists(name) {
  try {
    const out = execSync(`pm2 describe ${name} 2>/dev/null`, { encoding: 'utf8' });
    return out.includes('status');
  } catch {
    return false;
  }
}

async function main() {
  const probePath = pickFreshCssAsset();
  console.log(`[deploy] probe path = ${probePath}`);
  const active = TARGETS.filter((t) => pm2Exists(t.name));
  if (!active.length) {
    console.error('[deploy] 无可用 pm2 实例，先执行: pm2 startOrReload ecosystem.config.js');
    process.exit(1);
  }
  console.log(`[deploy] targets = ${active.map((t) => `${t.name}:${t.port}`).join(', ')}`);

  for (const t of active) {
    console.log(`[deploy] reload ${t.name}…`);
    try {
      execSync(`pm2 reload ${t.name} --update-env`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`[deploy] pm2 reload ${t.name} 失败：${err.message}`);
      process.exit(1);
    }
    const ok = await waitHealthy(t.port, probePath);
    if (!ok) {
      console.error(`[deploy] ${t.name} (:${t.port}) 健康检查失败，停止滚动`);
      process.exit(2);
    }
    console.log(`[deploy] ${t.name} healthy. wait ${GAP_MS}ms…`);
    await new Promise((r) => setTimeout(r, GAP_MS));
  }

  console.log('[deploy] 滚动 reload 完成（user=3000 cron=3004）。');
}

main().catch((err) => {
  console.error('[deploy] fatal:', err);
  process.exit(1);
});