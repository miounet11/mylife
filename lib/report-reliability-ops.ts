import { fortuneOperations } from '@/lib/database';
import { syncReportFeedbackLoop } from '@/lib/report-feedback-loop';
import { enqueueReportUpgrade } from '@/lib/report-upgrade-jobs';
import type {
  OpenAgentReportReliabilityApplication,
  OpenAgentReportReliabilityPlan,
} from '@/lib/world-yi-autonomous-state';

export function applyOpenAgentReportReliabilityPlan(
  plan: OpenAgentReportReliabilityPlan,
  options?: {
    trackEvent?: boolean;
  }
): OpenAgentReportReliabilityApplication {
  const queuedJobs: OpenAgentReportReliabilityApplication['queuedJobs'] = [];
  const syncedReportIds: string[] = [];
  const skipped: OpenAgentReportReliabilityApplication['skipped'] = [];
  const notes: string[] = [];
  const handledReportIds = new Set<string>();

  for (const target of plan.priorityReports) {
    const report = fortuneOperations.getById(target.reportId);
    if (!report) {
      skipped.push({
        reportId: target.reportId,
        action: target.action,
        reason: 'report_not_found',
      });
      continue;
    }

    if (target.action === 'observe') {
      skipped.push({
        reportId: target.reportId,
        action: target.action,
        reason: 'observe_only',
      });
      continue;
    }

    if (target.action === 'feedback_sync') {
      const result = syncReportFeedbackLoop(target.reportId, {
        trackEvent: options?.trackEvent,
      });
      if (result.success) {
        syncedReportIds.push(target.reportId);
      } else {
        skipped.push({
          reportId: target.reportId,
          action: target.action,
          reason: result.reason,
        });
      }
      continue;
    }

    if (handledReportIds.has(target.reportId)) {
      skipped.push({
        reportId: target.reportId,
        action: target.action,
        reason: 'duplicate_priority_report',
      });
      continue;
    }

    const enqueueResult = enqueueReportUpgrade({
      report,
      force: target.action === 'recompute',
      reason: 'open_agent_report_reliability',
      meta: {
        source: 'open_agent_report_reliability',
        openAgentAction: target.action,
        openAgentReason: target.reason,
        openAgentDeliveryTier: target.deliveryTier,
        openAgentQualityScore: target.qualityScore,
      },
    });

    queuedJobs.push({
      reportId: target.reportId,
      action: target.action === 'recompute' ? 'recompute' : 'upgrade',
      status: enqueueResult.queued ? 'queued' : 'skipped',
      reason: enqueueResult.reason,
      jobStatus: enqueueResult.job?.status,
    });
    handledReportIds.add(target.reportId);
  }

  for (const action of plan.recommendedActions) {
    if (!action.autoExecutable) {
      skipped.push({
        action: action.kind,
        reason: 'manual_action_required',
      });
      continue;
    }

    if (action.kind === 'sync_feedback' && syncedReportIds.length === 0) {
      notes.push('feedback_sync_already_refreshed_in_report_retro');
      continue;
    }

    if (action.kind === 'tighten_guard' || action.kind === 'keep_delivery') {
      notes.push('reliability_guard_already_enforced_by_pipeline');
      continue;
    }

    if (action.kind === 'observe') {
      notes.push('observe_action_acknowledged');
      continue;
    }

    if (action.kind === 'investigate') {
      skipped.push({
        action: action.kind,
        reason: 'manual_investigation_required',
      });
    }
  }

  return {
    autoExecuted: true,
    appliedAt: new Date().toISOString(),
    queuedJobs,
    syncedReportIds,
    skipped,
    notes,
  };
}
