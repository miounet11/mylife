// v5-D81 D76 剩余 170 条 case 草稿批量发布（保留所有审计已通过的合规 case）
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from '@/lib/database';

const DRY_RUN = process.argv.includes('--dry-run');

function main() {
  const rows = db.prepare(
    `SELECT id, slug, title FROM content_entries WHERE source = 'engine-llm:case-library' AND status = 'draft'`,
  ).all() as Array<{ id: string; slug: string; title: string }>;
  console.log(`[d81] D76 草稿 ${rows.length} 条候选`);
  if (!rows.length) return;
  if (DRY_RUN) {
    console.log('  示例:', rows.slice(0, 5).map((r) => r.title.slice(0, 30)).join(' | '));
    return;
  }
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const r = db.prepare(
    `UPDATE content_entries SET status = 'published', updated_by = 'system:d81', updated_at = datetime('now') WHERE id IN (${placeholders})`,
  ).run(...ids);
  console.log(`[d81] 已发布 ${r.changes} 条`);
}

main();
