/**
 * 给所有订阅用户批量预生成 timing profile
 * 用法：npm run life-timing:bootstrap-profiles [--limit=50]
 *
 * 逻辑：
 *   1. 找所有 active 订阅用户
 *   2. 找对应 user.id + 最新 fortune
 *   3. 没有 timing_profile 或 stale 的：现场 build (fallback 模板)
 *   4. 输出统计
 *
 * 跑完后再跑 npm run life-timing:upgrade-narrator 把 fallback 升 LLM
 */

import path from 'node:path';
import process from 'node:process';
import { loadEnvConfig } from '@next/env';
import Database from 'better-sqlite3';

loadEnvConfig(process.cwd());

import { resolveTimingProfileForFortune } from '@/lib/life-timing/resolve-timing-profile';

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const limit = Number(arg('limit', '50'));
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });

  // 找所有活跃订阅用户 + 最新 fortune
  const rows = db.prepare(`
    SELECT
      s.email,
      u.id AS user_id,
      f.id AS fortune_id,
      f.birth_date AS fortune_birth_date,
      f.birth_time AS fortune_birth_time,
      f.gender AS fortune_gender,
      f.analysis AS fortune_analysis,
      p.user_id AS has_profile,
      p.computed_for_year
    FROM email_subscriptions s
    INNER JOIN users u ON u.email = s.email
    INNER JOIN (
      SELECT user_id, MAX(created_at) AS latest_at
      FROM fortunes
      GROUP BY user_id
    ) latest ON latest.user_id = u.id
    INNER JOIN fortunes f ON f.user_id = u.id AND f.created_at = latest.latest_at
    LEFT JOIN user_timing_profiles p ON p.user_id = u.id
    WHERE s.status='active'
    ORDER BY u.id
    LIMIT ?
  `).all(limit) as Array<{
    email: string;
    user_id: string;
    fortune_id: string;
    fortune_birth_date: string;
    fortune_birth_time: string | null;
    fortune_gender: string | null;
    fortune_analysis: string | null;
    has_profile: string | null;
    computed_for_year: string | null;
  }>;

  db.close();

  console.log(`[bootstrap] 找到 ${rows.length} 个有 fortune 的活跃订阅用户`);
  let built = 0;
  let alreadyFresh = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const before = row.has_profile ? '已有' : '无';
      const result = resolveTimingProfileForFortune({
        id: row.fortune_id,
        userId: row.user_id,
        birthDate: row.fortune_birth_date,
        birthTime: row.fortune_birth_time,
        gender: row.fortune_gender,
        analysis: row.fortune_analysis,
      });
      if (!result) {
        console.warn(`  [skip] ${row.email}: resolve 返回 null`);
        failed++;
        continue;
      }
      if (result.freshlyComputed) {
        built++;
        console.log(`  ✓ ${row.email} (${before}) → 重算 + fallback narrator`);
      } else {
        alreadyFresh++;
        console.log(`  · ${row.email} (${before}) → 缓存命中`);
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ ${row.email}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('\n=== 完成 ===');
  console.log(`新建/重算 profile: ${built}`);
  console.log(`已新鲜跳过:       ${alreadyFresh}`);
  console.log(`失败:             ${failed}`);
  console.log(`\n下一步：npm run life-timing:upgrade-narrator --limit=${built} 把 fallback 升级为 LLM 包装版`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
