// v5-D61 论坛 daemon
// 每 5 分钟跑一次：
//   - 按当前小时进度，确保今日已生成的题数 ~= 今日应到的题数（300/天）
//   - 把到期 pending 答释放为 visible（自然延迟 1-3h）
// v5-D67：每次 tick 后检查 forum_title_pool 水位，低于阈值触发 LLM 补池（每天最多 N 次）
// 用法：node scripts/forum-daemon.js  或  pm2 start

require('./load-env');

const path = require('path');
const fs = require('fs');

// 用 tsx 子进程驱动 ts 实现，避免在 daemon 里直接 require ts
const { spawnSync } = require('child_process');
const Database = require('better-sqlite3');

const ROOT = path.resolve(__dirname, '..');
const TICK_MS = Number(process.env.FORUM_TICK_MS || 5 * 60 * 1000);
const DAILY_TARGET = Number(process.env.FORUM_DAILY_TARGET || 300);
const TITLE_POOL_LOW_WATER = Number(process.env.FORUM_TITLE_POOL_LOW || 50);
const TITLE_POOL_REFILL = Number(process.env.FORUM_TITLE_POOL_REFILL || 220);
const TITLE_POOL_MAX_PER_DAY = Number(process.env.FORUM_TITLE_POOL_MAX_PER_DAY || 2);
const DB_PATH = path.resolve(ROOT, 'data', 'lifekline.db');

let llmRefillsToday = 0;
let llmRefillDate = '';

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

function getFreshCount() {
  try {
    const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    const row = db.prepare(`SELECT COUNT(*) AS n FROM forum_title_pool WHERE status='fresh'`).get();
    db.close();
    return row?.n ?? 0;
  } catch (err) {
    logLine('getFreshCount failed:', err.message);
    return -1;
  }
}

function refillTitlePoolIfLow() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== llmRefillDate) {
    llmRefillDate = today;
    llmRefillsToday = 0;
  }
  if (llmRefillsToday >= TITLE_POOL_MAX_PER_DAY) return;

  const fresh = getFreshCount();
  if (fresh < 0) return;
  if (fresh >= TITLE_POOL_LOW_WATER) {
    return;
  }

  logLine(`title pool fresh=${fresh} < ${TITLE_POOL_LOW_WATER}，触发 LLM 补池 (today ${llmRefillsToday}/${TITLE_POOL_MAX_PER_DAY})`);
  const cmd = path.join(ROOT, 'node_modules', '.bin', 'tsx');
  const args = [path.join(ROOT, 'scripts', 'forum', 'llm-titles.ts'), String(TITLE_POOL_REFILL)];
  const env = { ...process.env };
  const r = spawnSync(cmd, args, { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 3 * 60 * 1000 });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status === 0) {
    llmRefillsToday += 1;
  } else {
    logLine('llm-titles failed exit', r.status);
  }
}

logLine(`启动 · TICK_MS=${TICK_MS}ms · DAILY_TARGET=${DAILY_TARGET} · POOL_LOW=${TITLE_POOL_LOW_WATER} · REFILL=${TITLE_POOL_REFILL}/d max ${TITLE_POOL_MAX_PER_DAY}`);
function loop() {
  refillTitlePoolIfLow();
  tickOnce();
}
loop();
setInterval(loop, TICK_MS);
