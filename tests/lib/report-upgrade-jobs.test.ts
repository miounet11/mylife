jest.mock('@/lib/analytics', () => ({
  trackServerEvent: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  emailSubscriptionOperations: {
    getByEmail: jest.fn(),
  },
  fortuneOperations: {
    getById: jest.fn(),
    update: jest.fn(),
  },
  reportUpgradeJobOperations: {
    enqueue: jest.fn(),
    getByReportId: jest.fn(),
    listRunnablePending: jest.fn(),
    claimNextRunnable: jest.fn(),
    markCompleted: jest.fn(),
    markDeferred: jest.fn(),
    markFailed: jest.fn(),
    markRetry: jest.fn(),
  },
  userOperations: {
    getById: jest.fn(),
  },
}));

jest.mock('@/lib/email', () => ({
  isEmailDeliveryConfigured: jest.fn(() => false),
  sendReportUpgradeReadyEmail: jest.fn(),
}));

jest.mock('@/lib/llm-model-fallback', () => ({
  getModelFallbackChain: jest.fn(() => ['grok-420-fast', 'gpt-5.2', 'auto']),
}));

jest.mock('@/lib/llm-provider-health', () => ({
  assessScopeProviderHealth: jest.fn(() => ({
    shouldDefer: false,
    snapshots: [],
  })),
  hasRunnableModelsForSnapshots: jest.fn(() => true),
}));

jest.mock('@/lib/report-quality', () => ({
  REPORT_EXPERT_TARGET_SCORE: 95,
}));

jest.mock('@/lib/report-pipeline', () => ({
  CURRENT_REPORT_VERSION: 'v3',
  regenerateReportFromRecord: jest.fn(),
}));

jest.mock('@/lib/report-version-lineage', () => ({
  withReportVersionLineage: jest.fn(({ nextAnalysis }) => nextAnalysis),
}));

import { fortuneOperations, reportUpgradeJobOperations } from '@/lib/database';
import { assessScopeProviderHealth, hasRunnableModelsForSnapshots } from '@/lib/llm-provider-health';
import { regenerateReportFromRecord } from '@/lib/report-pipeline';
import { enqueueReportUpgrade, processNextReportUpgradeJob, processReportUpgradeBatch } from '@/lib/report-upgrade-jobs';

const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedReportUpgradeJobOperations = reportUpgradeJobOperations as jest.Mocked<typeof reportUpgradeJobOperations>;
const mockedAssessScopeProviderHealth = assessScopeProviderHealth as jest.MockedFunction<typeof assessScopeProviderHealth>;
const mockedHasRunnableModelsForSnapshots = hasRunnableModelsForSnapshots as jest.MockedFunction<typeof hasRunnableModelsForSnapshots>;
const mockedRegenerateReportFromRecord = regenerateReportFromRecord as jest.MockedFunction<typeof regenerateReportFromRecord>;

describe('report upgrade jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedReportUpgradeJobOperations.getByReportId.mockReturnValue(null);
    mockedReportUpgradeJobOperations.listRunnablePending.mockReturnValue([]);
    mockedRegenerateReportFromRecord.mockReset();
    mockedAssessScopeProviderHealth.mockReset();
    mockedAssessScopeProviderHealth.mockReturnValue({
      shouldDefer: false,
      snapshots: [],
    });
    mockedHasRunnableModelsForSnapshots.mockReset();
    mockedHasRunnableModelsForSnapshots.mockReturnValue(true);
  });

  it('enqueues a pending upgrade when providers are healthy', () => {
    mockedReportUpgradeJobOperations.getByReportId
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({
        id: 'job_pending',
        reportId: 'report_pending',
        status: 'pending',
      } as any);

    const result = enqueueReportUpgrade({
      report: {
        id: 'report_pending',
        userId: 'user_pending',
        reportVersion: 'v3',
        analysis: {
          qualityAudit: {
            overallScore: 82,
            grade: 'B',
            deliveryTier: 'basic',
            targetAchieved: false,
          },
        },
      } as any,
    });

    expect(result).toMatchObject({
      queued: true,
      reason: 'queued',
      job: expect.objectContaining({
        status: 'pending',
      }),
    });
    expect(mockedReportUpgradeJobOperations.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: 'report_pending',
        status: 'pending',
        lastError: null,
      })
    );
  });

  it('enqueues a deferred retry immediately when providers are unhealthy', () => {
    mockedReportUpgradeJobOperations.getByReportId
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({
        id: 'job_retry',
        reportId: 'report_retry',
        status: 'retry',
        lastError: 'PROVIDER_UNHEALTHY',
      } as any);
    mockedAssessScopeProviderHealth.mockReturnValue({
      shouldDefer: true,
      snapshots: [
        {
          model: 'grok-420-fast',
          defaultOrder: 0,
          state: 'open',
          attempts: 6,
          successes: 0,
          failures: 6,
          successRate: 0,
          failureRate: 1,
          avgLatencyMs: 4200,
          consecutiveFailures: 6,
          reopenAt: '2026-03-15T09:51:29.666Z',
          rankPenalty: 1000,
        },
      ],
    } as any);
    mockedHasRunnableModelsForSnapshots.mockReturnValue(false);

    const result = enqueueReportUpgrade({
      report: {
        id: 'report_retry',
        userId: 'user_retry',
        reportVersion: 'v3',
        analysis: {
          qualityAudit: {
            overallScore: 76,
            grade: 'C',
            deliveryTier: 'basic',
            targetAchieved: false,
          },
        },
      } as any,
    });

    expect(result).toMatchObject({
      queued: true,
      reason: 'provider_unhealthy',
      job: expect.objectContaining({
        status: 'retry',
        lastError: 'PROVIDER_UNHEALTHY',
      }),
    });
    expect(mockedReportUpgradeJobOperations.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: 'report_retry',
        status: 'retry',
        lastError: 'PROVIDER_UNHEALTHY',
        meta: expect.objectContaining({
          deferredForProvider: true,
        }),
      })
    );
  });

  it('defers the job instead of spending a normal retry when LLM output is unavailable', async () => {
    mockedReportUpgradeJobOperations.claimNextRunnable.mockReturnValue({
      id: 'job_1',
      reportId: 'report_1',
      userId: 'user_1',
      status: 'running',
      attempts: 1,
      maxAttempts: 6,
      targetScore: 95,
      lastScore: 76,
      bestScore: 76,
      bestGrade: 'C',
      nextRunAt: new Date().toISOString(),
      meta: {},
    } as any);
    mockedFortuneOperations.getById.mockReturnValue({
      id: 'report_1',
      userId: 'user_1',
      name: '测试用户',
      gender: 'male',
      birthDate: '1990-01-01',
      birthTime: '00:00',
      birthPlace: '北京',
      timezone: 8,
      analysis: {
        qualityAudit: {
          overallScore: 76,
          grade: 'C',
          deliveryTier: 'basic',
        },
      },
      reportVersion: 'v2',
    } as any);
    mockedRegenerateReportFromRecord.mockResolvedValue({
      result: {
        analysis: {
          qualityAudit: {
            overallScore: 81,
            grade: 'B',
            deliveryTier: 'basic',
            targetAchieved: false,
          },
        },
      },
      llmUsed: false,
      llmUnavailable: true,
      deferredByProviderHealth: true,
    } as any);

    const result = await processNextReportUpgradeJob();

    expect(result).toMatchObject({
      processed: true,
      status: 'retry',
      reportId: 'report_1',
      reason: 'provider_unhealthy',
    });
    expect(mockedReportUpgradeJobOperations.markDeferred).toHaveBeenCalledWith(
      'job_1',
      expect.objectContaining({
        lastScore: 81,
        bestScore: 81,
        bestGrade: 'B',
        lastError: 'PROVIDER_UNHEALTHY',
      })
    );
    expect(mockedReportUpgradeJobOperations.markRetry).not.toHaveBeenCalled();
    expect(mockedReportUpgradeJobOperations.markFailed).not.toHaveBeenCalled();
  });

  it('continues regeneration when only agent providers are half-open probes', async () => {
    mockedReportUpgradeJobOperations.claimNextRunnable.mockReturnValue({
      id: 'job_2',
      reportId: 'report_2',
      userId: 'user_2',
      status: 'running',
      attempts: 1,
      maxAttempts: 6,
      targetScore: 95,
      lastScore: 81,
      bestScore: 81,
      bestGrade: 'B',
      nextRunAt: new Date().toISOString(),
      meta: {},
    } as any);
    mockedFortuneOperations.getById.mockReturnValue({
      id: 'report_2',
      userId: 'user_2',
      name: '测试用户2',
      gender: 'female',
      birthDate: '1992-02-02',
      birthTime: '08:00',
      birthPlace: '上海',
      timezone: 8,
      analysis: {
        qualityAudit: {
          overallScore: 81,
          grade: 'B',
          deliveryTier: 'basic',
        },
      },
      reportVersion: 'v3',
      } as any);
    mockedRegenerateReportFromRecord.mockResolvedValue({
      result: {
        analysis: {
          qualityAudit: {
            overallScore: 86,
            grade: 'B',
            deliveryTier: 'enhanced',
            targetAchieved: false,
          },
        },
      },
      llmUsed: true,
      llmUnavailable: false,
      deferredByProviderHealth: false,
    } as any);
    mockedAssessScopeProviderHealth
      .mockReturnValueOnce({
        shouldDefer: false,
        snapshots: [
          {
            model: 'grok-420-fast',
            defaultOrder: 0,
            state: 'closed',
            attempts: 0,
            successes: 0,
            failures: 0,
            successRate: 1,
            failureRate: 0,
            avgLatencyMs: 0,
            consecutiveFailures: 0,
            rankPenalty: 0,
          },
        ],
      } as any)
      .mockReturnValueOnce({
        shouldDefer: false,
        snapshots: [
          {
            model: 'grok-420-fast',
            defaultOrder: 0,
            state: 'half-open',
            attempts: 1,
            successes: 0,
            failures: 1,
            successRate: 0,
            failureRate: 1,
            avgLatencyMs: 17500,
            consecutiveFailures: 1,
            rankPenalty: 0,
          },
          {
            model: 'gpt-5.2',
            defaultOrder: 1,
            state: 'half-open',
            attempts: 1,
            successes: 0,
            failures: 1,
            successRate: 0,
            failureRate: 1,
            avgLatencyMs: 5000,
            consecutiveFailures: 1,
            rankPenalty: 0,
          },
          {
            model: 'auto',
            defaultOrder: 2,
            state: 'open',
            attempts: 2,
            successes: 0,
            failures: 2,
            successRate: 0,
            failureRate: 1,
            avgLatencyMs: 2500,
            consecutiveFailures: 2,
            reopenAt: '2026-03-15T09:51:29.666Z',
            rankPenalty: 0,
          },
        ],
      } as any);

    const result = await processNextReportUpgradeJob();

    expect(result).toMatchObject({
      processed: true,
      status: 'retry',
      reportId: 'report_2',
      score: 86,
    });
    expect(mockedRegenerateReportFromRecord).toHaveBeenCalledTimes(1);
    expect(mockedReportUpgradeJobOperations.markRetry).toHaveBeenCalledWith(
      'job_2',
      expect.objectContaining({
        lastScore: 86,
        bestScore: 86,
        bestGrade: 'B',
      })
    );
    expect(mockedReportUpgradeJobOperations.markDeferred).not.toHaveBeenCalled();
  });

  it('skips the whole batch when provider health is globally unhealthy', async () => {
    mockedAssessScopeProviderHealth.mockReturnValue({
      shouldDefer: true,
      snapshots: [
        {
          model: 'grok-420-fast',
          defaultOrder: 0,
          state: 'open',
          attempts: 6,
          successes: 0,
          failures: 6,
          successRate: 0,
          failureRate: 1,
          avgLatencyMs: 4200,
          consecutiveFailures: 6,
          reopenAt: '2026-03-15T09:51:29.666Z',
          rankPenalty: 1000,
        },
      ],
    } as any);
    mockedHasRunnableModelsForSnapshots.mockReturnValue(false);

    const result = await processReportUpgradeBatch(2);

    expect(result).toMatchObject({
      processed: false,
      processedCount: 0,
      reason: 'provider_unhealthy',
      jobs: [],
    });
    expect(mockedReportUpgradeJobOperations.listRunnablePending).toHaveBeenCalledWith(2);
    expect(mockedReportUpgradeJobOperations.claimNextRunnable).not.toHaveBeenCalled();
  });

  it('converts due pending jobs to deferred retry when the whole batch is unhealthy', async () => {
    mockedAssessScopeProviderHealth.mockReturnValue({
      shouldDefer: true,
      snapshots: [
        {
          model: 'grok-420-fast',
          defaultOrder: 0,
          state: 'open',
          attempts: 6,
          successes: 0,
          failures: 6,
          successRate: 0,
          failureRate: 1,
          avgLatencyMs: 4200,
          consecutiveFailures: 6,
          reopenAt: '2026-03-15T09:51:29.666Z',
          rankPenalty: 1000,
        },
      ],
    } as any);
    mockedHasRunnableModelsForSnapshots.mockReturnValue(false);
    mockedReportUpgradeJobOperations.listRunnablePending.mockReturnValue([
      {
        id: 'job_pending_1',
        reportId: 'report_pending_1',
        userId: 'user_pending_1',
        status: 'pending',
        attempts: 0,
        maxAttempts: 6,
        lastScore: 72,
        bestScore: 72,
        bestGrade: 'C',
        meta: { reason: 'quality_gate' },
      } as any,
    ]);

    const result = await processReportUpgradeBatch(2);

    expect(result).toMatchObject({
      processed: true,
      processedCount: 1,
      reason: 'provider_unhealthy',
      jobs: [
        expect.objectContaining({
          status: 'retry',
          reportId: 'report_pending_1',
          reason: 'provider_unhealthy',
        }),
      ],
    });
    expect(mockedReportUpgradeJobOperations.markDeferred).toHaveBeenCalledWith(
      'job_pending_1',
      expect.objectContaining({
        lastError: 'PROVIDER_UNHEALTHY',
        meta: expect.objectContaining({
          deferredForProvider: true,
        }),
      })
    );
    expect(mockedReportUpgradeJobOperations.claimNextRunnable).not.toHaveBeenCalled();
  });

  it('continues the batch when report models are still runnable', async () => {
    mockedReportUpgradeJobOperations.claimNextRunnable
      .mockReturnValueOnce({
      id: 'job_3',
      reportId: 'report_3',
      userId: 'user_3',
      status: 'running',
      attempts: 1,
      maxAttempts: 6,
      targetScore: 95,
      lastScore: 80,
      bestScore: 80,
      bestGrade: 'B',
      nextRunAt: new Date().toISOString(),
      meta: {},
    } as any)
      .mockReturnValueOnce(null as any);
    mockedFortuneOperations.getById.mockReturnValue({
      id: 'report_3',
      userId: 'user_3',
      name: '测试用户3',
      gender: 'male',
      birthDate: '1991-01-01',
      birthTime: '09:00',
      birthPlace: '北京',
      timezone: 8,
      analysis: {
        qualityAudit: {
          overallScore: 80,
          grade: 'B',
          deliveryTier: 'basic',
        },
      },
      reportVersion: 'v3',
    } as any);
    mockedRegenerateReportFromRecord.mockResolvedValue({
      result: {
        analysis: {
          qualityAudit: {
            overallScore: 86,
            grade: 'B',
            deliveryTier: 'enhanced',
            targetAchieved: false,
          },
        },
      },
      llmUsed: true,
      llmUnavailable: false,
      deferredByProviderHealth: false,
    } as any);
    mockedAssessScopeProviderHealth
      .mockReturnValueOnce({
        shouldDefer: false,
        snapshots: [
          {
            model: 'grok-420-fast',
            defaultOrder: 0,
            state: 'closed',
            attempts: 0,
            successes: 0,
            failures: 0,
            successRate: 1,
            failureRate: 0,
            avgLatencyMs: 0,
            consecutiveFailures: 0,
            rankPenalty: 0,
          },
        ],
      } as any)
      .mockReturnValueOnce({
        shouldDefer: false,
        snapshots: [
          {
            model: 'grok-420-fast',
            defaultOrder: 0,
            state: 'closed',
            attempts: 0,
            successes: 0,
            failures: 0,
            successRate: 1,
            failureRate: 0,
            avgLatencyMs: 0,
            consecutiveFailures: 0,
            rankPenalty: 0,
          },
        ],
      } as any)
      .mockReturnValueOnce({
        shouldDefer: false,
        snapshots: [
          {
            model: 'grok-420-fast',
            defaultOrder: 0,
            state: 'closed',
            attempts: 0,
            successes: 0,
            failures: 0,
            successRate: 1,
            failureRate: 0,
            avgLatencyMs: 0,
            consecutiveFailures: 0,
            rankPenalty: 0,
          },
        ],
      } as any)
      .mockReturnValueOnce({
        shouldDefer: true,
        snapshots: [
          {
            model: 'grok-420-fast',
            defaultOrder: 0,
            state: 'half-open',
            attempts: 1,
            successes: 0,
            failures: 1,
            successRate: 0,
            failureRate: 1,
            avgLatencyMs: 4200,
            consecutiveFailures: 1,
            rankPenalty: 350,
          },
        ],
      } as any);

    const result = await processReportUpgradeBatch(2);

    expect(result).toMatchObject({
      processed: true,
      processedCount: 1,
      jobs: [
        expect.objectContaining({
          status: 'retry',
          score: 86,
        }),
      ],
    });
    expect(mockedReportUpgradeJobOperations.claimNextRunnable).toHaveBeenCalledTimes(2);
  });
});
