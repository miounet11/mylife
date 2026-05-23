// v5-D78 批量发布 D75/D77/D76 草稿
// 策略：
//   - engine-llm:keyword-knowledge → 全发（78 条 SEO 长文）
//   - engine-llm:encyclopedia → 全发（53 条基础百科）
//   - engine-llm:case-library → 抽 150 条发（10 主题各 15）

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from '@/lib/database';

const DRY_RUN = process.argv.includes('--dry-run');

interface Row {
  id: string;
  slug: string;
  source: string;
  subtype: string | null;
  title: string;
}

function listDrafts(source: string, limit?: number): Row[] {
  if (limit && source === 'engine-llm:case-library') {
    // 按 subtype 均匀抽：每主题 15 条
    const themes = db.prepare(
      `SELECT DISTINCT subtype FROM content_entries WHERE source = ? AND status = 'draft'`,
    ).all(source) as Array<{ subtype: string }>;
    const out: Row[] = [];
    for (const t of themes) {
      const rows = db.prepare(
        `SELECT id, slug, source, subtype, title FROM content_entries
         WHERE source = ? AND status = 'draft' AND subtype = ?
         ORDER BY RANDOM() LIMIT ?`,
      ).all(source, t.subtype, 15) as Row[];
      out.push(...rows);
    }
    return out;
  }
  return db.prepare(
    `SELECT id, slug, source, subtype, title FROM content_entries WHERE source = ? AND status = 'draft'`,
  ).all(source) as Row[];
}

function publish(ids: string[]): number {
  if (!ids.length) return 0;
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(
    `UPDATE content_entries SET status = 'published', updated_by = 'system:d78', updated_at = datetime('now') WHERE id IN (${placeholders})`,
  ).run(...ids);
  return result.changes;
}

function main() {
  const buckets = [
    { source: 'engine-llm:keyword-knowledge', limit: undefined as number | undefined, label: 'D75 关键词长文' },
    { source: 'engine-llm:encyclopedia', limit: undefined, label: 'D77 基础百科' },
    { source: 'engine-llm:case-library', limit: 150, label: 'D76 案例库（抽 150）' },
  ];

  let totalPublished = 0;
  for (const b of buckets) {
    const rows = listDrafts(b.source, b.limit);
    console.log(`[d78] ${b.label} → 候选 ${rows.length} 条`);
    if (rows.length === 0) continue;
    if (DRY_RUN) {
      console.log(`  示例 5 条: ${rows.slice(0, 5).map((r) => r.title.slice(0, 30)).join(' | ')}`);
      continue;
    }
    const ids = rows.map((r) => r.id);
    const changed = publish(ids);
    console.log(`  → 已发布 ${changed} 条`);
    totalPublished += changed;
  }
  console.log(`[d78] 总发布 ${totalPublished} 条 ${DRY_RUN ? '(dry-run, 无写入)' : ''}`);

  // 最终汇总
  const summary = db.prepare(
    `SELECT content_type, status, COUNT(*) as n FROM content_entries GROUP BY content_type, status ORDER BY content_type, status`,
  ).all();
  console.log('[d78] 最终 content_entries 总览:');
  console.log(JSON.stringify(summary, null, 2));
}

main();
