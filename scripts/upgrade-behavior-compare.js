const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { isLikelyTestReportName } = require('../lib/report-sample-classifier');

const DEFAULT_BASELINE = '2026-03-13T00:00:00Z';
const DEFAULT_WINDOW_DAYS = 7;
const SNAPSHOT_FILE = path.join(process.cwd(), 'data', 'runtime', 'upgrade-behavior-compare.snapshot.json');

const args = process.argv.slice(2);
const readFlag = (name) => {
  const exact = args.find((arg) => arg.startsWith(`${name}=`));
  return exact ? exact.slice(name.length + 1) : '';
};

const baselineRaw = readFlag('--baseline') || DEFAULT_BASELINE;
const daysRaw = readFlag('--days');
const minutesRaw = readFlag('--minutes');
const saveSnapshot = args.includes('--save');
const jsonOnly = args.includes('--json');

const baselineDate = new Date(baselineRaw);
if (Number.isNaN(baselineDate.getTime())) {
  console.error(`[upgrade-compare] invalid baseline: ${baselineRaw}`);
  process.exit(1);
}

const windowMinutes = minutesRaw
  ? Math.max(60, Number.parseInt(minutesRaw, 10) || 0)
  : Math.max(60, (Number.parseInt(daysRaw || `${DEFAULT_WINDOW_DAYS}`, 10) || DEFAULT_WINDOW_DAYS) * 24 * 60);

const db = new Database('data/lifekline.db', { readonly: true });

function shiftMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

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

function toNumber(value) {
  return typeof value === 'number' ? value : Number(value || 0);
}

function toBoolean(value) {
  return value === true || value === 1 || value === '1';
}

function toPercent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

function uniqueCount(rows, key) {
  return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
}

function readAnalyticsRows(start, end) {
  return db.prepare(`
    SELECT event_name, page, meta, created_at, session_id, user_id
    FROM analytics_events
    WHERE datetime(created_at) >= datetime(?)
      AND datetime(created_at) < datetime(?)
    ORDER BY datetime(created_at) DESC
  `).all(start.toISOString(), end.toISOString());
}

function readReportRows(start, end) {
  return db.prepare(`
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
    WHERE datetime(created_at) >= datetime(?)
      AND datetime(created_at) < datetime(?)
    ORDER BY datetime(created_at) DESC
  `).all(start.toISOString(), end.toISOString());
}

function buildWindowSummary(label, start, end) {
  const analyticsRows = readAnalyticsRows(start, end);
  const reportRows = readReportRows(start, end);
  const eventCounts = new Map();
  const pageViewMissingSession = [];
  const reportViewedRows = [];
  const sessionSummary = new Map();

  for (const row of analyticsRows) {
    eventCounts.set(row.event_name, (eventCounts.get(row.event_name) || 0) + 1);

    if (row.event_name === 'home_page_viewed' || row.event_name === 'analyze_page_viewed' || row.event_name === 'report_viewed') {
      if (!row.session_id) pageViewMissingSession.push(row);
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
      toolDetailViewed: 0,
      toolRuns: 0,
      premiumRequests: 0,
      eventsSaved: 0,
      lastAt: '',
    };

    if (row.event_name === 'home_page_viewed') existing.homeViewed += 1;
    if (row.event_name === 'analyze_page_viewed') existing.analyzeViewed += 1;
    if (row.event_name === 'analyze_submitted') existing.submitted += 1;
    if (row.event_name === 'analyze_completed') existing.completed += 1;
    if (row.event_name === 'report_viewed') existing.reportViewed += 1;
    if (row.event_name === 'chat_completed') existing.chatCompleted += 1;
    if (row.event_name === 'tool_detail_viewed') existing.toolDetailViewed += 1;
    if (row.event_name === 'tool_run_started') existing.toolRuns += 1;
    if (row.event_name === 'premium_service_requested') existing.premiumRequests += 1;
    if (row.event_name === 'report_event_saved_from_result' || row.event_name === 'chat_event_saved') existing.eventsSaved += 1;
    if (!existing.lastAt || row.created_at > existing.lastAt) existing.lastAt = row.created_at;

    sessionSummary.set(sessionKey, existing);
  }

  const reports = reportRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: readText(row.name),
    birthPlace: readText(row.birth_place),
    reportVersion: readText(row.report_version) || 'unknown',
    createdAt: row.created_at,
    llmUsed: toBoolean(row.llm_used),
    reasoningMode: readText(row.reasoning_mode) || 'unknown',
    score: toNumber(row.score),
    grade: readText(row.grade) || 'C',
    deliveryTier: readText(row.delivery_tier) || 'basic',
    targetAchieved: toBoolean(row.target_achieved),
    likelyTest: isLikelyTestReportName(row.name),
  }));

  const realReports = reports.filter((row) => !row.likelyTest);
  const testReports = reports.filter((row) => row.likelyTest);
  const viewedReportIds = new Set(
    reportViewedRows
      .map((row) => readText(parseMeta(row.meta).reportId))
      .filter(Boolean)
  );
  const analyzeCompletedRows = analyticsRows.filter((row) => row.event_name === 'analyze_completed');
  const completedMeta = analyzeCompletedRows.map((row) => parseMeta(row.meta));

  const fallbackCompleted = completedMeta.filter((meta) => meta.fallbackToEngine === true).length;
  const basicReports = reports.filter((row) => row.deliveryTier === 'basic').length;
  const enhancedReports = reports.filter((row) => row.deliveryTier === 'enhanced').length;
  const expertReports = reports.filter((row) => row.deliveryTier === 'expert').length;
  const llmReports = reports.filter((row) => row.llmUsed).length;
  const deterministicExpertReports = reports.filter((row) => row.reasoningMode === 'deterministic-expert').length;
  const parallelAgentReports = reports.filter((row) => row.reasoningMode === 'parallel-agents').length;
  const engineReports = reports.filter((row) => row.reasoningMode === 'engine').length;

  const metrics = {
    totalEvents: analyticsRows.length,
    activeSessions: [...sessionSummary.values()].filter((row) => row.homeViewed || row.analyzeViewed || row.submitted || row.completed || row.reportViewed || row.chatCompleted || row.toolRuns).length,
    uniqueSubmitters: uniqueCount(analyticsRows.filter((row) => row.event_name === 'analyze_submitted'), 'session_id'),
    uniqueCompleters: uniqueCount(analyzeCompletedRows, 'session_id'),
    completedEvents: analyzeCompletedRows.length,
    uniqueReportViewers: uniqueCount(reportViewedRows, 'session_id'),
    homePageViewed: eventCounts.get('home_page_viewed') || 0,
    analyzePageViewed: eventCounts.get('analyze_page_viewed') || 0,
    reportViewed: eventCounts.get('report_viewed') || 0,
    chatCompleted: eventCounts.get('chat_completed') || 0,
    chatFailed: eventCounts.get('chat_failed') || 0,
    llmModelAttempts: eventCounts.get('llm_model_attempt') || 0,
    llmCircuitChanged: eventCounts.get('llm_model_circuit_changed') || 0,
    toolDetailViewed: eventCounts.get('tool_detail_viewed') || 0,
    toolRunStarted: eventCounts.get('tool_run_started') || 0,
    toolRunCompleted: eventCounts.get('tool_run_completed') || 0,
    toolResultViewed: eventCounts.get('tool_result_viewed') || 0,
    premiumServiceRequested: eventCounts.get('premium_service_requested') || 0,
    resultCtaClicked: eventCounts.get('result_cta_clicked') || 0,
    reportEventSavedFromResult: eventCounts.get('report_event_saved_from_result') || 0,
    chatEventSaved: eventCounts.get('chat_event_saved') || 0,
    newsletterSubscribed: eventCounts.get('newsletter_subscribed') || 0,
    reportsTotal: reports.length,
    realLikelyReports: realReports.length,
    likelyTestReports: testReports.length,
    viewedDistinctReports: viewedReportIds.size,
    fallbackCompleted,
    basicReports,
    enhancedReports,
    expertReports,
    llmReports,
    deterministicExpertReports,
    parallelAgentReports,
    engineReports,
    missingSessionPageViews: pageViewMissingSession.length,
  };

  const rates = {
    completionRate: toPercent(metrics.uniqueCompleters, metrics.uniqueSubmitters),
    reportViewRateFromComplete: toPercent(metrics.uniqueReportViewers, metrics.uniqueCompleters),
    chatPerReportViewRate: toPercent(metrics.chatCompleted, metrics.reportViewed),
    toolDetailPerReportViewRate: toPercent(metrics.toolDetailViewed, metrics.reportViewed),
    toolRunPerReportViewRate: toPercent(metrics.toolRunStarted, metrics.reportViewed),
    premiumRequestPerReportViewRate: toPercent(metrics.premiumServiceRequested, metrics.reportViewed),
    reportEventSavePerReportViewRate: toPercent(metrics.reportEventSavedFromResult, metrics.reportViewed),
    chatEventSavePerChatRate: toPercent(metrics.chatEventSaved, metrics.chatCompleted),
    llmAttemptPerCompletedRate: toPercent(metrics.llmModelAttempts, metrics.completedEvents),
    llmCircuitChangePerCompletedRate: toPercent(metrics.llmCircuitChanged, metrics.completedEvents),
    fallbackRate: toPercent(metrics.fallbackCompleted, metrics.completedEvents),
    basicRate: toPercent(metrics.basicReports, metrics.reportsTotal),
    enhancedRate: toPercent(metrics.enhancedReports, metrics.reportsTotal),
    expertRate: toPercent(metrics.expertReports, metrics.reportsTotal),
    llmRate: toPercent(metrics.llmReports, metrics.reportsTotal),
    deterministicExpertRate: toPercent(metrics.deterministicExpertReports, metrics.reportsTotal),
    parallelAgentRate: toPercent(metrics.parallelAgentReports, metrics.reportsTotal),
    engineRate: toPercent(metrics.engineReports, metrics.reportsTotal),
  };

  return {
    label,
    start: start.toISOString(),
    end: end.toISOString(),
    metrics,
    rates,
    topEvents: [...eventCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 12)
      .map(([eventName, count]) => ({ eventName, count })),
    sampleReports: realReports.slice(0, 8).map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      reportVersion: row.reportVersion,
      score: row.score,
      grade: row.grade,
      deliveryTier: row.deliveryTier,
      reasoningMode: row.reasoningMode,
      llmUsed: row.llmUsed,
      viewed: viewedReportIds.has(readText(row.id)),
    })),
  };
}

function compareNumericMetrics(before, after) {
  const delta = after - before;
  const deltaRate = before === 0 ? null : Math.round((delta / before) * 100);
  return { before, after, delta, deltaRate };
}

function sortMoversByMagnitude(items) {
  return [...items].sort((left, right) => {
    const leftAbs = Math.abs(left.delta);
    const rightAbs = Math.abs(right.delta);
    if (rightAbs !== leftAbs) {
      return rightAbs - leftAbs;
    }
    const leftRate = left.deltaRate === null ? -1 : Math.abs(left.deltaRate);
    const rightRate = right.deltaRate === null ? -1 : Math.abs(right.deltaRate);
    return rightRate - leftRate;
  });
}

function buildDirectionalMovers(deltaMap, limit = 5) {
  const items = Object.entries(deltaMap)
    .map(([key, value]) => ({ key, ...value }))
    .filter((item) => item.delta !== 0);

  return {
    improving: sortMoversByMagnitude(items.filter((item) => item.delta > 0)).slice(0, limit),
    worsening: sortMoversByMagnitude(items.filter((item) => item.delta < 0)).slice(0, limit),
  };
}

function buildPairComparison(left, right) {
  const metricKeys = [
    'activeSessions',
    'uniqueSubmitters',
    'uniqueCompleters',
    'completedEvents',
    'uniqueReportViewers',
    'reportViewed',
    'chatCompleted',
    'llmModelAttempts',
    'llmCircuitChanged',
    'toolDetailViewed',
    'toolRunStarted',
    'premiumServiceRequested',
    'reportEventSavedFromResult',
    'chatEventSaved',
    'reportsTotal',
    'realLikelyReports',
    'fallbackCompleted',
    'basicReports',
    'enhancedReports',
    'llmReports',
  ];
  const rateKeys = [
    'completionRate',
    'reportViewRateFromComplete',
    'chatPerReportViewRate',
    'toolDetailPerReportViewRate',
    'toolRunPerReportViewRate',
    'premiumRequestPerReportViewRate',
    'reportEventSavePerReportViewRate',
    'chatEventSavePerChatRate',
    'llmAttemptPerCompletedRate',
    'llmCircuitChangePerCompletedRate',
    'fallbackRate',
    'basicRate',
    'enhancedRate',
    'llmRate',
    'deterministicExpertRate',
    'parallelAgentRate',
    'engineRate',
  ];

  const metricDelta = Object.fromEntries(metricKeys.map((key) => [key, compareNumericMetrics(left.metrics[key], right.metrics[key])]));
  const rateDelta = Object.fromEntries(rateKeys.map((key) => [key, compareNumericMetrics(left.rates[key], right.rates[key])]));

  return {
    metricDelta,
    rateDelta,
    metricMovers: buildDirectionalMovers(metricDelta),
    rateMovers: buildDirectionalMovers(rateDelta),
  };
}

function buildNotes(windows, comparisons) {
  const notes = [];
  const { preUpgrade, initialPostUpgrade, current } = windows;

  if (preUpgrade.metrics.totalEvents === 0) {
    notes.push('升级前窗口几乎没有可用埋点事件，pre -> initial 对比只能作为弱参考。');
  }
  if (preUpgrade.metrics.missingSessionPageViews > 0 || initialPostUpgrade.metrics.missingSessionPageViews > 0 || current.metrics.missingSessionPageViews > 0) {
    notes.push('存在缺 session 的页面浏览埋点，漏斗转化率应谨慎解读。');
  }
  notes.push('chat/tool/premium/report-event 的 perReportViewRate 属于每次报告查看对应的互动强度指标，按事件次数计，可能超过 100%。');
  if (current.metrics.uniqueCompleters > 0 && current.rates.reportViewRateFromComplete >= 80) {
    notes.push('当前测算完成到报告查看链路是通的，可以把优化重点放到后续承接。');
  }
  if (current.rates.chatPerReportViewRate > initialPostUpgrade.rates.chatPerReportViewRate) {
    notes.push('当前报告查看后的聊天承接强于升级初期，用户后续深问意愿在增强。');
  }
  if (current.rates.toolDetailPerReportViewRate > initialPostUpgrade.rates.toolDetailPerReportViewRate) {
    notes.push('当前工具浏览承接强于升级初期，工具面开始成为报告后的有效分流。');
  }
  if (current.rates.reportEventSavePerReportViewRate === 0 && current.rates.chatEventSavePerChatRate === 0) {
    notes.push('当前事件沉淀仍偏弱，用户有看和问，但还没有充分转成可验证样本。');
  }
  if (current.rates.llmRate === 0) {
    notes.push('当前窗口 LLM 报告命中仍为 0，体验改善主要来自 deterministic/agentic 保底层，而不是增强模型恢复。');
  }
  if (current.metrics.completedEvents > 0 && current.rates.llmAttemptPerCompletedRate >= 500) {
    notes.push('当前每次完成测算对应的 LLM 尝试次数异常高，优先排查模型供应链、fallback 链和重试风暴，而不只是结果页承接。');
  }
  if (current.metrics.completedEvents > 0 && current.rates.llmCircuitChangePerCompletedRate >= 100) {
    notes.push('当前每次完成测算对应的 circuit 变更次数异常高，熔断状态正在频繁抖动，需优先看模型健康窗口和开关阈值。');
  }
  if (comparisons.initialToCurrent.rateDelta.basicRate.delta < 0) {
    notes.push('当前 basic 占比低于升级初期，交付层级继续改善。');
  }
  if (current.metrics.premiumServiceRequested === 0) {
    notes.push('当前没有专项服务请求，结果页后的商业化转化仍需继续加强。');
  }

  return notes;
}

function buildFocusSignals(windows, comparisons) {
  const signals = [];
  const { current } = windows;
  const { initialToCurrent } = comparisons;

  if (current.metrics.uniqueCompleters === 0) {
    signals.push({
      level: 'warn',
      key: 'completion',
      comparison: 'current',
      message: '当前窗口没有 analyze_completed，先排查主测算流程是否卡住。',
    });
  } else if (current.metrics.uniqueCompleters < 5) {
    signals.push({
      level: 'watch',
      key: 'sample-size',
      comparison: 'current',
      message: '当前完成样本较少，近期变化先按弱信号看待。',
    });
  }

  if (current.metrics.missingSessionPageViews > 0) {
    signals.push({
      level: 'warn',
      key: 'tracking-session',
      comparison: 'current',
      message: '当前窗口仍有缺 session 的页面浏览埋点，漏斗转化需要结合原始事件复核。',
    });
  }

  if (current.metrics.uniqueCompleters > 0 && current.rates.reportViewRateFromComplete < 60) {
    signals.push({
      level: 'warn',
      key: 'report-open-chain',
      comparison: 'current',
      message: '测算完成到报告查看转化偏低，结果页打开链路或落地承接需要优先排查。',
    });
  }

  if (initialToCurrent.rateDelta.fallbackRate.delta > 0) {
    signals.push({
      level: 'warn',
      key: 'fallback-rate',
      comparison: 'initial->current',
      message: '近期 fallback 占比高于升级初期，增强链路稳定性出现回落。',
    });
  } else if (initialToCurrent.rateDelta.fallbackRate.delta < 0) {
    signals.push({
      level: 'positive',
      key: 'fallback-rate',
      comparison: 'initial->current',
      message: '近期 fallback 占比低于升级初期，增强链路稳定性在改善。',
    });
  }

  if (current.metrics.completedEvents > 0 && current.rates.llmAttemptPerCompletedRate >= 500) {
    signals.push({
      level: 'warn',
      key: 'llm-attempt-churn',
      comparison: 'current',
      message: '当前 LLM 尝试次数相对完成测算量异常高，可能存在模型 fallback 或重试风暴。',
    });
  }

  if (current.metrics.completedEvents > 0 && current.rates.llmCircuitChangePerCompletedRate >= 100) {
    signals.push({
      level: 'warn',
      key: 'llm-circuit-churn',
      comparison: 'current',
      message: '当前模型熔断状态相对完成测算量频繁变化，增强链路健康抖动明显。',
    });
  }

  if (initialToCurrent.rateDelta.chatPerReportViewRate.delta > 0) {
    signals.push({
      level: 'positive',
      key: 'chat-followup',
      comparison: 'initial->current',
      message: '报告查看后的聊天承接高于升级初期，用户深问意愿在变强。',
    });
  }

  if (initialToCurrent.rateDelta.toolDetailPerReportViewRate.delta > 0) {
    signals.push({
      level: 'positive',
      key: 'tool-followup',
      comparison: 'initial->current',
      message: '工具详情承接高于升级初期，报告后的分流更有效。',
    });
  }

  if (initialToCurrent.rateDelta.basicRate.delta < 0) {
    signals.push({
      level: 'positive',
      key: 'delivery-tier',
      comparison: 'initial->current',
      message: 'basic 占比低于升级初期，当前交付层级更好。',
    });
  }

  if (current.metrics.reportViewed >= 10 && current.metrics.premiumServiceRequested === 0) {
    signals.push({
      level: 'watch',
      key: 'premium-conversion',
      comparison: 'current',
      message: '已有稳定报告查看量，但专项服务请求仍为 0，商业化承接偏弱。',
    });
  }

  return signals;
}

function renderMetricLine(label, comparison) {
  const deltaPrefix = comparison.delta > 0 ? '+' : '';
  const deltaRate = comparison.deltaRate === null ? 'n/a' : `${comparison.deltaRate > 0 ? '+' : ''}${comparison.deltaRate}%`;
  return `- ${label}: ${comparison.before} -> ${comparison.after} (${deltaPrefix}${comparison.delta}, ${deltaRate})`;
}

function renderDirectionalMovers(lines, title, movers) {
  lines.push(`### ${title}`);
  if (movers.length === 0) {
    lines.push('- none');
  } else {
    movers.forEach((item) => lines.push(renderMetricLine(item.key, item)));
  }
  lines.push('');
}

function renderComparisonBlock(lines, title, comparison) {
  lines.push(`## ${title}`);
  lines.push('');
  renderDirectionalMovers(lines, 'Improving metrics', comparison.metricMovers.improving);
  renderDirectionalMovers(lines, 'Worsening metrics', comparison.metricMovers.worsening);
  renderDirectionalMovers(lines, 'Improving rates', comparison.rateMovers.improving);
  renderDirectionalMovers(lines, 'Worsening rates', comparison.rateMovers.worsening);
  lines.push('### Metric deltas');
  lines.push(renderMetricLine('activeSessions', comparison.metricDelta.activeSessions));
  lines.push(renderMetricLine('uniqueSubmitters', comparison.metricDelta.uniqueSubmitters));
  lines.push(renderMetricLine('uniqueCompleters', comparison.metricDelta.uniqueCompleters));
  lines.push(renderMetricLine('completedEvents', comparison.metricDelta.completedEvents));
  lines.push(renderMetricLine('uniqueReportViewers', comparison.metricDelta.uniqueReportViewers));
  lines.push(renderMetricLine('reportViewed', comparison.metricDelta.reportViewed));
  lines.push(renderMetricLine('chatCompleted', comparison.metricDelta.chatCompleted));
  lines.push(renderMetricLine('llmModelAttempts', comparison.metricDelta.llmModelAttempts));
  lines.push(renderMetricLine('llmCircuitChanged', comparison.metricDelta.llmCircuitChanged));
  lines.push(renderMetricLine('toolDetailViewed', comparison.metricDelta.toolDetailViewed));
  lines.push(renderMetricLine('toolRunStarted', comparison.metricDelta.toolRunStarted));
  lines.push(renderMetricLine('premiumServiceRequested', comparison.metricDelta.premiumServiceRequested));
  lines.push(renderMetricLine('reportEventSavedFromResult', comparison.metricDelta.reportEventSavedFromResult));
  lines.push(renderMetricLine('reportsTotal', comparison.metricDelta.reportsTotal));
  lines.push('');
  lines.push('### Rate deltas');
  lines.push(renderMetricLine('completionRate', comparison.rateDelta.completionRate));
  lines.push(renderMetricLine('reportViewRateFromComplete', comparison.rateDelta.reportViewRateFromComplete));
  lines.push(renderMetricLine('chatPerReportViewRate', comparison.rateDelta.chatPerReportViewRate));
  lines.push(renderMetricLine('toolDetailPerReportViewRate', comparison.rateDelta.toolDetailPerReportViewRate));
  lines.push(renderMetricLine('toolRunPerReportViewRate', comparison.rateDelta.toolRunPerReportViewRate));
  lines.push(renderMetricLine('premiumRequestPerReportViewRate', comparison.rateDelta.premiumRequestPerReportViewRate));
  lines.push(renderMetricLine('reportEventSavePerReportViewRate', comparison.rateDelta.reportEventSavePerReportViewRate));
  lines.push(renderMetricLine('chatEventSavePerChatRate', comparison.rateDelta.chatEventSavePerChatRate));
  lines.push(renderMetricLine('llmAttemptPerCompletedRate', comparison.rateDelta.llmAttemptPerCompletedRate));
  lines.push(renderMetricLine('llmCircuitChangePerCompletedRate', comparison.rateDelta.llmCircuitChangePerCompletedRate));
  lines.push(renderMetricLine('fallbackRate', comparison.rateDelta.fallbackRate));
  lines.push(renderMetricLine('basicRate', comparison.rateDelta.basicRate));
  lines.push(renderMetricLine('enhancedRate', comparison.rateDelta.enhancedRate));
  lines.push(renderMetricLine('llmRate', comparison.rateDelta.llmRate));
  lines.push('');
}

function renderWindow(lines, title, window) {
  lines.push(`## ${title}`);
  lines.push('');
  lines.push(`- range: ${window.start} -> ${window.end}`);
  lines.push(`- activeSessions: ${window.metrics.activeSessions}`);
  lines.push(`- uniqueSubmitters: ${window.metrics.uniqueSubmitters}`);
  lines.push(`- uniqueCompleters/completedEvents: ${window.metrics.uniqueCompleters}/${window.metrics.completedEvents}`);
  lines.push(`- uniqueReportViewers: ${window.metrics.uniqueReportViewers}`);
  lines.push(`- reportViewed: ${window.metrics.reportViewed}`);
  lines.push(`- chatCompleted: ${window.metrics.chatCompleted}`);
  lines.push(`- toolDetailViewed: ${window.metrics.toolDetailViewed}`);
  lines.push(`- reportEventSavedFromResult: ${window.metrics.reportEventSavedFromResult}`);
  lines.push(`- llmModelAttempts/llmCircuitChanged: ${window.metrics.llmModelAttempts}/${window.metrics.llmCircuitChanged}`);
  lines.push(`- reportsTotal/realLikely: ${window.metrics.reportsTotal}/${window.metrics.realLikelyReports}`);
  lines.push(`- fallbackRate/basicRate/enhancedRate/llmRate: ${window.rates.fallbackRate}%/${window.rates.basicRate}%/${window.rates.enhancedRate}%/${window.rates.llmRate}%`);
  lines.push(`- llmAttemptPerCompletedRate/llmCircuitChangePerCompletedRate: ${window.rates.llmAttemptPerCompletedRate}%/${window.rates.llmCircuitChangePerCompletedRate}%`);
  lines.push('');
}

function renderTextReport(payload) {
  const lines = [];
  lines.push('# Upgrade Behavior Compare');
  lines.push('');
  lines.push(`baseline: ${payload.baseline}`);
  lines.push(`windowMinutes: ${payload.windowMinutes}`);
  lines.push(`generatedAt: ${payload.generatedAt}`);
  lines.push('');
  lines.push('## Focus signals');
  lines.push('');
  if (payload.focusSignals.length === 0) {
    lines.push('- none');
  } else {
    payload.focusSignals.forEach((signal) => lines.push(`- [${signal.level}] ${signal.comparison} ${signal.key}: ${signal.message}`));
  }
  lines.push('');
  renderWindow(lines, 'Pre-upgrade window', payload.windows.preUpgrade);
  renderWindow(lines, 'Initial post-upgrade window', payload.windows.initialPostUpgrade);
  renderWindow(lines, 'Current window', payload.windows.current);
  renderComparisonBlock(lines, 'Pre -> initial post-upgrade', payload.comparisons.preToInitial);
  renderComparisonBlock(lines, 'Initial post-upgrade -> current', payload.comparisons.initialToCurrent);
  lines.push('## Notes');
  lines.push('');
  if (payload.notes.length === 0) {
    lines.push('- none');
  } else {
    payload.notes.forEach((note) => lines.push(`- ${note}`));
  }
  lines.push('');
  lines.push('## Current top events');
  lines.push('');
  if (payload.windows.current.topEvents.length === 0) {
    lines.push('- none');
  } else {
    payload.windows.current.topEvents.forEach((item) => lines.push(`- ${item.eventName}: ${item.count}`));
  }
  lines.push('');
  lines.push('## Current sample reports');
  lines.push('');
  if (payload.windows.current.sampleReports.length === 0) {
    lines.push('- none');
  } else {
    payload.windows.current.sampleReports.forEach((row) => {
      lines.push(`- ${row.createdAt} | ${row.name} | ${row.grade}/${row.score} | ${row.deliveryTier} | ${row.reasoningMode} | llm=${row.llmUsed ? '1' : '0'} | viewed=${row.viewed ? '1' : '0'} | ${row.id}`);
    });
  }
  return lines.join('\n');
}

const currentEnd = new Date();
const windows = {
  preUpgrade: buildWindowSummary('preUpgrade', shiftMinutes(baselineDate, -windowMinutes), baselineDate),
  initialPostUpgrade: buildWindowSummary('initialPostUpgrade', baselineDate, shiftMinutes(baselineDate, windowMinutes)),
  current: buildWindowSummary('current', shiftMinutes(currentEnd, -windowMinutes), currentEnd),
};
const comparisons = {
  preToInitial: buildPairComparison(windows.preUpgrade, windows.initialPostUpgrade),
  initialToCurrent: buildPairComparison(windows.initialPostUpgrade, windows.current),
};
const payload = {
  generatedAt: new Date().toISOString(),
  baseline: baselineDate.toISOString(),
  windowMinutes,
  windows,
  comparisons,
  focusSignals: buildFocusSignals(windows, comparisons),
  notes: buildNotes(windows, comparisons),
};

if (saveSnapshot) {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.writeFileSync(SNAPSHOT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

if (jsonOnly) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(renderTextReport(payload));
}
