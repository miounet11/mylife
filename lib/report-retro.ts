import fs from 'fs';
import path from 'path';
import { db, fortuneOperations } from '@/lib/database';
import { syncRecentReportFeedbackLoops } from '@/lib/report-feedback-loop';
import { assessReportReliability } from '@/lib/report-reliability';
import { isLikelyTestReportName } from '@/lib/report-sample-classifier';
import type { FortuneAnalysisResult } from '@/lib/user-types';

const DEFAULT_WINDOW_MINUTES = 24 * 60;
const DEFAULT_SECTION_LIMIT = 12;
const REPORT_RETRO_SNAPSHOT_FILE = path.join(process.cwd(), 'data', 'runtime', 'report-retro.snapshot.json');

type AnalyticsRow = {
  event_name: string;
  page: string | null;
  meta: string | null;
  created_at: string;
  session_id: string | null;
  user_id: string | null;
};

type ReportRow = {
  id: string;
  user_id: string;
  name: string;
  birth_place: string | null;
  report_version: string | null;
  created_at: string;
  updated_at: string;
  llm_used: number | string | null;
  reasoning_mode: string | null;
  score: number | string | null;
  grade: string | null;
  delivery_tier: string | null;
  target_achieved: number | string | null;
  verify_verdict: string | null;
  verify_score: number | string | null;
  reliability_status: string | null;
  reliability_score: number | string | null;
  linked_events: number | string | null;
  accurate_count: number | string | null;
  drift_count: number | string | null;
  pending_count: number | string | null;
  correction_level: string | null;
};

export interface ReportRetroReportCard {
  id: string;
  userId: string;
  name: string;
  birthPlace: string;
  reportVersion: string;
  createdAt: string;
  updatedAt: string;
  llmUsed: boolean;
  reasoningMode: string;
  score: number;
  grade: string;
  deliveryTier: string;
  targetAchieved: boolean;
  verifyVerdict: string;
  verifyScore: number;
  reliabilityStatus: string;
  reliabilityScore: number;
  linkedEvents: number;
  accurateCount: number;
  driftCount: number;
  pendingCount: number;
  correctionLevel: string;
  likelyTest: boolean;
  viewed?: boolean;
}

export interface ReportRetroSessionCard {
  sessionId: string;
  homeViewed: number;
  analyzeViewed: number;
  submitted: number;
  completed: number;
  reportViewed: number;
  chatCompleted: number;
  lastAt: string;
}

export interface ReportRetroFailureHotspot {
  key: string;
  count: number;
}

export interface ReportRetroSnapshot {
  generatedAt: string;
  windowMinutes: number;
  feedbackSync?: {
    scannedCount: number;
    syncedCount: number;
    failedCount: number;
  };
  analytics: {
    totalEvents: number;
    activeSessions: number;
    uniqueSubmitters: number;
    uniqueCompleters: number;
    completedEvents: number;
    uniqueReportViewers: number;
    topEvents: Array<{
      eventName: string;
      count: number;
    }>;
    missingSessionPageViews: number;
  };
  reports: {
    total: number;
    realLikely: number;
    likelyTest: number;
    viewedDistinct: number;
    basicCount: number;
    llmCount: number;
    fallbackCompleted: number;
    fallbackRate: number;
    basicRate: number;
    llmRate: number;
    conservativeCount: number;
    conservativeRate: number;
    verifyWarnCount: number;
    verifyFailCount: number;
  };
  realReportCards: ReportRetroReportCard[];
  testReportCards: ReportRetroReportCard[];
  activeSessions: ReportRetroSessionCard[];
  failureHotspots: ReportRetroFailureHotspot[];
  recommendations: string[];
}

function ensureRuntimeDir() {
  fs.mkdirSync(path.dirname(REPORT_RETRO_SNAPSHOT_FILE), { recursive: true });
}

function parseMeta(value?: string | null) {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function readText(value: unknown) {
  return `${value || ''}`.trim();
}

function toPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function uniqueCount<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
}

function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value || 0);
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === '1';
}

function readAnalyticsRows(windowMinutes: number) {
  const sinceSql = `-${windowMinutes} minutes`;
  return db.prepare(`
    SELECT event_name, page, meta, created_at, session_id, user_id
    FROM analytics_events
    WHERE datetime(created_at) >= datetime('now', ?)
    ORDER BY created_at DESC
  `).all(sinceSql) as AnalyticsRow[];
}

function readReportRows(windowMinutes: number) {
  const sinceSql = `-${windowMinutes} minutes`;
  return db.prepare(`
    SELECT
      id,
      user_id,
      name,
      birth_place,
      report_version,
      created_at,
      updated_at,
      json_extract(analysis, '$.llmUsed') AS llm_used,
      json_extract(analysis, '$.reasoningMode') AS reasoning_mode,
      json_extract(analysis, '$.qualityAudit.overallScore') AS score,
      json_extract(analysis, '$.qualityAudit.grade') AS grade,
      json_extract(analysis, '$.qualityAudit.deliveryTier') AS delivery_tier,
      json_extract(analysis, '$.qualityAudit.targetAchieved') AS target_achieved,
      json_extract(analysis, '$.verify.verdict') AS verify_verdict,
      json_extract(analysis, '$.verify.consistencyScore') AS verify_score,
      json_extract(analysis, '$.reliabilityGuard.status') AS reliability_status,
      json_extract(analysis, '$.reliabilityGuard.score') AS reliability_score,
      json_extract(analysis, '$.feedbackLoop.validationInsights.totalLinkedEvents') AS linked_events,
      json_extract(analysis, '$.feedbackLoop.validationInsights.accurateCount') AS accurate_count,
      json_extract(analysis, '$.feedbackLoop.validationInsights.driftCount') AS drift_count,
      json_extract(analysis, '$.feedbackLoop.validationInsights.pendingCount') AS pending_count,
      json_extract(analysis, '$.feedbackLoop.correctionInsight.level') AS correction_level
    FROM fortunes
    WHERE datetime(created_at) >= datetime('now', ?)
    ORDER BY datetime(created_at) DESC
  `).all(sinceSql) as ReportRow[];
}

export function buildReportRetroSnapshot(params?: {
  windowMinutes?: number;
  sectionLimit?: number;
  syncFeedback?: boolean;
  feedbackLimit?: number;
}) : ReportRetroSnapshot {
  const windowMinutes = Math.max(1, Math.floor(params?.windowMinutes || DEFAULT_WINDOW_MINUTES));
  const sectionLimit = Math.max(1, Math.min(24, Math.floor(params?.sectionLimit || DEFAULT_SECTION_LIMIT)));
  const feedbackSync = params?.syncFeedback
    ? syncRecentReportFeedbackLoops(
        Math.max(1, Math.min(200, Math.floor(params?.feedbackLimit || 50))),
        { trackEvent: false }
      )
    : null;
  const analyticsRows = readAnalyticsRows(windowMinutes);
  const reportRows = readReportRows(windowMinutes);

  const eventCounts = new Map<string, number>();
  const pageViewMissingSession: AnalyticsRow[] = [];
  const analyzeRows: AnalyticsRow[] = [];
  const analyzeFailedRows: AnalyticsRow[] = [];
  const reportViewedRows: AnalyticsRow[] = [];
  const sessionSummary = new Map<string, ReportRetroSessionCard>();

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

  const reports: ReportRetroReportCard[] = reportRows.map((row) => {
    const persistedReliabilityStatus = readText(row.reliability_status);
    const persistedReliabilityScore = toNumber(row.reliability_score);
    const fallbackReliability = !persistedReliabilityStatus
      ? (() => {
          const report = fortuneOperations.getById(row.id);
          if (!report) {
            return null;
          }

          return assessReportReliability({
            basic: report.bazi,
            fiveElements: report.fiveElements,
            tenGods: report.tenGods,
            pattern: report.pattern,
            fortune: report.fortune,
            advice: report.advice,
            evidence: report.evidence,
            analysis: report.analysis as FortuneAnalysisResult['analysis'],
            klineData: report.klineData,
            dayun: report.dayun,
            shenSha: report.shenSha,
          } as unknown as FortuneAnalysisResult);
        })()
      : null;

    return {
      id: row.id,
      userId: row.user_id,
      name: readText(row.name),
      birthPlace: readText(row.birth_place),
      reportVersion: readText(row.report_version) || 'unknown',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      llmUsed: toBoolean(row.llm_used),
      reasoningMode: readText(row.reasoning_mode) || 'unknown',
      score: toNumber(row.score),
      grade: readText(row.grade) || 'C',
      deliveryTier: readText(row.delivery_tier) || 'basic',
      targetAchieved: toBoolean(row.target_achieved),
      verifyVerdict: readText(row.verify_verdict) || 'unknown',
      verifyScore: toNumber(row.verify_score),
      reliabilityStatus: persistedReliabilityStatus || fallbackReliability?.status || 'unknown',
      reliabilityScore: persistedReliabilityStatus ? persistedReliabilityScore : fallbackReliability?.score || 0,
      linkedEvents: toNumber(row.linked_events),
      accurateCount: toNumber(row.accurate_count),
      driftCount: toNumber(row.drift_count),
      pendingCount: toNumber(row.pending_count),
      correctionLevel: readText(row.correction_level) || 'healthy',
      likelyTest: isLikelyTestReportName(row.name),
    };
  });

  const realReports = reports.filter((row) => !row.likelyTest);
  const testReports = reports.filter((row) => row.likelyTest);
  const viewedReportIds = new Set(
    reportViewedRows
      .map((row) => readText(parseMeta(row.meta).reportId))
      .filter(Boolean)
  );

  const analyzeCompletedRows = analyzeRows.filter((row) => row.event_name === 'analyze_completed');
  const completedMeta = analyzeCompletedRows.map((row) => parseMeta(row.meta));

  const fallbackCompleted = completedMeta.filter((meta) => meta.fallbackToEngine === true).length;
  const basicReports = reports.filter((row) => row.deliveryTier === 'basic').length;
  const llmReports = reports.filter((row) => row.llmUsed).length;
  const conservativeReports = reports.filter((row) => row.reliabilityStatus === 'conservative').length;
  const verifyWarnCount = reports.filter((row) => row.verifyVerdict === 'WARN').length;
  const verifyFailCount = reports.filter((row) => row.verifyVerdict === 'FAIL').length;

  const failureHotspots = analyzeFailedRows
    .map((row) => parseMeta(row.meta))
    .reduce<Map<string, number>>((acc, meta) => {
      const key = `stage=${readText(meta.stage) || 'unknown'} | error=${readText(meta.error) || 'unknown'}`;
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map());

  const realReportCards = realReports
    .map((row) => ({
      ...row,
      viewed: viewedReportIds.has(row.id),
    }))
    .slice(0, sectionLimit);
  const testReportCards = testReports
    .map((row) => ({
      ...row,
      viewed: viewedReportIds.has(row.id),
    }))
    .slice(0, sectionLimit);

  const activeSessions = [...sessionSummary.values()]
    .filter((row) => row.homeViewed || row.analyzeViewed || row.submitted || row.completed || row.reportViewed)
    .sort((left, right) => {
      if (right.completed !== left.completed) return right.completed - left.completed;
      if (right.submitted !== left.submitted) return right.submitted - left.submitted;
      if (right.reportViewed !== left.reportViewed) return right.reportViewed - left.reportViewed;
      return right.lastAt.localeCompare(left.lastAt);
    })
    .slice(0, Math.min(15, sectionLimit + 3));

  const recommendations: string[] = [
    pageViewMissingSession.length > 0
      ? '页面浏览埋点仍有缺 session，先修正漏斗采集，再放大质量结论。'
      : '页面浏览埋点 session 已基本串通，最近窗口可以作为正式复盘口径。',
    fallbackCompleted > 0
      ? `最近 ${fallbackCompleted} 次测算回退到了引擎输出，优先跟踪 LLM 健康、增强质量与保守交付比例。`
      : '最近窗口内没有明显引擎回退，优先关注真实样本质量差异和后续反馈。',
    conservativeReports > 0
      ? `当前有 ${conservativeReports} 份报告被 reliability guard 压到保守交付，应优先复盘 verify 失败或弱增强样本。`
      : '当前 reliability guard 没有大面积触发保守交付，可以继续放大真实样本池。',
    realReports.length > 0
      ? `把最近 ${Math.min(realReports.length, 5)} 份真实报告纳入版本评估名单，优先看 viewed=1、basic、WARN/FAIL 与 driftCount>0 的样本。`
      : '当前窗口内真实样本不足，先扩大真实用户测算量，再判断版本优先级。',
  ];

  return {
    generatedAt: new Date().toISOString(),
    windowMinutes,
    feedbackSync: feedbackSync ? {
      scannedCount: feedbackSync.scannedCount,
      syncedCount: feedbackSync.syncedCount,
      failedCount: feedbackSync.failedCount,
    } : undefined,
    analytics: {
      totalEvents: analyticsRows.length,
      activeSessions: activeSessions.length,
      uniqueSubmitters: uniqueCount(analyticsRows.filter((row) => row.event_name === 'analyze_submitted'), 'session_id'),
      uniqueCompleters: uniqueCount(analyzeCompletedRows, 'session_id'),
      completedEvents: analyzeCompletedRows.length,
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
      fallbackRate: toPercent(fallbackCompleted, analyzeCompletedRows.length),
      basicRate: toPercent(basicReports, reports.length),
      llmRate: toPercent(llmReports, reports.length),
      conservativeCount: conservativeReports,
      conservativeRate: toPercent(conservativeReports, reports.length),
      verifyWarnCount,
      verifyFailCount,
    },
    realReportCards,
    testReportCards,
    activeSessions,
    failureHotspots: [...failureHotspots.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([key, count]) => ({ key, count })),
    recommendations,
  };
}

export function writeReportRetroSnapshot(snapshot: ReportRetroSnapshot) {
  ensureRuntimeDir();
  fs.writeFileSync(REPORT_RETRO_SNAPSHOT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  return snapshot;
}

export function refreshReportRetroSnapshot(params?: {
  windowMinutes?: number;
  sectionLimit?: number;
  syncFeedback?: boolean;
  feedbackLimit?: number;
}) {
  const snapshot = buildReportRetroSnapshot(params);
  return writeReportRetroSnapshot(snapshot);
}

export function readReportRetroSnapshot() {
  try {
    return JSON.parse(fs.readFileSync(REPORT_RETRO_SNAPSHOT_FILE, 'utf8')) as ReportRetroSnapshot;
  } catch {
    return null;
  }
}
