import { trackServerEvent } from '@/lib/analytics';
import { eventOperations, fortuneOperations } from '@/lib/database';
import { buildConfidenceAnalysis, buildMonthlyWindows, buildReportCorrectionInsight, buildReportValidationInsights, buildScenarioViews } from '@/lib/report-v2';

export function syncReportFeedbackLoop(reportId: string) {
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
  const monthlyWindows = buildMonthlyWindows({
    basic: report.bazi,
    advice: report.advice,
    fiveElements: report.fiveElements,
    pattern: report.pattern,
    fortune: report.fortune,
    klineData: report.klineData || null,
    dayun: report.dayun,
    shenSha: report.shenSha,
  });
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
  };

  fortuneOperations.update(reportId, {
    analysis: nextAnalysis,
  });

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

  return {
    success: true,
    reportId,
    validationInsights,
    correctionInsight,
  };
}

export function syncRecentReportFeedbackLoops(limit = 50) {
  const reports = fortuneOperations.listRecent(limit);
  const results = reports.map((report) => syncReportFeedbackLoop(report.id));
  const synced = results.filter((item) => item.success);
  const failed = results.filter((item) => !item.success);

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
