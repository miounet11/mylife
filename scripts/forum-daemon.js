// v5-D61 论坛 daemon
// 每 5 分钟跑一次：
//   - 按当前小时进度，确保今日已生成的题数 ~= 今日应到的题数（300/天）
//   - 把到期 pending 答释放为 visible（自然延迟 1-3h）
// 用法：node scripts/forum-daemon.js  或  pm2 start

require('./load-env');

const path = require('path');
const fs = require('fs');

// 用 tsx 子进程驱动 ts 实现，避免在 daemon 里直接 require ts
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TICK_MS = Number(process.env.FORUM_TICK_MS || 5 * 60 * 1000);
const DAILY_TARGET = Number(process.env.FORUM_DAILY_TARGET || 300);

function logLine(...args) {
  const ts = new Date().toISOString();
  console.log(`[forum-daemon ${ts}]`, ...args);
}

function tickOnce() {
  const cmd = path.join(ROOT, 'node_modules', '.bin', 'tsx');
  const args = [path.join(ROOT, 'scripts', 'forum', 'tick.ts'), String(DAILY_TARGET)];
  const env = { ...process.env };
  const r = spawnSync(cmd, args, { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 4 * 60 * 1000 });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    logLine('tick failed exit', r.status);
  }
}

logLine(`启动 · TICK_MS=${TICK_MS}ms · DAILY_TARGET=${DAILY_TARGET}`);
tickOnce();
setInterval(tickOnce, TICK_MS);
