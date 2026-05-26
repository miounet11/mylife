#!/usr/bin/env node
/**
 * v5-D120 (2026-05-25) — 滚动 reload 4 个 next 实例（web1/web2/web3 + main）
 *
 * 修因：D119 build 通过后忘了 pm2 reload，HTML 引用新 hash 但进程跑旧 .next，
 *      static asset 404 → CF 缓存 text/plain → 浏览器拒绝。
 *
 * 策略：
 *   1) 顺序 reload，每个之间 sleep N 秒 + 健康检查
 *   2) 任一实例 reload 后 health 仍失败 → 立即停止后续 reload，非零退出
 *   3) 健康检查只验 200 + 任意一个新 _next/static/css/*.css 资源能命中
 *
 * 用法：
 *   node scripts/deploy-rolling-reload.js
 *   ROLLING_GAP_MS=15000 node scripts/deploy-rolling-reload.js
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const GAP_MS = Number(process.env.ROLLING_GAP_MS) || 12000;
const HEALTH_TIMEOUT_MS = Number(process.env.ROLLING_HEALTH_TIMEOUT_MS) || 8000;
// 冷启动 Next 实例首屏 SSR 可达 60-180s（D120 实测 :3002 193s）。
// css static 在进程 ready 后立即可服务，比 SSR 快，但 listen 之前仍需 ~20-40s。
// 默认放到 60 次 × 2s = 120s 以覆盖冷启动；热 reload 通常 1-2 次就 200。
const HEALTH_RETRY = Number(process.env.ROLLING_HEALTH_RETRY) || 60;
const HEALTH_INTERVAL_MS = Number(process.env.ROLLING_HEALTH_INTERVAL_MS) || 2000;

// pm2 名 → 端口；主实例（3000）放最后，让 daemon 流量最后切
const TARGETS = [
  { name: 'life-kline-next-web1', port: 3001 },
  { name: 'life-kline-next-web2', port: 3002 },
  { name: 'life-kline-next-web3', port: 3003 },
  { name: 'life-kline-next',      port: 3000 },
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
      (res) => { res.resume(); resolve(res.statusCode || 0); }
    );
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
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

async function main() {
  const probePath = pickFreshCssAsset();
  console.log(`[deploy] probe path = ${probePath}`);
  console.log(`[deploy] targets = ${TARGETS.map((t) => `${t.name}:${t.port}`).join(', ')}`);

  for (const t of TARGETS) {
    console.log(`[deploy] reload ${t.name}…`);
    try {
      execSync(`pm2 reload ${t.name} --update-env`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`[deploy] pm2 reload ${t.name} 失败：${err.message}`);
      process.exit(1);
    }
    const ok = await waitHealthy(t.port, probePath);
    if (!ok) {
      console.error(`[deploy] ${t.name} (:${t.port}) 健康检查失败，停止滚动以保住其它实例`);
      process.exit(2);
    }
    console.log(`[deploy] ${t.name} healthy. wait ${GAP_MS}ms…`);
    await new Promise((r) => setTimeout(r, GAP_MS));
  }

  console.log('[deploy] 全部 4 个实例滚动 reload 完成。');
}

main().catch((err) => {
  console.error('[deploy] fatal:', err);
  process.exit(1);
});
