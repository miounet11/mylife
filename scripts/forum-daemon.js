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
const { readPositiveIntegerEnv } = require('./ops-env.js');

const ROOT = path.resolve(__dirname, '..');
const TICK_MS = readPositiveIntegerEnv('FORUM_TICK_MS', 5 * 60 * 1000, { min: 60_000, max: 24 * 60 * 60 * 1000 });
const DAILY_TARGET = readPositiveIntegerEnv('FORUM_DAILY_TARGET', 300, { min: 1, max: 5000 });
const TITLE_POOL_LOW_WATER = readPositiveIntegerEnv('FORUM_TITLE_POOL_LOW', 50, { min: 1, max: 5000 });
const TITLE_POOL_REFILL = readPositiveIntegerEnv('FORUM_TITLE_POOL_REFILL', 220, { min: 1, max: 5000 });
const TITLE_POOL_MAX_PER_DAY = readPositiveIntegerEnv('FORUM_TITLE_POOL_MAX_PER_DAY', 2, { min: 1, max: 100 });
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
  const r = spawnSync(cmd, args, { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 4 * 60 * 1000 });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status === 0) {
    llmRefillsToday += 1;
  } else {
    logLine('llm-titles failed exit', r.status);
  }
}

logLine(`启动 · TICK_MS=${TICK_MS}ms · DAILY_TARGET=${DAILY_TARGET} · POOL_LOW=${TITLE_POOL_LOW_WATER} · REFILL=${TITLE_POOL_REFILL}/d max ${TITLE_POOL_MAX_PER_DAY}`);

function writeHeartbeat() {
  try {
    const db = new Database(DB_PATH, { fileMustExist: true });
    db.pragma('journal_mode=WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS ops_daemon_heartbeat (
        daemon TEXT NOT NULL UNIQUE,
        last_tick_at TEXT NOT NULL,
        tick_count INTEGER NOT NULL DEFAULT 0,
        last_status TEXT,
        last_error TEXT
      )
    `);
    const row = db.prepare('SELECT tick_count FROM ops_daemon_heartbeat WHERE daemon = ?').get('forum-daemon');
    const nextCount = (row?.tick_count ?? 0) + 1;
    db.prepare(`
      INSERT INTO ops_daemon_heartbeat (daemon, last_tick_at, tick_count, last_status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(daemon) DO UPDATE SET
        last_tick_at = excluded.last_tick_at,
        tick_count = excluded.tick_count,
        last_status = excluded.last_status
    `).run('forum-daemon', new Date().toISOString(), nextCount, 'ok');
    db.close();
  } catch (err) {
    // heartbeat failure must not crash the daemon
  }
}

function loop() {
  writeHeartbeat();
  refillTitlePoolIfLow();
  tickOnce();
}
loop();
setInterval(loop, TICK_MS);
