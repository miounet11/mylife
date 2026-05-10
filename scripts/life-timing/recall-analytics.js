/**
 * Timing email 召回分析
 * 用法：npm run timing:recall-analytics [--days=30]
 */

const path = require('node:path');
const Database = require('better-sqlite3');

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const DAYS = Number(arg('days', 30));
const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });

console.log(`=== Timing Email 召回分析（最近 ${DAYS} 天）===\n`);

// 1. 邮件总量
console.log('—— 邮件发送统计 ——');
const sentTotals = db.prepare(`
  SELECT category, COUNT(*) AS sent
  FROM timing_email_log
  WHERE datetime(sent_at) >= datetime('now', '-${DAYS} days')
  GROUP BY category
`).all();
console.table(sentTotals);

// 2. 召回汇总
console.log('\n—— 召回动作分布 ——');
const recallByAction = db.prepare(`
  SELECT action, COUNT(*) AS n
  FROM timing_email_recall_log
  WHERE datetime(recorded_at) >= datetime('now', '-${DAYS} days')
    AND utm_source = 'email'
  GROUP BY action
`).all();
console.table(recallByAction);

// 3. 按 campaign 漏斗
console.log('\n—— 按 campaign 漏斗 ——');
const byCampaign = db.prepare(`
  SELECT
    el.campaign,
    el.category,
    COUNT(DISTINCT el.id) AS sent,
    COUNT(DISTINCT CASE WHEN rl.action='returned_to_site' THEN rl.email END) AS returned,
    COUNT(DISTINCT CASE WHEN rl.action='completed_view' THEN rl.email END) AS completed
  FROM timing_email_log el
  LEFT JOIN timing_email_recall_log rl ON rl.email_log_id = el.id
  WHERE datetime(el.sent_at) >= datetime('now', '-${DAYS} days')
  GROUP BY el.campaign, el.category
  ORDER BY el.campaign DESC
  LIMIT 20
`).all();
console.table(byCampaign.map(r => ({
  campaign: r.campaign,
  category: r.category,
  sent: r.sent,
  returned: r.returned,
  completed: r.completed,
  return_rate: r.sent > 0 ? `${(r.returned / r.sent * 100).toFixed(1)}%` : '-',
  completion_rate: r.sent > 0 ? `${(r.completed / r.sent * 100).toFixed(1)}%` : '-',
})));

// 4. 按时点类型（从 highlight 提取）
console.log('\n—— 按时点类型回站质量 ——');
const byPointType = db.prepare(`
  SELECT
    CASE
      WHEN landed_point_id LIKE 'taisui_%' THEN 'tai_sui'
      WHEN landed_point_id LIKE 'dayun_%' THEN 'dayun_shift'
      WHEN landed_point_id LIKE 'solar_%' THEN 'solar_term'
      WHEN landed_point_id LIKE 'liuyue_shensha_%' THEN 'shensha'
      WHEN landed_point_id LIKE 'liuyue_%' THEN 'liuyue'
      WHEN landed_point_id LIKE 'suiyunbinglin_%' THEN 'sui_yun_bing_lin'
      ELSE 'other'
    END AS point_type,
    COUNT(*) AS clicks,
    AVG(session_duration_ms) AS avg_duration_ms,
    SUM(CASE WHEN action='completed_view' THEN 1 ELSE 0 END) AS completed
  FROM timing_email_recall_log
  WHERE datetime(recorded_at) >= datetime('now', '-${DAYS} days')
    AND utm_source = 'email'
    AND landed_point_id IS NOT NULL
  GROUP BY point_type
  ORDER BY clicks DESC
`).all();
console.table(byPointType.map(r => ({
  point_type: r.point_type,
  clicks: r.clicks,
  avg_duration_s: r.avg_duration_ms ? `${(r.avg_duration_ms / 1000).toFixed(1)}s` : '-',
  completed: r.completed,
  completion_rate: r.clicks > 0 ? `${(r.completed / r.clicks * 100).toFixed(0)}%` : '-',
})));

console.log('\n—— 总览 ——');
const grand = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM timing_email_log WHERE datetime(sent_at) >= datetime('now', '-${DAYS} days')) AS total_sent,
    (SELECT COUNT(*) FROM timing_email_recall_log WHERE datetime(recorded_at) >= datetime('now', '-${DAYS} days') AND utm_source='email' AND action='returned_to_site') AS total_returned,
    (SELECT COUNT(*) FROM timing_email_recall_log WHERE datetime(recorded_at) >= datetime('now', '-${DAYS} days') AND utm_source='email' AND action='completed_view') AS total_completed
`).get();

console.log(`总发送: ${grand.total_sent}`);
console.log(`总回站: ${grand.total_returned} (${grand.total_sent > 0 ? (grand.total_returned / grand.total_sent * 100).toFixed(1) : 0}%)`);
console.log(`完整看: ${grand.total_completed} (${grand.total_sent > 0 ? (grand.total_completed / grand.total_sent * 100).toFixed(1) : 0}%)`);

db.close();
