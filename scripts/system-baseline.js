#!/usr/bin/env node
/**
 * scripts/system-baseline.js
 *
 * S 级产品基线：用真实数据回答六个问题
 *   1. 漏斗：landing → 表单 → analyze → result → chat → 付费
 *   2. LLM：尝试次数 / 失败率 / 模型分布 / 熔断次数
 *   3. 报告：版本分布 / 质量分分布 / agentic vs deterministic
 *   4. Chat：会话长度 / 消息数 / 错误率
 *   5. 内容/SEO：文章浏览 / 案例浏览 / 工具浏览
 *   6. 留存/付费：报告浏览次数分布 / 高级服务请求
 *
 * 只读 SQLite，不写任何业务表。输出 docs/baseline-YYYY-MM-DD.md。
 *
 * 用法：
 *   node scripts/system-baseline.js [--days=30] [--out=docs/baseline-2026-05-17.md]
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
  })
);
const DAYS = Number(args.days || 30);
const today = new Date().toISOString().slice(0, 10);
const OUT = args.out || `docs/baseline-${today}.md`;

const dbPath = path.join(process.cwd(), 'data', 'lifekline.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

const sinceClause = `datetime('now','-${DAYS} days')`;

function q(sql, params = []) {
  return db.prepare(sql).all(params);
}
function q1(sql, params = []) {
  return db.prepare(sql).get(params);
}

// ---------- 1. 漏斗 ----------
function funnel() {
  const counts = q(
    `SELECT event_name, COUNT(*) c, COUNT(DISTINCT session_id) sessions
     FROM analytics_events
     WHERE created_at >= ${sinceClause}
     GROUP BY event_name`
  );
  const map = Object.fromEntries(counts.map((r) => [r.event_name, r]));
  const step = (name) => ({ events: map[name]?.c || 0, sessions: map[name]?.sessions || 0 });
  return {
    home_view: step('home_page_viewed'),
    analyze_view: step('analyze_page_viewed'),
    analyze_submit: step('analyze_submitted'),
    analyze_complete: step('analyze_completed'),
    report_view: step('report_viewed'),
    chat_view: step('chat_page_viewed'),
    chat_message: step('chat_message_sent'),
    chat_complete: step('chat_completed'),
    result_cta: step('result_cta_clicked'),
    premium_request: step('premium_service_requested'),
  };
}

// ---------- 2. LLM ----------
function llm() {
  const attempts = q1(
    `SELECT COUNT(*) c FROM analytics_events
     WHERE event_name='llm_model_attempt' AND created_at >= ${sinceClause}`
  ).c;
  // meta 是 JSON 字符串，解析 model / success / latency_ms
  const rows = q(
    `SELECT meta FROM analytics_events
     WHERE event_name='llm_model_attempt' AND created_at >= ${sinceClause}`
  );
  const stats = {};
  let okCount = 0;
  let failCount = 0;
  const latencies = [];
  for (const r of rows) {
    let m;
    try {
      m = JSON.parse(r.meta || '{}');
    } catch {
      continue;
    }
    const model = m.model || m.provider || 'unknown';
    const ok = m.success === true || m.status === 'success';
    stats[model] = stats[model] || { ok: 0, fail: 0, latencies: [] };
    if (ok) {
      stats[model].ok++;
      okCount++;
    } else {
      stats[model].fail++;
      failCount++;
    }
    const lat = Number(m.latencyMs || m.latency_ms || m.duration_ms || m.elapsed_ms);
    if (Number.isFinite(lat) && lat > 0) {
      stats[model].latencies.push(lat);
      latencies.push(lat);
    }
  }
  const pct = (arr, p) => {
    if (!arr.length) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor((p / 100) * (sorted.length - 1))];
  };
  const perModel = Object.entries(stats).map(([model, s]) => ({
    model,
    attempts: s.ok + s.fail,
    success_rate: s.ok + s.fail ? +(s.ok / (s.ok + s.fail) * 100).toFixed(2) : null,
    p50_ms: pct(s.latencies, 50),
    p95_ms: pct(s.latencies, 95),
  })).sort((a, b) => b.attempts - a.attempts);

  const circuitChanges = q1(
    `SELECT COUNT(*) c FROM analytics_events
     WHERE event_name='llm_model_circuit_changed' AND created_at >= ${sinceClause}`
  ).c;

  return {
    total_attempts: attempts,
    overall_success_rate: attempts ? +(okCount / (okCount + failCount) * 100).toFixed(2) : null,
    overall_p50_ms: pct(latencies, 50),
    overall_p95_ms: pct(latencies, 95),
    circuit_changes: circuitChanges,
    per_model: perModel.slice(0, 12),
  };
}

// ---------- 3. 报告 ----------
function reports() {
  const total = q1(
    `SELECT COUNT(*) c FROM fortunes WHERE created_at >= ${sinceClause}`
  ).c;
  const byVersion = q(
    `SELECT COALESCE(report_version,'unknown') v, COUNT(*) c
     FROM fortunes WHERE created_at >= ${sinceClause}
     GROUP BY v ORDER BY c DESC`
  );
  // generated event meta 含 orchestration.mode / quality / agentSources
  const rows = q(
    `SELECT meta FROM analytics_events
     WHERE event_name='report_generated' AND created_at >= ${sinceClause}`
  );
  const modes = {};
  const qualityScores = [];
  const tierStats = {};
  const gradeStats = {};
  let withAgent = 0;
  for (const r of rows) {
    let m;
    try {
      m = JSON.parse(r.meta || '{}');
    } catch {
      continue;
    }
    const mode = m.reasoningMode || m.orchestrationMode || m.orchestration?.mode || m.mode || 'unknown';
    modes[mode] = (modes[mode] || 0) + 1;
    if ((Array.isArray(m.agentSources) && m.agentSources.length) || m.reasoningMode === 'parallel-agents') withAgent++;
    const score = Number(m.qualityScore || m.quality || m.score);
    if (Number.isFinite(score)) qualityScores.push(score);
    const tier = m.deliveryTier || m.delivery_tier;
    if (tier) {
      tierStats[tier] = (tierStats[tier] || 0) + 1;
    }
    const grade = m.qualityGrade;
    if (grade) gradeStats[grade] = (gradeStats[grade] || 0) + 1;
  }
  const pct = (arr, p) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor((p / 100) * (s.length - 1))];
  };
  return {
    total_generated: total,
    by_version: byVersion,
    orchestration_modes: modes,
    agent_enriched_count: withAgent,
    quality_p50: pct(qualityScores, 50),
    quality_p95: pct(qualityScores, 95),
    quality_samples: qualityScores.length,
    delivery_tiers: tierStats,
    quality_grades: gradeStats,
  };
}

// ---------- 4. Chat ----------
function chat() {
  const sessionMsgs = q(
    `SELECT session_id, COUNT(*) c FROM analytics_events
     WHERE event_name='chat_message_sent' AND created_at >= ${sinceClause}
     GROUP BY session_id`
  );
  const lens = sessionMsgs.map((r) => r.c);
  const pct = (arr, p) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor((p / 100) * (s.length - 1))];
  };
  // chat_completed 含 action: load/send/edit/regenerate/delete；按 action 拆开
  const completedRows = q(
    `SELECT meta FROM analytics_events
     WHERE event_name='chat_completed' AND created_at >= ${sinceClause}`
  );
  const actionStats = {};
  let sendOk = 0;
  let sendFallback = 0;
  const sendDurations = [];
  for (const r of completedRows) {
    let m;
    try { m = JSON.parse(r.meta || '{}'); } catch { continue; }
    const action = m.action || 'unknown';
    actionStats[action] = (actionStats[action] || 0) + 1;
    if (action === 'ask' || action === 'send') {
      if (m.fallbackReason) sendFallback++;
      else sendOk++;
      const d = Number(m.durationMs);
      if (Number.isFinite(d) && d > 0) sendDurations.push(d);
    }
  }
  const sent = q1(
    `SELECT COUNT(*) c FROM analytics_events
     WHERE event_name='chat_message_sent' AND created_at >= ${sinceClause}`
  ).c;
  const sendCompleted = sendOk + sendFallback;
  return {
    sessions_with_messages: sessionMsgs.length,
    total_messages_sent: sent,
    completed_by_action: actionStats,
    send_completed: sendCompleted,
    send_success: sendOk,
    send_fallback: sendFallback,
    send_success_rate: sendCompleted ? +(sendOk / sendCompleted * 100).toFixed(2) : null,
    completion_rate: sent ? +(sendCompleted / sent * 100).toFixed(2) : null,
    send_p50_ms: pct(sendDurations, 50),
    send_p95_ms: pct(sendDurations, 95),
    msgs_per_session_p50: pct(lens, 50),
    msgs_per_session_p95: pct(lens, 95),
    msgs_per_session_max: lens.length ? Math.max(...lens) : 0,
  };
}

// ---------- 5. SEO/内容 ----------
function content() {
  const rows = q(
    `SELECT event_name, COUNT(*) c FROM analytics_events
     WHERE created_at >= ${sinceClause}
       AND event_name IN ('knowledge_article_viewed','case_article_viewed','docs_article_viewed','tool_detail_viewed','tools_page_viewed','cases_page_viewed','knowledge_page_viewed')
     GROUP BY event_name ORDER BY c DESC`
  );
  const gsc = q(
    `SELECT date(date) d, SUM(impressions) imp, SUM(clicks) clk
     FROM gsc_query_daily
     WHERE date >= date('now','-${DAYS} days')
     GROUP BY d ORDER BY d DESC LIMIT 7`
  );
  return { event_breakdown: rows, gsc_recent_7d: gsc };
}

// ---------- 6. 留存/付费 ----------
function retention() {
  const journey = q(
    `SELECT category, COUNT(*) c FROM report_journey_events
     WHERE created_at >= ${sinceClause}
     GROUP BY category ORDER BY c DESC`
  );
  const premium = q(
    `SELECT status, COUNT(*) c FROM premium_service_requests
     GROUP BY status`
  );
  const ctaTop = q(
    `SELECT json_extract(meta,'$.cta') cta, COUNT(*) c
     FROM analytics_events
     WHERE event_name='result_cta_clicked' AND created_at >= ${sinceClause}
     GROUP BY cta ORDER BY c DESC LIMIT 10`
  );
  return { journey, premium_requests: premium, top_result_ctas: ctaTop };
}

const data = {
  meta: { generated_at: new Date().toISOString(), days: DAYS },
  funnel: funnel(),
  llm: llm(),
  reports: reports(),
  chat: chat(),
  content: content(),
  retention: retention(),
};

// ---------- 渲染 ----------
function md(d) {
  const lines = [];
  lines.push(`# System Baseline — ${today} (last ${DAYS} days)`);
  lines.push('');
  lines.push(`Generated: ${d.meta.generated_at}`);
  lines.push('');

  // ----- 自动红线 -----
  const flags = [];
  const ff = d.funnel;
  const pp = (a, b) => (b ? (a / b) * 100 : 0);
  const homeToSubmit = pp(ff.analyze_submit.sessions, ff.home_view.sessions);
  if (ff.home_view.sessions && homeToSubmit < 50) flags.push(`🔴 home→analyze_submit 仅 ${homeToSubmit.toFixed(1)}%（${ff.analyze_submit.sessions}/${ff.home_view.sessions} sessions）— 主转化漏斗严重流失`);
  const chatViewToMsg = pp(ff.chat_message.sessions, ff.chat_view.sessions);
  if (chatViewToMsg < 30) flags.push(`🔴 chat_view→chat_message 仅 ${chatViewToMsg.toFixed(1)}%（${ff.chat_message.sessions}/${ff.chat_view.sessions}）— chat 入口高但发问极低`);
  if (ff.premium_request.events === 0 && ff.result_cta.events > 0) flags.push(`🔴 premium_request=0（result_cta_click=${ff.result_cta.events}）— 付费转化未跑通`);
  if (ff.result_cta.events > 0 && d.retention.top_result_ctas[0]?.cta == null) flags.push(`🟡 result_cta_clicked 大部分 cta 字段为 null（埋点缺 target/cta 标准化）`);

  const ll = d.llm;
  if (ll.overall_success_rate != null && ll.overall_success_rate < 80) flags.push(`🔴 LLM 总体成功率 ${ll.overall_success_rate}%（${ll.total_attempts} 次尝试，熔断 ${ll.circuit_changes} 次）— 模型链路在大规模降级`);
  const badModels = ll.per_model.filter((m) => m.attempts >= 100 && m.success_rate != null && m.success_rate < 50);
  if (badModels.length) flags.push(`🔴 高调用、低成功模型：${badModels.map((m) => `${m.model}(${m.success_rate}%, ${m.attempts})`).join('；')}`);

  const rr = d.reports;
  const agentRate = rr.total_generated ? (rr.agent_enriched_count / rr.total_generated) * 100 : 0;
  if (rr.total_generated && agentRate < 20) flags.push(`🟡 agent_enriched 占比 ${agentRate.toFixed(1)}%（${rr.agent_enriched_count}/${rr.total_generated}）— specialist 增强未覆盖大多数报告`);
  if (rr.delivery_tiers && Object.keys(rr.delivery_tiers).length === 1 && rr.delivery_tiers.basic) flags.push(`🟡 所有报告 deliveryTier=basic — premium/expert 等级未触达，付费阶梯名存实亡`);

  const cc = d.chat;
  if (cc.send_success_rate != null && cc.send_success_rate < 95 && cc.send_completed >= 50) flags.push(`🔴 chat send 成功率 ${cc.send_success_rate}%（${cc.send_completed} 次完成）— 用户发问可能被静默 fallback`);
  if (cc.send_p95_ms && cc.send_p95_ms > 10000) flags.push(`🟡 chat send p95=${cc.send_p95_ms}ms — 长尾延迟超过 10s`);

  if (flags.length) {
    lines.push('## 🚨 Red flags (auto-detected)');
    lines.push('');
    for (const f of flags) lines.push(`- ${f}`);
    lines.push('');
  } else {
    lines.push('## ✅ No red flags auto-detected');
    lines.push('');
  }

  lines.push('## 1. Funnel');
  lines.push('');
  lines.push('| Step | Events | Unique sessions |');
  lines.push('|---|---:|---:|');
  for (const [k, v] of Object.entries(d.funnel)) {
    lines.push(`| ${k} | ${v.events} | ${v.sessions} |`);
  }
  lines.push('');
  lines.push('### Conversion deltas');
  const pctFmt = (a, b) => (b ? `${((a / b) * 100).toFixed(2)}%` : '-');
  lines.push(`- home → analyze_view: ${pctFmt(ff.analyze_view.sessions, ff.home_view.sessions)} (sessions)`);
  lines.push(`- analyze_view → analyze_submit: ${pctFmt(ff.analyze_submit.sessions, ff.analyze_view.sessions)}`);
  lines.push(`- analyze_submit → analyze_complete: ${pctFmt(ff.analyze_complete.events, ff.analyze_submit.events)}`);
  lines.push(`- analyze_complete → report_view: ${pctFmt(ff.report_view.sessions, ff.analyze_complete.sessions)}`);
  lines.push(`- report_view → chat_view: ${pctFmt(ff.chat_view.sessions, ff.report_view.sessions)}`);
  lines.push(`- chat_view → chat_message: ${pctFmt(ff.chat_message.sessions, ff.chat_view.sessions)}`);
  lines.push(`- report_view → result_cta_click: ${pctFmt(ff.result_cta.sessions, ff.report_view.sessions)}`);
  lines.push(`- result_cta_click → premium_request: ${pctFmt(ff.premium_request.events, ff.result_cta.events)}`);
  lines.push('');

  lines.push('## 2. LLM');
  lines.push('');
  const l = d.llm;
  lines.push(`- total_attempts: **${l.total_attempts}**, overall_success_rate: **${l.overall_success_rate ?? '-'}%**`);
  lines.push(`- latency: p50=${l.overall_p50_ms ?? '-'}ms, p95=${l.overall_p95_ms ?? '-'}ms`);
  lines.push(`- circuit_changes: ${l.circuit_changes}`);
  lines.push('');
  lines.push('| Model | Attempts | Success% | p50 ms | p95 ms |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const m of l.per_model) {
    lines.push(`| ${m.model} | ${m.attempts} | ${m.success_rate ?? '-'} | ${m.p50_ms ?? '-'} | ${m.p95_ms ?? '-'} |`);
  }
  lines.push('');

  lines.push('## 3. Reports');
  lines.push('');
  const r = d.reports;
  lines.push(`- total_generated: ${r.total_generated}`);
  lines.push(`- agent_enriched: ${r.agent_enriched_count}`);
  lines.push(`- quality samples: ${r.quality_samples}, p50=${r.quality_p50 ?? '-'}, p95=${r.quality_p95 ?? '-'}`);
  lines.push(`- orchestration_modes: \`${JSON.stringify(r.orchestration_modes)}\``);
  lines.push(`- delivery_tiers: \`${JSON.stringify(r.delivery_tiers)}\``);
  lines.push(`- quality_grades: \`${JSON.stringify(r.quality_grades)}\``);
  lines.push('');
  lines.push('| Version | Count |');
  lines.push('|---|---:|');
  for (const v of r.by_version) lines.push(`| ${v.v} | ${v.c} |`);
  lines.push('');

  lines.push('## 4. Chat');
  lines.push('');
  const c = d.chat;
  lines.push(`- sessions_with_messages: ${c.sessions_with_messages}`);
  lines.push(`- total_messages_sent (client emitted): ${c.total_messages_sent}`);
  lines.push(`- send completions: ${c.send_completed} (success=${c.send_success}, fallback=${c.send_fallback}, success_rate=${c.send_success_rate ?? '-'}%)`);
  lines.push(`- send completion_rate (server/client): ${c.completion_rate ?? '-'}%`);
  lines.push(`- send latency: p50=${c.send_p50_ms ?? '-'}ms, p95=${c.send_p95_ms ?? '-'}ms`);
  lines.push(`- msgs/session: p50=${c.msgs_per_session_p50 ?? '-'}, p95=${c.msgs_per_session_p95 ?? '-'}, max=${c.msgs_per_session_max}`);
  lines.push(`- chat_completed by action: \`${JSON.stringify(c.completed_by_action)}\``);
  lines.push('');

  lines.push('## 5. Content / SEO');
  lines.push('');
  lines.push('| Event | Count |');
  lines.push('|---|---:|');
  for (const e of d.content.event_breakdown) lines.push(`| ${e.event_name} | ${e.c} |`);
  lines.push('');
  if (d.content.gsc_recent_7d.length) {
    lines.push('### GSC last 7 days');
    lines.push('');
    lines.push('| Date | Impressions | Clicks | CTR |');
    lines.push('|---|---:|---:|---:|');
    for (const g of d.content.gsc_recent_7d) {
      const ctr = g.imp ? `${((g.clk / g.imp) * 100).toFixed(2)}%` : '-';
      lines.push(`| ${g.d} | ${g.imp} | ${g.clk} | ${ctr} |`);
    }
    lines.push('');
  }

  lines.push('## 6. Retention / Monetization');
  lines.push('');
  lines.push('### Report journey events by category');
  lines.push('');
  lines.push('| Category | Count |');
  lines.push('|---|---:|');
  for (const j of d.retention.journey) lines.push(`| ${j.category} | ${j.c} |`);
  lines.push('');
  lines.push('### Top result CTAs');
  lines.push('');
  lines.push('| CTA | Clicks |');
  lines.push('|---|---:|');
  for (const c of d.retention.top_result_ctas) lines.push(`| ${c.cta ?? '(null)'} | ${c.c} |`);
  lines.push('');
  lines.push('### Premium service requests (all time)');
  lines.push('');
  lines.push('| Status | Count |');
  lines.push('|---|---:|');
  for (const p of d.retention.premium_requests) lines.push(`| ${p.status} | ${p.c} |`);
  lines.push('');

  lines.push('## Raw JSON');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(d, null, 2));
  lines.push('```');
  return lines.join('\n');
}

const out = md(data);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(`baseline written: ${OUT} (${out.length} bytes)`);
db.close();
