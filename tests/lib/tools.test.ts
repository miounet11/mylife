import { describe, expect, test } from '@jest/globals';
import {
  buildToolPremiumOffer,
  buildToolRecommendations,
  buildToolRunSummary,
  getToolBundleForSlug,
  getToolDefinition,
  listToolBundles,
  listToolCategories,
  listToolDefinitions,
} from '@/lib/tools';

describe('tools catalog', () => {
  test('builds the full tool matrix', () => {
    const tools = listToolDefinitions();
    expect(tools).toHaveLength(120);
    expect(new Set(tools.map((item) => item.slug)).size).toBe(120);
    expect(listToolCategories().map((item) => item.count)).toEqual([20, 20, 20, 15, 15, 15, 8, 7]);
    expect(tools.every((item) => item.hook.trim().length > 0)).toBe(true);
    expect(tools.every((item) => item.freeValueLine.trim().length > 0)).toBe(true);
    expect(tools.every((item) => item.paidValueLine.trim().length > 0)).toBe(true);
    expect(tools.every((item) => item.freeInsights.length >= 3)).toBe(true);
    expect(tools.every((item) => item.premiumModules.length >= 3)).toBe(true);
    expect(tools.every((item) => item.caseStories.length >= 3)).toBe(true);
    expect(tools.every((item) => item.nextToolSlugs.length >= 3)).toBe(true);
    expect(tools.every((item) => item.premiumOutcomes.length >= 3)).toBe(true);
    expect(tools.every((item) => item.objectionAnswers.length >= 3)).toBe(true);
    expect(tools.every((item) => item.faqItems.length >= 3)).toBe(true);
    const curated = tools.filter((item) => item.featuredBadge);
    expect(curated).toHaveLength(20);
    expect(curated.every((item) => item.signaturePromise && item.decisionLens && item.premiumWhyNow)).toBe(true);
  });

  test('returns report-aligned recommendations', () => {
    const recommendations = buildToolRecommendations({
      report: {
        id: 'report_1',
        userId: 'user_1',
        name: '测试用户',
        birthDate: '1990-01-01',
        birthTime: '12:00',
        timezone: 8,
        gender: 'female',
        bazi: {} as any,
        fiveElements: {} as any,
        tenGods: {} as any,
        pattern: { type: '事业结构重排', strength: 'strong', quality: 'good', description: '事业期' },
        fortune: {} as any,
        advice: {} as any,
        evidence: {} as any,
        analysis: {
          opening: '当前事业和岗位节奏需要重新判断。',
          explanation: '你最近更像卡在工作角色和推进方式上。',
        } as any,
      },
      limit: 4,
    });

    expect(recommendations).toHaveLength(4);
    expect(getToolDefinition(recommendations[0].slug)?.category).toBe('career');
  });

  test('builds a deterministic tool summary from report context', () => {
    const tool = getToolDefinition('career-role-fit');
    expect(tool).not.toBeNull();

    const summary = buildToolRunSummary({
      tool: tool!,
      report: {
        id: 'report_2',
        userId: 'user_2',
        name: '李四',
        birthDate: '1991-05-02',
        birthTime: '09:00',
        timezone: 8,
        gender: 'male',
        bazi: {} as any,
        fiveElements: {} as any,
        tenGods: {} as any,
        pattern: { type: '身强格', strength: 'strong', quality: 'good', description: 'test' },
        fortune: {} as any,
        advice: {
          overall: '先围绕一个真实岗位场景缩窄判断范围。',
        } as any,
        evidence: {} as any,
        analysis: {
          opening: '当前最重要的是先把事业节奏排清。',
          explanation: '不要被外界职位光环带跑。',
        } as any,
        reportVersion: 'v1',
      },
      recentSessions: [
        {
          id: 'tool_prev',
          userId: 'user_2',
          toolSlug: 'timing-yearly-window',
          status: 'completed',
          result: {
            headline: '年度主窗口显示：Q2 更值得发力',
            recommendedAction: '把关键动作压到 4-6 月',
          },
          meta: {
            toolTitle: '年度主窗口',
            category: 'timing',
          },
        } as any,
      ],
      note: '我在考虑是否继续留在现岗位',
    });

    expect(summary.headline).toContain('当前最重要的是先把事业节奏排清');
    expect(summary.summary).toContain('我在考虑是否继续留在现岗位');
    expect(summary.summary).toContain('最近已经做过 1 个单项工具');
    expect(summary.premiumPreview.length).toBeGreaterThan(0);
  });

  test('exposes bundle and premium offer metadata', () => {
    const bundle = getToolBundleForSlug('career-role-fit');
    const tool = getToolDefinition('career-role-fit');
    const offer = buildToolPremiumOffer(tool!);

    expect(listToolBundles().length).toBeGreaterThan(0);
    expect(bundle?.toolSlugs).toContain('career-role-fit');
    expect(offer.title).toContain('深测版');
    expect(offer.subscribeTags).toContain('tool:career-role-fit');
  });
});
