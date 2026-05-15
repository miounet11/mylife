#!/usr/bin/env node
/**
 * traffic-truth.js
 * 真实流量看板 — 把机器人/默认表单 guest 隔离开，让数据说真话。
 *
 * 默认表单签名（强烈嫌疑机器人/爬虫/健康检查）：
 *   birth_date='1990-01-01' AND birth_time IN ('12:00','00:00') AND birth_place='北京'
 *
 * 可信用户 = role='user' 或 role='guest' 但留了 email 或表单非默认
 */

const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });

const DAYS = Number(process.argv[2] || 14);

const BOT_PRED = `birth_date='1990-01-01' AND birth_time IN ('12:00','00:00') AND birth_place='北京'`;
const BOT_PRED_U = `u.birth_date='1990-01-01' AND u.birth_time IN ('12:00','00:00') AND u.birth_place='北京'`;
const SYSTEM_EVENT_FILTER = `event_name NOT IN ('llm_model_attempt','llm_model_circuit_changed')`;

console.log(`=== 流量真相看板（最近 ${DAYS} 天）===\n`);

console.log('— 用户分桶 —');
console.table(db.prepare(`
  SELECT
    CASE
      WHEN role='admin' THEN 'admin'
      WHEN role='user' THEN 'real_user'
      WHEN ${BOT_PRED} THEN 'bot_default'
      WHEN email IS NOT NULL THEN 'guest_with_email'
      ELSE 'guest_real_form'
    END AS bucket,
    COUNT(*) AS n
  FROM users
  GROUP BY bucket ORDER BY n DESC
`).all());

console.log('\n— 报告生成（按 bucket）—');
console.table(db.prepare(`
  SELECT
    date(f.created_at) AS day,
    SUM(CASE WHEN u.role='user' THEN 1 ELSE 0 END) AS real_user,
    SUM(CASE WHEN u.role='guest' AND (${BOT_PRED_U}) THEN 1 ELSE 0 END) AS bot_default,
    SUM(CASE WHEN u.role='guest' AND NOT (${BOT_PRED_U}) THEN 1 ELSE 0 END) AS guest_real,
    COUNT(*) AS total
  FROM fortunes f LEFT JOIN users u ON u.id=f.user_id
  WHERE f.created_at >= datetime('now', '-${DAYS} days')
  GROUP BY day
  ORDER BY day DESC
`).all());

console.log('\n— 真实用户事件（去 bot）—');
const events = db.prepare(`
  SELECT date(created_at) AS day, COUNT(*) AS events, COUNT(DISTINCT session_id) AS sessions
  FROM analytics_events
  WHERE created_at >= datetime('now', '-${DAYS} days')
    AND ${SYSTEM_EVENT_FILTER}
  GROUP BY day ORDER BY day DESC
`).all();
console.table(events);

console.log('\n— 关键漏斗（最近 7 天，仅产品事件）—');
console.table(db.prepare(`
  SELECT event_name, COUNT(*) AS n, COUNT(DISTINCT session_id) AS sessions
  FROM analytics_events
  WHERE created_at >= datetime('now', '-7 days')
    AND event_name IN (
      'home_page_viewed','knowledge_page_viewed','knowledge_article_viewed',
      'cases_page_viewed','case_article_viewed','content_card_clicked',
      'content_quick_analyze_started','analyze_page_viewed','analyze_submitted',
      'analyze_completed','report_viewed','result_cta_clicked','chat_completed',
      'tool_run_started','tool_run_completed','docs_article_viewed'
    )
  GROUP BY event_name ORDER BY n DESC
`).all());

console.log('\n— 已发布内容 TOP 头部（最近 30 天）—');
const topPaths = db.prepare(`
  SELECT page, COUNT(*) AS views
  FROM analytics_events
  WHERE created_at >= datetime('now', '-30 days')
    AND event_name IN ('knowledge_article_viewed','case_article_viewed','insight_article_viewed','docs_article_viewed')
    AND page LIKE '/%'
  GROUP BY page ORDER BY views DESC LIMIT 15
`).all();
console.table(topPaths);

console.log('\n— content→quick_analyze 转化页面（最近 30 天）—');
const conv = db.prepare(`
  SELECT page, COUNT(*) AS conversions
  FROM analytics_events
  WHERE created_at >= datetime('now', '-30 days')
    AND event_name = 'content_quick_analyze_started'
  GROUP BY page ORDER BY conversions DESC
`).all();
console.table(conv.length > 0 ? conv : [{ note: '近 30 天没有 content→quick_analyze 转化' }]);

db.close();
