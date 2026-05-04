jest.mock('@/lib/database', () => ({
  analyticsOperations: {
    rawQuery: jest.fn(),
  },
  fortuneOperations: {
    getById: jest.fn(),
  },
}));

jest.mock('@/lib/report-upgrade-jobs', () => ({
  enqueueReportUpgrade: jest.fn(),
}));

import { analyticsOperations, fortuneOperations } from '@/lib/database';
import { enqueueRealUserReportUpgradeCandidates, listRealUserReportUpgradeCandidates } from '@/lib/real-user-report-upgrades';
import { enqueueReportUpgrade } from '@/lib/report-upgrade-jobs';

const mockedAnalyticsOperations = analyticsOperations as jest.Mocked<typeof analyticsOperations>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedEnqueueReportUpgrade = enqueueReportUpgrade as jest.MockedFunction<typeof enqueueReportUpgrade>;

describe('real user report upgrades', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prioritizes viewed real basic reports and skips test samples', () => {
    mockedAnalyticsOperations.rawQuery.mockReturnValue([
      { report_id: 'report_real_basic', viewed_count: 3, latest_viewed_at: '2026-05-04 10:01:00' },
      { report_id: 'report_test', viewed_count: 9, latest_viewed_at: '2026-05-04 10:02:00' },
      { report_id: 'report_expert', viewed_count: 4, latest_viewed_at: '2026-05-04 10:03:00' },
    ]);
    mockedFortuneOperations.getById.mockImplementation((reportId: string) => {
      if (reportId === 'report_real_basic') {
        return {
          id: reportId,
          userId: 'user_real',
          name: '李嘉文',
          analysis: {
            llmUsed: false,
            qualityAudit: {
              overallScore: 78,
              grade: 'B',
              deliveryTier: 'basic',
              targetAchieved: false,
            },
          },
        } as any;
      }
      if (reportId === 'report_test') {
        return {
          id: reportId,
          userId: 'user_test',
          name: '案例1',
          analysis: {
            llmUsed: false,
            qualityAudit: {
              overallScore: 78,
              deliveryTier: 'basic',
              targetAchieved: false,
            },
          },
        } as any;
      }
      return {
        id: reportId,
        userId: 'user_expert',
        name: '王浩宇',
        analysis: {
          llmUsed: true,
          qualityAudit: {
            overallScore: 96,
            grade: 'S',
            deliveryTier: 'expert',
            targetAchieved: true,
          },
        },
      } as any;
    });

    const candidates = listRealUserReportUpgradeCandidates(7, 10);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].report.id).toBe('report_real_basic');
    expect(candidates[0].priorityScore).toBeGreaterThan(150);
    expect(candidates[0].reasons).toContain('真实用户已查看但仍是 basic');
  });

  it('enqueues candidates with real-user priority metadata', () => {
    mockedAnalyticsOperations.rawQuery.mockReturnValue([
      { report_id: 'report_real_basic', viewed_count: 2, latest_viewed_at: '2026-05-04 10:01:00' },
    ]);
    mockedFortuneOperations.getById.mockReturnValue({
      id: 'report_real_basic',
      userId: 'user_real',
      name: '李嘉文',
      analysis: {
        llmUsed: false,
        qualityAudit: {
          overallScore: 78,
          grade: 'B',
          deliveryTier: 'basic',
          targetAchieved: false,
        },
      },
    } as any);
    mockedEnqueueReportUpgrade.mockReturnValue({
      queued: true,
      reason: 'queued',
      job: { id: 'job_real' } as any,
    });

    const result = enqueueRealUserReportUpgradeCandidates({ windowDays: 7, limit: 3 });

    expect(result.queuedCount).toBe(1);
    expect(result.candidates[0]).toMatchObject({
      reportId: 'report_real_basic',
      queued: true,
      queueReason: 'queued',
    });
    expect(mockedEnqueueReportUpgrade).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'real_user_viewed_priority',
        meta: expect.objectContaining({
          realUserPriority: true,
          viewedCount: 2,
        }),
      })
    );
  });
});
