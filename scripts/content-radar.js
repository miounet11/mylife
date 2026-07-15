#!/usr/bin/env node
// Content radar — scans configured signal sources and records a run entry.
// Currently stub: table content_radar_runs exists but no radar is wired.
// Enable by setting CONTENT_RADAR_ENABLED=1 in ecosystem.config.js env.

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '..', 'data', 'lifekline.db');
const ENABLED = process.env.CONTENT_RADAR_ENABLED === '1';

if (!ENABLED) {
  console.log('[content-radar] disabled (CONTENT_RADAR_ENABLED != 1)');
  process.exit(0);
}

try {
  const db = new Database(DB_PATH, { fileMustExist: true });
  db.pragma('journal_mode=WAL');
  const id = 'cr_' + Date.now().toString(36);
  db.prepare(`
    INSERT INTO content_radar_runs (id, source_id, source_label, platform, status, fetched_count, saved_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, 'stub', 'content-radar-stub', 'local', 'ok', 0, 0, new Date().toISOString());
  db.close();
  console.log('[content-radar] recorded stub run', id);
} catch (err) {
  console.error('[content-radar] failed:', err.message);
  process.exit(1);
}
