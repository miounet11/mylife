#!/usr/bin/env node
/**
 * fetch-gsc.js — 从 Google Search Console 拉 query × page × country × device 维度的搜索数据，落到 gsc_query_daily 表。
 *
 * 用法：
 *   GSC_SERVICE_ACCOUNT_JSON='{...}' GSC_SITE_URL='https://www.life-kline.com/' \
 *   node --import tsx scripts/seo/fetch-gsc.js [--days=28] [--start=YYYY-MM-DD] [--end=YYYY-MM-DD]
 *
 * 默认：拉最近 28 天（GSC 数据约延迟 2 天）。
 */

import path from 'node:path';
import process from 'node:process';
import Database from 'better-sqlite3';
import { queryGsc } from '../../lib/seo/gsc-client';

function arg(name: string, fallback?: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  return fallback;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const days = Number(arg('days', '28'));
  const today = new Date();
  // GSC 通常滞后 2 天
  const defaultEnd = new Date(today.getTime() - 2 * 86400_000);
  const defaultStart = new Date(defaultEnd.getTime() - (days - 1) * 86400_000);
  const startDate = arg('start') || isoDate(defaultStart);
  const endDate = arg('end') || isoDate(defaultEnd);
  const site = process.env.GSC_SITE_URL!;

  console.log(`[gsc-fetch] site=${site} ${startDate} → ${endDate}`);

  const rows = await queryGsc({
    startDate,
    endDate,
    dimensions: ['date', 'query', 'page', 'country', 'device'],
    rowLimit: 25000,
  });

  console.log(`[gsc-fetch] received ${rows.length} rows`);

  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS gsc_query_daily (
      site TEXT NOT NULL,
      date TEXT NOT NULL,
      query TEXT NOT NULL,
      page TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      device TEXT NOT NULL DEFAULT '',
      clicks REAL NOT NULL DEFAULT 0,
      impressions REAL NOT NULL DEFAULT 0,
      ctr REAL NOT NULL DEFAULT 0,
      position REAL NOT NULL DEFAULT 0,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (site, date, query, page, country, device)
    );
    CREATE INDEX IF NOT EXISTS idx_gsc_query_daily_query ON gsc_query_daily(query, date);
    CREATE INDEX IF NOT EXISTS idx_gsc_query_daily_page ON gsc_query_daily(page, date);
    CREATE INDEX IF NOT EXISTS idx_gsc_query_daily_date ON gsc_query_daily(date, impressions DESC);
  `);

  const upsert = db.prepare(`
    INSERT INTO gsc_query_daily (site, date, query, page, country, device, clicks, impressions, ctr, position, fetched_at)
    VALUES (@site, @date, @query, @page, @country, @device, @clicks, @impressions, @ctr, @position, datetime('now'))
    ON CONFLICT(site, date, query, page, country, device) DO UPDATE SET
      clicks = excluded.clicks,
      impressions = excluded.impressions,
      ctr = excluded.ctr,
      position = excluded.position,
      fetched_at = excluded.fetched_at
  `);

  const tx = db.transaction((records: Array<Record<string, unknown>>) => {
    for (const r of records) upsert.run(r);
  });

  const records = rows.map((r) => ({
    site,
    date: r.keys[0] || '',
    query: r.keys[1] || '',
    page: r.keys[2] || '',
    country: r.keys[3] || '',
    device: r.keys[4] || '',
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: r.ctr || 0,
    position: r.position || 0,
  }));

  tx(records);
  console.log(`[gsc-fetch] upserted ${records.length} rows into gsc_query_daily`);

  // Quick stats
  const stats = db
    .prepare(
      `SELECT MIN(date) AS min, MAX(date) AS max, COUNT(*) AS total,
              SUM(clicks) AS clicks, SUM(impressions) AS impressions
       FROM gsc_query_daily WHERE site = ?`
    )
    .get(site);
  console.log('[gsc-fetch] table stats:', stats);

  db.close();
}

main().catch((err) => {
  console.error('[gsc-fetch] failed:', err.message || err);
  process.exit(1);
});
