import { describe, expect, test } from '@jest/globals';
import { appendToolMemoryToNarrative, summarizeToolSessions } from '@/lib/tool-context';

describe('tool-context', () => {
  test('summarizes recent tool sessions for reuse', () => {
    const summary = summarizeToolSessions([
      {
        id: 'tool_1',
        userId: 'user_1',
        toolSlug: 'career-role-fit',
        status: 'completed',
        result: {
          headline: '岗位匹配显示：当前应该先重排职业节奏',
          recommendedAction: '先收窄到一个岗位决策',
        },
        meta: {
          toolTitle: '岗位匹配',
          category: 'career',
        },
      },
      {
        id: 'tool_2',
        userId: 'user_1',
        toolSlug: 'timing-yearly-window',
        status: 'completed',
        result: {
          headline: '年度窗口显示：Q2 更适合推进',
          recommendedAction: '把关键动作压到 4-6 月',
        },
        meta: {
          toolTitle: '年度主窗口',
          category: 'timing',
        },
      },
    ] as any, null, 5);

    expect(summary).not.toBeNull();
    expect(summary?.focusAreas).toEqual(['career', 'timing']);
    expect(summary?.summary).toContain('最近已经做过 2 个单项工具');
  });

  test('appends tool memory to narrative text', () => {
    const appended = appendToolMemoryToNarrative('原始解释', {
      summary: '已有工具上下文',
      focusAreas: ['career'],
      evidence: [],
      recentSessions: [
        {
          id: 'tool_1',
          toolSlug: 'career-role-fit',
          toolTitle: '岗位匹配',
          category: 'career',
          headline: '岗位匹配显示：先排事业节奏',
          recommendedAction: '先缩窄目标岗位',
        },
      ],
    });

    expect(appended).toContain('原始解释');
    expect(appended).toContain('历史工具上下文');
    expect(appended).toContain('岗位匹配');
  });
});
