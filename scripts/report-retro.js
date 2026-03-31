const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { isLikelyTestReportName } = require('../lib/report-sample-classifier');

const DEFAULT_MINUTES = 24 * 60;
const args = process.argv.slice(2);
const minutesArg = args.find((arg) => /^\d+$/.test(arg));
const minutes = Math.max(1, Number.parseInt(minutesArg || `${DEFAULT_MINUTES}`, 10) || DEFAULT_MINUTES);
const saveSnapshot = args.includes('--save');
const jsonOnly = args.includes('--json');

const db = new Database('data/lifekline.db', { readonly: true });

function parseMeta(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function readText(value) {
  return `${value || ''}`.trim();
}

function toPercent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function uniqueCount(rows, key) {
  return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
}

const sinceSql = `-${minutes} minutes`;

const analyticsRows = db.prepare(`
  SELECT event_name, page, meta, created_at, session_id, user_id
  FROM analytics_events
  WHERE datetime(created_at) >= datetime('now', ?)
  ORDER BY created_at DESC
`).all(sinceSql);

const reportRows = db.prepare(`
  SELECT
    id,
    user_id,
    name,
    birth_place,
    report_version,
    created_at,
    json_extract(analysis, '$.llmUsed') AS llm_used,
    json_extract(analysis, '$.reasoningMode') AS reasoning_mode,
    json_extract(analysis, '$.qualityAudit.overallScore') AS score,
    json_extract(analysis, '$.qualityAudit.grade') AS grade,
    json_extract(analysis, '$.qualityAudit.deliveryTier') AS delivery_tier,
    json_extract(analysis, '$.qualityAudit.targetAchieved') AS target_achieved
  FROM fortunes
  WHERE datetime(created_at) >= datetime('now', ?)
  ORDER BY datetime(created_at) DESC
`).all(sinceSql);

const eventCounts = new Map();
const pageViewMissingSession = [];
const analyzeRows = [];
const analyzeFailedRows = [];
const reportViewedRows = [];
const sessionSummary = new Map();

for (const row of analyticsRows) {
  eventCounts.set(row.event_name, (eventCounts.get(row.event_name) || 0) + 1);

  if (row.event_name === 'home_page_viewed' || row.event_name === 'analyze_page_viewed' || row.event_name === 'report_viewed') {
    if (!row.session_id) {
      pageViewMissingSession.push(row);
    }
  }

  if (row.event_name === 'analyze_submitted' || row.event_name === 'analyze_completed') {
    analyzeRows.push(row);
  }

  if (row.event_name === 'analyze_failed') {
    analyzeFailedRows.push(row);
  }

  if (row.event_name === 'report_viewed') {
    reportViewedRows.push(row);
  }

  const sessionKey = row.session_id || row.user_id || 'unknown';
  const existing = sessionSummary.get(sessionKey) || {
    sessionId: sessionKey,
    homeViewed: 0,
    analyzeViewed: 0,
    submitted: 0,
    completed: 0,
    reportViewed: 0,
    chatCompleted: 0,
    lastAt: '',
  };

  if (row.event_name === 'home_page_viewed') existing.homeViewed += 1;
  if (row.event_name === 'analyze_page_viewed') existing.analyzeViewed += 1;
  if (row.event_name === 'analyze_submitted') existing.submitted += 1;
  if (row.event_name === 'analyze_completed') existing.completed += 1;
  if (row.event_name === 'report_viewed') existing.reportViewed += 1;
  if (row.event_name === 'chat_completed') existing.chatCompleted += 1;
  if (!existing.lastAt || row.created_at > existing.lastAt) {
    existing.lastAt = row.created_at;
  }

  sessionSummary.set(sessionKey, existing);
}

const reports = reportRows.map((row) => ({
  id: row.id,
  userId: row.user_id,
  name: readText(row.name),
  birthPlace: readText(row.birth_place),
  reportVersion: readText(row.report_version) || 'unknown',
  createdAt: row.created_at,
  llmUsed: row.llm_used === 1,
  reasoningMode: readText(row.reasoning_mode) || 'unknown',
  score: typeof row.score === 'number' ? row.score : Number(row.score || 0),
  grade: readText(row.grade) || 'C',
  deliveryTier: readText(row.delivery_tier) || 'basic',
  targetAchieved: row.target_achieved === 1,
  likelyTest: isLikelyTestReportName(row.name),
}));

const realReports = reports.filter((row) => !row.likelyTest);
const testReports = reports.filter((row) => row.likelyTest);
const viewedReportIds = new Set(
  reportViewedRows
    .map((row) => parseMeta(row.meta).reportId)
    .filter(Boolean)
);

const completedMeta = analyzeRows
  .filter((row) => row.event_name === 'analyze_completed')
  .map((row) => parseMeta(row.meta));

const fallbackCompleted = completedMeta.filter((meta) => meta.fallbackToEngine === true).length;
const basicReports = reports.filter((row) => row.deliveryTier === 'basic').length;
const llmReports = reports.filter((row) => row.llmUsed).length;

const failureHotspots = analyzeFailedRows
  .map((row) => parseMeta(row.meta))
  .reduce((acc, meta) => {
    const key = `stage=${meta.stage || 'unknown'} | error=${meta.error || 'unknown'}`;
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());

const realReportCards = realReports.slice(0, 12).map((row) => ({
  ...row,
  viewed: viewedReportIds.has(row.id),
}));

const testReportCards = testReports.slice(0, 12).map((row) => ({
  ...row,
  viewed: viewedReportIds.has(row.id),
}));

const activeSessions = [...sessionSummary.values()]
  .filter((row) => row.homeViewed || row.analyzeViewed || row.submitted || row.completed || row.reportViewed)
  .sort((left, right) => {
    if (right.completed !== left.completed) return right.completed - left.completed;
    if (right.submitted !== left.submitted) return right.submitted - left.submitted;
    if (right.reportViewed !== left.reportViewed) return right.reportViewed - left.reportViewed;
    return right.lastAt.localeCompare(left.lastAt);
  })
  .slice(0, 15);

const summary = {
  generatedAt: new Date().toISOString(),
  windowMinutes: minutes,
  analytics: {
    totalEvents: analyticsRows.length,
    activeSessions: activeSessions.length,
    uniqueSubmitters: uniqueCount(analyticsRows.filter((row) => row.event_name === 'analyze_submitted'), 'session_id'),
    uniqueCompleters: uniqueCount(analyticsRows.filter((row) => row.event_name === 'analyze_completed'), 'session_id'),
    uniqueReportViewers: uniqueCount(reportViewedRows, 'session_id'),
    topEvents: [...eventCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 15)
      .map(([eventName, count]) => ({ eventName, count })),
    missingSessionPageViews: pageViewMissingSession.length,
  },
  reports: {
    total: reports.length,
    realLikely: realReports.length,
    likelyTest: testReports.length,
    viewedDistinct: viewedReportIds.size,
    basicCount: basicReports,
    llmCount: llmReports,
    fallbackCompleted,
    fallbackRate: toPercent(fallbackCompleted, completedMeta.length),
    basicRate: toPercent(basicReports, reports.length),
    llmRate: toPercent(llmReports, reports.length),
  },
  realReportCards,
  testReportCards,
  activeSessions,
  failureHotspots: [...failureHotspots.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key, count]) => ({ key, count })),
  recommendations: [
    pageViewMissingSession.length > 0
      ? '页面浏览埋点仍有缺 session，先检查缓存客户端、旁路请求或外部脚本。'
      : '页面浏览埋点 session 已基本串通，可以开始把漏斗数据作为正式运营依据。',
    fallbackCompleted > 0
      ? `最近 ${fallbackCompleted} 次测算回退到了引擎输出，优先跟踪 LLM 健康和增强质量，而不是主流程可用性。`
      : '最近窗口内没有测算回退，优先扩大真实样本和复盘深度。',
    realReports.length > 0
      ? `把最近 ${Math.min(realReports.length, 5)} 份真实报告纳入版本评估名单，持续对照质量分、是否被查看、是否触发聊天。`
      : '当前窗口内没有足够真实样本，先扩大真实用户测算量。',
  ],
};

function formatReportLine(row) {
  return `- ${row.createdAt} | ${row.name} | ${row.birthPlace || '未知地'} | ${row.grade}/${row.score} | ${row.deliveryTier} | llm=${row.llmUsed ? '1' : '0'} | viewed=${row.viewed ? '1' : '0'} | ${row.id}`;
}

function formatSessionLine(row) {
  return `- ${row.sessionId} | home=${row.homeViewed} analyze=${row.analyzeViewed} submitted=${row.submitted} completed=${row.completed} report=${row.reportViewed} chat=${row.chatCompleted} | last=${row.lastAt}`;
}

function renderTextReport(payload) {
  const lines = [];
  lines.push(`# Report Retro`);
  lines.push('');
  lines.push(`windowMinutes: ${payload.windowMinutes}`);
  lines.push(`generatedAt: ${payload.generatedAt}`);
  lines.push('');
  lines.push('## Core');
  lines.push(`- analyticsEvents: ${payload.analytics.totalEvents}`);
  lines.push(`- activeSessions: ${payload.analytics.activeSessions}`);
  lines.push(`- uniqueSubmitters: ${payload.analytics.uniqueSubmitters}`);
  lines.push(`- uniqueCompleters: ${payload.analytics.uniqueCompleters}`);
  lines.push(`- uniqueReportViewers: ${payload.analytics.uniqueReportViewers}`);
  lines.push(`- reports.total: ${payload.reports.total}`);
  lines.push(`- reports.realLikely: ${payload.reports.realLikely}`);
  lines.push(`- reports.likelyTest: ${payload.reports.likelyTest}`);
  lines.push(`- reports.viewedDistinct: ${payload.reports.viewedDistinct}`);
  lines.push(`- reports.fallbackRate: ${payload.reports.fallbackRate}%`);
  lines.push(`- reports.basicRate: ${payload.reports.basicRate}%`);
  lines.push(`- reports.llmRate: ${payload.reports.llmRate}%`);
  lines.push(`- analytics.missingSessionPageViews: ${payload.analytics.missingSessionPageViews}`);
  lines.push('');
  lines.push('## Real Reports');
  if (payload.realReportCards.length === 0) {
    lines.push('- none');
  } else {
    payload.realReportCards.forEach((row) => lines.push(formatReportLine(row)));
  }
  lines.push('');
  lines.push('## Likely Test Reports');
  if (payload.testReportCards.length === 0) {
    lines.push('- none');
  } else {
    payload.testReportCards.forEach((row) => lines.push(formatReportLine(row)));
  }
  lines.push('');
  lines.push('## Active Sessions');
  if (payload.activeSessions.length === 0) {
    lines.push('- none');
  } else {
    payload.activeSessions.forEach((row) => lines.push(formatSessionLine(row)));
  }
  lines.push('');
  lines.push('## Failure Hotspots');
  if (payload.failureHotspots.length === 0) {
    lines.push('- none');
  } else {
    payload.failureHotspots.forEach((row) => lines.push(`- ${row.key} | count=${row.count}`));
  }
  lines.push('');
  lines.push('## Recommendations');
  payload.recommendations.forEach((line) => lines.push(`- ${line}`));
  return lines.join('\n');
}

if (saveSnapshot) {
  const runtimeDir = path.join(process.cwd(), 'data', 'runtime');
  fs.mkdirSync(runtimeDir, { recursive: true });
  const target = path.join(runtimeDir, 'report-retro.snapshot.json');
  fs.writeFileSync(target, `${JSON.stringify(summary, null, 2)}\n`);
}

if (jsonOnly) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(renderTextReport(summary));
}
