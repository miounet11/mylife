/**
 * Narrator 升级 cron
 * 把 narrator_status='fallback' 的 profile 升级成 LLM 版本
 *
 * 用法：npm run life-timing:upgrade-narrator [--limit=5]
 * 适合放到每小时 cron 跑（每次最多升级 5 个）
 */

import path from 'node:path';
import process from 'node:process';
import { loadEnvConfig } from '@next/env';
import Database from 'better-sqlite3';

loadEnvConfig(process.cwd());

import { narrateTimingPoints } from '@/lib/life-timing/timing-narrator';
import type { TimingPoint } from '@/lib/life-timing/types';

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

interface Row {
  user_id: string;
  report_id: string | null;
  birth_signature: string;
  bazi_pillars: string;
  computed_for_year: string;
  past_validations: string;
  next_30_days: string;
  next_12_months: string;
  next_5_years: string;
  computed_at: string;
}

async function main() {
  const limit = Number(arg('limit', '5'));
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));

  const rows = db.prepare(`
    SELECT * FROM user_timing_profiles
    WHERE narrator_status IN ('fallback', 'pending')
    ORDER BY computed_at DESC
    LIMIT ?
  `).all(limit) as Row[];

  console.log(`[narrator-upgrade] 找到 ${rows.length} 个待升级的 profile`);

  for (const row of rows) {
    console.log(`\n升级中: ${row.user_id} (${row.bazi_pillars})`);
    try {
      const next30: TimingPoint[] = JSON.parse(row.next_30_days);
      const next12: TimingPoint[] = JSON.parse(row.next_12_months);

      const narrated30 = await narrateTimingPoints(next30);
      const narrated12 = await narrateTimingPoints(next12);

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE user_timing_profiles
        SET next_30_days = ?, next_12_months = ?,
            narrator_status = 'done', narrator_completed_at = ?
        WHERE user_id = ?
      `).run(
        JSON.stringify(narrated30),
        JSON.stringify(narrated12),
        now,
        row.user_id,
      );
      console.log(`  ✓ ${narrated30.length} 个 30天时点 + ${narrated12.length} 个 12月时点 已升级`);
    } catch (err) {
      console.error(`  ✗ 失败: ${err instanceof Error ? err.message : err}`);
    }
  }

  db.close();
  console.log('\n=== 完成 ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
