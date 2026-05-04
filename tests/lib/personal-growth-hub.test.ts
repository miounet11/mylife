import { buildPersonalGrowthHub } from '@/lib/personal-growth-hub';
import type { FortuneRecord, ReportJourneyEventRecord, ToolSessionRecord } from '@/lib/user-types';

function makeReport() {
  return {
    id: 'report_growth_test',
    userId: 'user_growth_test',
    name: '测试用户',
    birthDate: '1990-01-01',
    birthTime: '08:00',
    timezone: 8,
    gender: 'female',
    bazi: {} as any,
    fiveElements: {} as any,
    tenGods: {} as any,
    pattern: {
      type: '事业结构',
      strength: 'strong',
      quality: 'good',
      description: '事业主线。',
    },
    fortune: {} as any,
    advice: {
      career: '事业优先。',
      wealth: '财富守住。',
    } as any,
    evidence: {} as any,
    analysis: {
      opening: '当前事业节奏明显。',
      explanation: '岗位和组织压力是重点。',
    } as any,
  } as FortuneRecord;
}

describe('personal growth hub', () => {
  it('prioritizes the latest report journey selected tool over inferred recommendations', () => {
    const summary = buildPersonalGrowthHub({
      reports: [makeReport()],
      toolSessions: [{
        id: 'tool_session_old',
        userId: 'user_growth_test',
        toolSlug: 'career-role-fit',
      }] as ToolSessionRecord[],
      journeyEvents: [{
        id: 'rje_1',
        userId: 'user_growth_test',
        reportId: 'report_growth_test',
        workflowId: 'report-journey-v1',
        layerKey: 'category-report',
        actionTarget: 'report_journey_primary_category',
        category: 'relationship',
        toolSlug: 'relationship-pace-fit',
      }] as ReportJourneyEventRecord[],
    });

    expect(summary.primaryTool?.slug).toBe('relationship-pace-fit');
    expect(summary.focusLine).toContain('主动点进');
  });
});
