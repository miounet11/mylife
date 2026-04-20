jest.mock('@/lib/database', () => ({
  analyticsOperations: {
    getOverview: jest.fn(),
  },
}));

jest.mock('@/lib/system-ops', () => ({
  getSystemOpsSnapshot: jest.fn(),
}));

jest.mock('@/lib/report-retro', () => ({
  buildReportRetroSnapshot: jest.fn(),
}));

jest.mock('@/lib/admin-quality-workboard', () => ({
  getAdminQualityWorkboard: jest.fn(),
}));

jest.mock('@/lib/world-yi-autonomous-state', () => ({
  readOpenAgentOpsTriageSnapshot: jest.fn(),
  readOpenAgentReportReliabilitySnapshot: jest.fn(),
  readOpenAgentSiteGovernorSnapshot: jest.fn(),
  readWorldYiAutonomousCycleLedger: jest.fn(),
}));

import { analyticsOperations } from '@/lib/database';
import { getSystemOpsSnapshot } from '@/lib/system-ops';
import { buildReportRetroSnapshot } from '@/lib/report-retro';
import { getAdminQualityWorkboard } from '@/lib/admin-quality-workboard';
import {
  readOpenAgentOpsTriageSnapshot,
  readOpenAgentReportReliabilitySnapshot,
  readOpenAgentSiteGovernorSnapshot,
  readWorldYiAutonomousCycleLedger,
} from '@/lib/world-yi-autonomous-state';
import { buildSiteQualityGovernorSnapshot } from '@/lib/site-quality-governor';

const mockedGetOverview = analyticsOperations.getOverview as jest.MockedFunction<typeof analyticsOperations.getOverview>;
const mockedGetSystemOpsSnapshot = getSystemOpsSnapshot as jest.MockedFunction<typeof getSystemOpsSnapshot>;
const mockedBuildReportRetroSnapshot = buildReportRetroSnapshot as jest.MockedFunction<typeof buildReportRetroSnapshot>;
const mockedGetAdminQualityWorkboard = getAdminQualityWorkboard as jest.MockedFunction<typeof getAdminQualityWorkboard>;
const mockedReadOpenAgentOpsTriageSnapshot = readOpenAgentOpsTriageSnapshot as jest.MockedFunction<typeof readOpenAgentOpsTriageSnapshot>;
const mockedReadOpenAgentReportReliabilitySnapshot = readOpenAgentReportReliabilitySnapshot as jest.MockedFunction<typeof readOpenAgentReportReliabilitySnapshot>;
const mockedReadOpenAgentSiteGovernorSnapshot = readOpenAgentSiteGovernorSnapshot as jest.MockedFunction<typeof readOpenAgentSiteGovernorSnapshot>;
const mockedReadWorldYiAutonomousCycleLedger = readWorldYiAutonomousCycleLedger as jest.MockedFunction<typeof readWorldYiAutonomousCycleLedger>;

describe('site quality governor', () => {
  beforeEach(() => {
    mockedGetOverview.mockReturnValue({
      routeHealthBreakdown: [
        {
          key: 'analyze',
          label: '测算主流程',
          success: 18,
          failed: 1,
          fallbackCount: 2,
          total: 19,
          successRate: 95,
          fallbackRate: 11,
          avgDurationMs: 900,
          maxDurationMs: 1600,
          lastSeenAt: '2026-04-20T10:00:00.000Z',
        },
      ],
      requestFailureHotspots: [],
      recentBehaviorShift: {
        window: {
          currentStart: '2026-04-17',
          currentEnd: '2026-04-20',
          previousStart: '2026-04-14',
          previousEnd: '2026-04-17',
          compareLabel: '最近 3 个完整自然日 vs 前 3 个完整自然日',
        },
        funnel: [
          {
            key: 'report_to_chat',
            label: '结果页会话 -> 聊天提问',
            currentRate: 14,
            previousRate: 24,
            rateDelta: -10,
          },
          {
            key: 'report_to_event',
            label: '结果页会话 -> 事件沉淀',
            currentRate: 9,
            previousRate: 16,
            rateDelta: -7,
          },
          {
            key: 'tool_to_run',
            label: '工具详情会话 -> 工具开跑',
            currentRate: 18,
            previousRate: 20,
            rateDelta: -2,
          },
        ],
        signals: ['工具详情查看增加 12，用户对工具探索意愿在上升。'],
        warnings: ['结果页到聊天的会话转化下降 10 个点，报告页后续动作承接变弱。'],
      },
      systemHealth: {
        severity: 'warning',
        title: '当前系统可运行，但有若干卡点正在拖慢体验与转化',
        blockers: ['结果页到聊天链路变弱。'],
        healthySignals: ['模型链路目前没有明显的熔断阻塞。'],
        llmSnapshot: {
          attempts24h: 30,
          successRate24h: 78,
          openModelCount: 0,
          halfOpenModelCount: 0,
        },
      },
    } as any);

    mockedGetSystemOpsSnapshot.mockReturnValue({
      severity: 'warning',
      title: '当前系统可运行，但有若干卡点正在拖慢体验与转化',
      summary: 'system summary',
      checkedAt: '2026-04-20T10:00:00.000Z',
      blockers: ['结果页到聊天链路变弱。'],
      healthySignals: ['模型链路目前没有明显的熔断阻塞。'],
      services: {
        analytics: {
          severity: 'warning',
          title: 'analytics',
          summary: 'analytics summary',
          updatedAt: '2026-04-20T10:00:00.000Z',
          blockers: [],
          healthySignals: [],
          metrics: {
            totalAnalyses: 100,
            publicReports: 50,
            totalEvents: 20,
            validationPending: 3,
          },
        },
        content: {
          severity: 'healthy',
          summary: 'content summary',
          blockers: [],
          healthySignals: [],
          metrics: {
            publishedEntries: 10,
            draftEntries: 5,
            generationQueueLength: 2,
            autoPublishCandidateCount: 3,
            quickStartRate: 12,
          },
          scheduler: {
            draftReserveCount: 5,
            draftReserveTarget: 8,
            needsDraftReplenishment: false,
            canPublishNow: true,
            publishWindowOpen: true,
            nextPublishSlotLabel: '15:00',
          },
        },
        knowledge: {
          severity: 'healthy',
          summary: 'knowledge summary',
          blockers: [],
          healthySignals: [],
          metrics: {
            publishedKnowledgeEntries: 10,
            draftKnowledgeEntries: 2,
            publishedSynthesisEntries: 6,
            draftSynthesisEntries: 1,
            publishCandidateCount: 3,
            topicHubCount: 4,
            flagshipCount: 1,
            homepageEligibleCount: 2,
            featuredTopicCount: 2,
            publishQueueLength: 2,
          },
          acquisition: {
            status: 'success',
            lastRunAt: '2026-04-20T09:00:00.000Z',
            durationMs: 1200,
            lock: {
              present: false,
              stale: false,
              ageMs: 0,
              ttlMs: 2700000,
            },
          },
        },
      },
    } as any);

    mockedBuildReportRetroSnapshot.mockReturnValue({
      generatedAt: '2026-04-20T10:00:00.000Z',
      windowMinutes: 1440,
      analytics: {
        totalEvents: 200,
        activeSessions: 40,
        uniqueSubmitters: 10,
        uniqueCompleters: 8,
        completedEvents: 8,
        uniqueReportViewers: 6,
        topEvents: [],
        missingSessionPageViews: 0,
      },
      reports: {
        total: 8,
        realLikely: 6,
        likelyTest: 2,
        viewedDistinct: 5,
        basicCount: 2,
        llmCount: 6,
        fallbackCompleted: 1,
        fallbackRate: 13,
        basicRate: 25,
        llmRate: 75,
        conservativeCount: 0,
        conservativeRate: 0,
        verifyWarnCount: 0,
        verifyFailCount: 0,
      },
      realReportCards: [],
      testReportCards: [],
      activeSessions: [],
      failureHotspots: [],
      recommendations: [],
    } as any);

    mockedGetAdminQualityWorkboard.mockReturnValue({
      prioritizedContentFixes: [],
      prioritizedToolFixes: [],
      prioritizedToolJourneyGaps: [
        {
          slug: 'career-role-fit',
          title: '岗位匹配',
          pagePath: '/tools/career-role-fit',
          detailViews: 20,
          startCtaRate: 10,
          ctaToRunRate: 30,
          runFailureRate: 0,
          premiumRate: 0,
          gapType: 'cta_to_run',
          priorityScore: 66,
          action: '把工具输入门槛降低，增加可点击示例问题与直接运行兜底。',
          reason: 'detail 到 run 断层明显。',
        },
      ],
      prioritizedBouncePages: [
        {
          page: '/result/report_1',
          views: 12,
          engagedCount: 2,
          bouncedCount: 10,
          bounceRate: 83,
          action: '把继续追问和事件沉淀动作前移到第一屏。',
        },
      ],
    } as any);

    mockedReadOpenAgentSiteGovernorSnapshot.mockReturnValue({
      status: 'success',
      plan: {
        summary: 'summary',
        alerts: [],
        workstreams: [
          {
            area: 'conversion',
            target: '/result/[id]',
            issue: 'result page continuation weak',
            action: 'front-load next actions',
            priority: 'P0',
          },
        ],
      },
    } as any);

    mockedReadOpenAgentOpsTriageSnapshot.mockReturnValue({
      status: 'success',
      plan: {
        summary: 'summary',
        alerts: [],
        recommendedActions: [],
        policyDiffs: [],
      },
    } as any);

    mockedReadOpenAgentReportReliabilitySnapshot.mockReturnValue({
      status: 'success',
      plan: {
        summary: 'summary',
        alerts: [],
        priorityReports: [],
        recommendedActions: [],
      },
      application: {
        autoExecuted: false,
        queuedJobs: [],
        syncedReportIds: [],
        skipped: [],
        notes: [],
      },
    } as any);

    mockedReadWorldYiAutonomousCycleLedger.mockReturnValue([
      {
        id: 'cycle_1',
        trigger: 'cron',
        mode: 'full',
        success: true,
        startedAt: '2026-04-20T08:00:00.000Z',
        finishedAt: '2026-04-20T08:10:00.000Z',
        durationMs: 600000,
        phaseKeys: [],
        failedPhaseKeys: [],
        skippedPhaseKeys: [],
        summary: 'cycle ok',
        openAgentBacklogTargets: [],
        updatedAt: '2026-04-20T08:10:00.000Z',
      },
    ] as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('builds a priority queue from fixed checks and behavior evidence', () => {
    const snapshot = buildSiteQualityGovernorSnapshot({
      validationChecks: [
        {
          key: 'test',
          label: 'Jest',
          status: 'passed',
        },
        {
          key: 'build',
          label: 'Build',
          status: 'passed',
        },
      ],
    });

    expect(snapshot.overallScore).toBeLessThan(85);
    expect(snapshot.dimensions.find((item) => item.key === 'interaction_logic')?.score).toBeLessThan(70);
    expect(snapshot.priorityQueue.some((item) => item.key === 'interaction-report-to-chat')).toBe(true);
    expect(snapshot.priorityQueue.some((item) => item.key.includes('interaction-tool-run'))).toBe(true);
    expect(snapshot.wins.length).toBeGreaterThan(0);
  });

  it('caps compatibility when fixed checks are missing', () => {
    const snapshot = buildSiteQualityGovernorSnapshot();
    const compatibility = snapshot.dimensions.find((item) => item.key === 'compatibility');

    expect(compatibility?.score).toBeLessThanOrEqual(75);
    expect(snapshot.priorityQueue.some((item) => item.key === 'compatibility-missing-checks')).toBe(true);
  });
});
