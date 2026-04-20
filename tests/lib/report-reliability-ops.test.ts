jest.mock('@/lib/database', () => ({
  fortuneOperations: {
    getById: jest.fn(),
  },
}));

jest.mock('@/lib/report-feedback-loop', () => ({
  syncReportFeedbackLoop: jest.fn(),
}));

jest.mock('@/lib/report-upgrade-jobs', () => ({
  enqueueReportUpgrade: jest.fn(),
}));

import { fortuneOperations } from '@/lib/database';
import { syncReportFeedbackLoop } from '@/lib/report-feedback-loop';
import { enqueueReportUpgrade } from '@/lib/report-upgrade-jobs';
import { applyOpenAgentReportReliabilityPlan } from '@/lib/report-reliability-ops';

const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedSyncReportFeedbackLoop = syncReportFeedbackLoop as jest.MockedFunction<typeof syncReportFeedbackLoop>;
const mockedEnqueueReportUpgrade = enqueueReportUpgrade as jest.MockedFunction<typeof enqueueReportUpgrade>;

describe('report reliability ops', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queues upgrade and recompute actions from open agent reliability plan', () => {
    mockedFortuneOperations.getById
      .mockReturnValueOnce({ id: 'report_upgrade', userId: 'user_1', name: '张三' } as any)
      .mockReturnValueOnce({ id: 'report_recompute', userId: 'user_2', name: '李四' } as any);
    mockedEnqueueReportUpgrade
      .mockReturnValueOnce({
        queued: true,
        reason: 'queued',
        job: { status: 'pending' },
      } as any)
      .mockReturnValueOnce({
        queued: false,
        reason: 'already_queued',
        job: { status: 'retry' },
      } as any);

    const result = applyOpenAgentReportReliabilityPlan({
      summary: 'test',
      alerts: [],
      priorityReports: [
        {
          reportId: 'report_upgrade',
          name: '张三',
          action: 'upgrade',
          reason: 'upgrade this viewed warn report',
          qualityScore: 78,
          deliveryTier: 'enhanced',
        },
        {
          reportId: 'report_recompute',
          name: '李四',
          action: 'recompute',
          reason: 'recompute this conservative fail report',
          qualityScore: 79,
          deliveryTier: 'basic',
        },
      ],
      recommendedActions: [
        {
          kind: 'upgrade_reports',
          title: 'queue upgrades',
          reason: 'do it',
          autoExecutable: true,
        },
      ],
    });

    expect(mockedEnqueueReportUpgrade).toHaveBeenNthCalledWith(1, expect.objectContaining({
      report: expect.objectContaining({ id: 'report_upgrade' }),
      force: false,
    }));
    expect(mockedEnqueueReportUpgrade).toHaveBeenNthCalledWith(2, expect.objectContaining({
      report: expect.objectContaining({ id: 'report_recompute' }),
      force: true,
    }));
    expect(result.queuedJobs).toEqual([
      {
        reportId: 'report_upgrade',
        action: 'upgrade',
        status: 'queued',
        reason: 'queued',
        jobStatus: 'pending',
      },
      {
        reportId: 'report_recompute',
        action: 'recompute',
        status: 'skipped',
        reason: 'already_queued',
        jobStatus: 'retry',
      },
    ]);
  });

  it('runs targeted feedback sync and records manual investigation skips', () => {
    mockedFortuneOperations.getById.mockReturnValue({ id: 'report_feedback', userId: 'user_3', name: '王五' } as any);
    mockedSyncReportFeedbackLoop.mockReturnValue({
      success: true,
      reportId: 'report_feedback',
      validationInsights: {} as any,
      correctionInsight: {} as any,
    });

    const result = applyOpenAgentReportReliabilityPlan({
      summary: 'test',
      alerts: [],
      priorityReports: [
        {
          reportId: 'report_feedback',
          name: '王五',
          action: 'feedback_sync',
          reason: 'collect real evidence',
          qualityScore: 78,
          deliveryTier: 'enhanced',
        },
        {
          reportId: 'report_observe',
          name: '赵六',
          action: 'observe',
          reason: 'just watch',
          qualityScore: 78,
          deliveryTier: 'enhanced',
        },
      ],
      recommendedActions: [
        {
          kind: 'investigate',
          title: 'manual review',
          reason: 'needs human inspection',
          autoExecutable: true,
        },
      ],
    });

    expect(mockedSyncReportFeedbackLoop).toHaveBeenCalledWith('report_feedback', {
      trackEvent: undefined,
    });
    expect(result.syncedReportIds).toEqual(['report_feedback']);
    expect(result.skipped).toEqual([
      {
        reportId: 'report_observe',
        action: 'observe',
        reason: 'observe_only',
      },
      {
        action: 'investigate',
        reason: 'manual_investigation_required',
      },
    ]);
  });
});
