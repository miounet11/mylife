import { trackServerEvent } from '@/lib/analytics';
import { eventOperations, fortuneOperations } from '@/lib/database';
import { buildConfidenceAnalysis, buildMonthlyWindows, buildReportCorrectionInsight, buildReportValidationInsights, buildScenarioViews } from '@/lib/report-v2';
import type { FortuneRecord } from '@/lib/user-types';
import { getCurrentLocalMonthKey } from '@/lib/utils';

type ReportFeedbackSyncSuccess = {
  success: true;
  reportId: string;
  validationInsights: ReturnType<typeof buildReportValidationInsights>;
  correctionInsight: ReturnType<typeof buildReportCorrectionInsight>;
};

type ReportFeedbackSyncFailure = {
  success: false;
  reason: 'report_not_found';
};

export function syncReportFeedbackLoop(reportId: string, options?: {
  trackEvent?: boolean;
}) : ReportFeedbackSyncSuccess | ReportFeedbackSyncFailure {
  const report = fortuneOperations.getById(reportId);
  if (!report) {
    return {
      success: false,
      reason: 'report_not_found',
    };
  }

  const linkedEvents = eventOperations
    .getByUserId(report.userId)
    .filter((event) => (event.fortuneAnalysis as { reportId?: string } | undefined)?.reportId === reportId);

  const scenarioViews = buildScenarioViews({
    basic: report.bazi,
    advice: report.advice,
    fiveElements: report.fiveElements,
    pattern: report.pattern,
    fortune: report.fortune,
    klineData: report.klineData || null,
    dayun: report.dayun,
    shenSha: report.shenSha,
  });
  const calendarAnchor = getCurrentLocalMonthKey() || new Date();
  const monthlyWindows = buildMonthlyWindows({
    basic: report.bazi,
    advice: report.advice,
    fiveElements: report.fiveElements,
    pattern: report.pattern,
    fortune: report.fortune,
    klineData: report.klineData || null,
    dayun: report.dayun,
    shenSha: report.shenSha,
  }, calendarAnchor);
  const confidence = buildConfidenceAnalysis({
    basic: report.bazi,
    advice: report.advice,
    fiveElements: report.fiveElements,
    pattern: report.pattern,
    fortune: report.fortune,
    klineData: report.klineData || null,
    dayun: report.dayun,
    shenSha: report.shenSha,
  });

  const validationInsights = buildReportValidationInsights(
    linkedEvents.map((event) => ({
      title: event.title,
      userFeedback: event.userFeedback as { wasAccurate?: boolean; userNotes?: string } | undefined,
      fortuneAnalysis: event.fortuneAnalysis as { reason?: string } | undefined,
    }))
  );
  const correctionInsight = buildReportCorrectionInsight({
    validationInsights,
    confidence,
    scenarioViews,
    monthlyWindows,
  });

  const nextAnalysis = {
    ...(report.analysis || {}),
    feedbackLoop: {
      syncedAt: new Date().toISOString(),
      linkedReportId: reportId,
      validationInsights,
      correctionInsight,
    },
  } as NonNullable<FortuneRecord['analysis']>;

  fortuneOperations.update(reportId, {
    analysis: nextAnalysis,
  });

  if (options?.trackEvent !== false) {
    trackServerEvent({
      userId: report.userId,
      sessionId: report.userId,
      eventName: 'report_feedback_synced',
      page: `/result/${reportId}`,
      meta: {
        reportId,
        linkedEvents: validationInsights.totalLinkedEvents,
        accurateCount: validationInsights.accurateCount,
        driftCount: validationInsights.driftCount,
        pendingCount: validationInsights.pendingCount,
        correctionLevel: correctionInsight.level,
      },
    });
  }

  return {
    success: true,
    reportId,
    validationInsights,
    correctionInsight,
  };
}

export function syncRecentReportFeedbackLoops(limit = 50, options?: {
  trackEvent?: boolean;
}) {
  const reports = fortuneOperations.listRecent(limit);
  const results = reports.map((report) => syncReportFeedbackLoop(report.id, options));
  const synced = results.filter((item): item is ReportFeedbackSyncSuccess => item.success);
  const failed = results.filter((item): item is ReportFeedbackSyncFailure => !item.success);

  return {
    scannedCount: reports.length,
    syncedCount: synced.length,
    failedCount: failed.length,
    failed,
    reports: synced.map((item) => ({
      reportId: item.reportId,
      linkedEvents: item.validationInsights.totalLinkedEvents,
      driftCount: item.validationInsights.driftCount,
      pendingCount: item.validationInsights.pendingCount,
      correctionLevel: item.correctionInsight.level,
    })),
  };
}
