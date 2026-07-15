#!/usr/bin/env node
// Content scheduler — publishes queued content generation jobs.
// Currently stub: table content_scheduler_runs exists but no scheduler is wired.
// Enable by setting CONTENT_SCHEDULER_ENABLED=1 in ecosystem.config.js env.

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '..', 'data', 'lifekline.db');
const ENABLED = process.env.CONTENT_SCHEDULER_ENABLED === '1';

if (!ENABLED) {
  console.log('[content-scheduler] disabled (CONTENT_SCHEDULER_ENABLED != 1)');
  process.exit(0);
}

try {
  const db = new Database(DB_PATH, { fileMustExist: true });
  db.pragma('journal_mode=WAL');
  const id = 'cs_' + Date.now().toString(36);
  db.prepare(`
    INSERT INTO content_scheduler_runs (id, trigger, status, reason, generated_count, published_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, 'cron', 'ok', 'stub-run', 0, 0, new Date().toISOString());
  db.close();
  console.log('[content-scheduler] recorded stub run', id);
} catch (err) {
  console.error('[content-scheduler] failed:', err.message);
  process.exit(1);
}
