import type { FortuneRecord } from '@/lib/user-types';
import { buildLayeredReportJourney } from '@/lib/report-journey-router';

const measurementResults = [
  'pillars',
  'five-elements',
  'day-master-strength',
  'pattern',
  'ten-gods',
  'yong-shen',
  'shen-sha',
  'dayun',
  'kline',
  'domain-advice',
].map((id, index) => ({
  id,
  label: `环节${index + 1}`,
  order: index + 1,
  score: 88,
  level: 'good',
  conclusion: `${id} 稳定`,
}));

function makeReport(overrides: Partial<FortuneRecord> = {}) {
  return {
    id: 'report_journey_router_test',
    userId: 'user_journey_router_test',
    name: '测试用户',
    birthDate: '1990-01-01',
    birthTime: '08:00',
    timezone: 8,
    gender: 'female',
    bazi: {} as any,
    fiveElements: {} as any,
    tenGods: {} as any,
    pattern: {
      type: '事业结构重排',
      strength: 'strong',
      quality: 'good',
      description: '当前事业角色和岗位节奏需要重新判断。',
    },
    fortune: {
      currentDaYun: '甲子运',
      currentLiuNian: '丙午年',
      interaction: '当前阶段重点是岗位推进与组织压力。',
      nextYear: '继续观察事业窗口。',
    },
    advice: {
      overall: '先围绕事业主轴拆行动。',
      career: '当前适合看岗位适配和升职窗口。',
      wealth: '财富先守现金流。',
      marriage: '关系保持边界。',
      health: '注意恢复。',
    } as any,
    evidence: {} as any,
    analysis: {
      opening: '当前事业和岗位节奏需要重新判断。',
      explanation: '工作节奏、岗位变化和升职判断需要结合时机。',
      contextSignals: {
        engineEvidence: {
          version: 'engine-evidence-v2',
          measurementResults,
          stageResults: measurementResults,
        },
      },
    } as any,
    ...overrides,
  } as FortuneRecord;
}

describe('report journey router', () => {
  it('routes a first report into deep report and career category', () => {
    const route = buildLayeredReportJourney({
      report: makeReport(),
      quality: { deliveryTier: 'enhanced', status: 'ready', targetAchieved: true },
      source: 'result_report:test',
    });

    expect(route.workflowId).toBe('report-journey-v1');
    expect(route.primaryAction.href).toBe('#deep-report');
    expect(route.layers.map((item) => item.key)).toEqual([
      'first-report',
      'deep-report',
      'category-report',
      'event-validation',
    ]);
    expect(route.categoryRoutes[0]?.category).toBe('career');
    expect(route.categoryRoutes[0]?.href).toContain('source=');
    expect(route.measurementSummary.totalStages).toBe(10);
    expect(route.measurementSummary.complete).toBe(true);
    expect(route.measurementSummary.stages).toHaveLength(10);
    expect(route.measurementSummary.stages[0]).toMatchObject({
      id: 'pillars',
      order: 1,
      score: 88,
      status: 'strong',
      optimizationHint: '保持当前证据链，优先看下一层组合。',
    });
    expect(route.measurementSummary.strongStages.map((item) => item.id)).toContain('domain-advice');
    expect(route.combinationRoutes[0]?.key).toBe('bazi-evidence-chain');
    expect(route.combinationRoutes.some((item) => item.key === 'event-validation')).toBe(true);
  });

  it('adds palmistry as an application complement after stable measurement chain', () => {
    const route = buildLayeredReportJourney({
      report: makeReport({
        analysis: {
          opening: '当前主报告稳定，可补充手相和多模态观察。',
          explanation: '用户希望用手相图片做应用类辅助参考。',
          contextSignals: {
            engineEvidence: {
              version: 'engine-evidence-v2',
              measurementResults,
            },
          },
        } as any,
      }),
      quality: { deliveryTier: 'expert', status: 'ready', targetAchieved: true },
      source: 'result_report:test',
    });

    const palmistryRoute = route.combinationRoutes.find((item) => item.key === 'palmistry-application');
    expect(palmistryRoute?.href).toContain('/tools/application-palmistry-reading');
    expect(palmistryRoute?.boundary).toContain('不做医学诊断');
  });

  it('prioritizes weak measurement stage before category routing', () => {
    const weakStages = measurementResults.map((stage) => stage.id === 'kline'
      ? { ...stage, label: '大运流年 K 线', score: 50, level: 'risk', conclusion: '流年证据不足' }
      : stage);
    const route = buildLayeredReportJourney({
      report: makeReport({
        analysis: {
          opening: '当前事业和岗位节奏需要重新判断。',
          explanation: '工作节奏、岗位变化和升职判断需要结合时机。',
          contextSignals: {
            engineEvidence: {
              version: 'engine-evidence-v2',
              measurementResults: weakStages,
            },
          },
        } as any,
      }),
      quality: { deliveryTier: 'expert', status: 'ready', targetAchieved: true },
    });

    expect(route.primaryAction.target).toBe('report_journey_deep_report_basic');
    expect(route.primaryAction.description).toContain('大运流年 K 线');
    expect(route.measurementSummary.weakStages[0]?.reason).toBe('流年证据不足');
    expect(route.measurementSummary.optimizationPriorities[0]).toMatchObject({
      id: 'kline',
      label: '大运流年 K 线',
      score: 50,
      optimizationHint: '优先补证据和边界样本，先把这个环节做稳。',
    });
  });

  it('prioritizes validation when user feedback has drift', () => {
    const route = buildLayeredReportJourney({
      report: makeReport(),
      validation: { totalLinkedEvents: 2, driftCount: 1, accurateCount: 0, pendingCount: 1 },
    });

    expect(route.primaryAction.href).toBe('#validation');
    expect(route.primaryAction.target).toBe('report_journey_validation');
    expect(route.layers.find((item) => item.key === 'event-validation')?.status).toBe('watch');
    expect(route.correctionHint).toContain('偏差');
  });

  it('keeps basic reports on deep explanation before category routing', () => {
    const route = buildLayeredReportJourney({
      report: makeReport({
        analysis: {
          opening: '当前关系和伴侣节奏需要重新判断。',
          explanation: '感情、婚姻和关系边界需要结合当前阶段看。',
        } as any,
        pattern: {
          type: '关系边界',
          strength: 'neutral',
          quality: 'watch',
          description: '关系边界和阶段节奏是重点。',
        },
      }),
      quality: { deliveryTier: 'basic', status: 'watch', targetAchieved: false },
    });

    expect(route.primaryAction.target).toBe('report_journey_deep_report_basic');
    expect(route.primaryAction.href).toBe('#deep-report');
    expect(route.categoryRoutes[0]?.category).toBe('relationship');
  });
});
