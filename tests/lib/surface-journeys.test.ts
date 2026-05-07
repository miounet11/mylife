import { describe, expect, test } from '@jest/globals';
import type { FortuneRecord, ToolSessionRecord } from '@/lib/user-types';
import {
  buildJourneyForContent,
  buildJourneyForReport,
  buildJourneyForTool,
  buildPersonalizedJourney,
} from '@/lib/surface-journeys';
import {
  deleteManagedContentEntry,
  saveManagedContentEntry,
} from '@/lib/content-store';
import { getToolDefinition } from '@/lib/tools';

describe('surface journeys', () => {
  test('buildJourneyForReport returns linked tools and content cards', () => {
    const report = {
      id: 'report_journey_test',
      userId: 'test_user',
      birthDate: '1990-01-01',
      birthTime: '08:00',
      birthPlace: 'Shanghai',
      timezone: 'Asia/Shanghai',
      calendarType: 'solar',
      analysis: {
        opening: '当前事业推进和岗位升级进入新的窗口。',
        explanation: '工作节奏、岗位变化和升职判断需要结合时机。',
      },
      pattern: {
        type: '事业发展',
      },
      advice: {
        overall: '先稳住职业主轴，再拆单项工具。',
        career: '优先看跳槽与升职窗口。',
        wealth: '控制现金流波动。',
        marriage: '保持边界。',
        health: '注意恢复。',
      },
    } as unknown as FortuneRecord;

    const journey = buildJourneyForReport(report, { source: 'knowledge_article:career-plan-source-context' });
    expect(journey.toolCards.length).toBeGreaterThan(0);
    expect(journey.knowledgeCards.length).toBeGreaterThan(0);
    expect(journey.caseCards.length).toBeGreaterThan(0);
    expect(journey.toolCards[0]?.href).toContain('source=');
  });

  test('shared journeys expose at least two related items per content column when inventory exists', () => {
    const tool = getToolDefinition('application-palmistry-reading') || getToolDefinition('career-timing-window');

    expect(tool).toBeTruthy();
    const journey = buildJourneyForTool(tool!);

    expect(journey.toolCards.length).toBeGreaterThanOrEqual(2);
    expect(journey.knowledgeCards.length).toBeGreaterThanOrEqual(2);
    expect(journey.caseCards.length).toBeGreaterThanOrEqual(2);
  });

  test('buildJourneyForContent respects manual related slugs before inferred pool', () => {
    const knowledgeId = 'content_test_surface_journey_knowledge';
    const caseId = 'content_test_surface_journey_case';
    const sourceId = 'content_test_surface_journey_manual_source';

    try {
      saveManagedContentEntry({
        id: knowledgeId,
        contentType: 'knowledge',
        subtype: null,
        slug: 'surface-journey-manual-knowledge',
        title: '职场判断知识页',
        name: null,
        excerpt: '围绕事业、岗位和职业判断的知识内容。',
        category: '事业判断',
        readTime: '6 分钟',
        tags: ['事业', '岗位', '职业'],
        featured: false,
        seoTitle: '职场判断知识页',
        seoDescription: '职场判断知识页描述。',
        sections: [
          { title: 'A', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'B', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'C', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'D', paragraphs: ['内容完整。', '内容完整。'] },
        ],
        status: 'published',
        source: 'cms',
        meta: {},
      }, 'test_user');

      saveManagedContentEntry({
        id: caseId,
        contentType: 'case',
        subtype: null,
        slug: 'surface-journey-manual-case',
        title: '职场判断案例页',
        name: null,
        excerpt: '围绕事业、升职和岗位节奏的案例内容。',
        category: '事业判断',
        readTime: null,
        tags: ['事业', '升职', '岗位'],
        featured: false,
        seoTitle: '职场判断案例页',
        seoDescription: '职场判断案例页描述。',
        sections: [
          { title: 'A', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'B', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'C', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'D', paragraphs: ['内容完整。', '内容完整。'] },
        ],
        status: 'published',
        source: 'cms',
        meta: {},
      }, 'test_user');

      const stored = saveManagedContentEntry({
        id: sourceId,
        contentType: 'knowledge',
        subtype: null,
        slug: 'surface-journey-manual-source',
        title: '手动指定内容',
        name: null,
        excerpt: '验证手动 slug 优先级。',
        category: '事业判断',
        readTime: '5 分钟',
        tags: ['事业', '岗位'],
        featured: false,
        seoTitle: '手动指定内容',
        seoDescription: '验证手动 slug 优先级。',
        sections: [
          { title: 'A', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'B', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'C', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'D', paragraphs: ['内容完整。', '内容完整。'] },
        ],
        status: 'published',
        source: 'cms',
        meta: {
          relatedKnowledgeSlugs: ['surface-journey-manual-knowledge'],
          relatedCaseSlugs: ['surface-journey-manual-case'],
        },
      }, 'test_user');

      const storedJourney = buildJourneyForContent({
        contentType: 'knowledge',
        slug: stored?.slug || 'surface-journey-manual-source',
        title: stored?.title || '手动指定内容',
        excerpt: stored?.excerpt || '验证手动 slug 优先级。',
        category: stored?.category,
        tags: stored?.tags || [],
      });

      expect(storedJourney.toolCards.length).toBeGreaterThan(0);
      expect(storedJourney.knowledgeCards[0]?.href).toBe('/knowledge/surface-journey-manual-knowledge');
      expect(storedJourney.caseCards[0]?.href).toBe('/cases/surface-journey-manual-case');
    } finally {
      deleteManagedContentEntry(knowledgeId);
      deleteManagedContentEntry(caseId);
      deleteManagedContentEntry(sourceId);
    }
  });

  test('buildPersonalizedJourney prefers latest report over latest tool session', () => {
    const reports = [{
      id: 'report_personalized_test',
      pattern: { type: '事业发展' },
      analysis: { opening: '事业推进。', explanation: '岗位升级。' },
      advice: { overall: '先看主测算。', career: '看职业窗口。' },
    }] as unknown as FortuneRecord[];
    const toolSessions = [{
      id: 'tool_session_personalized_test',
      toolSlug: 'career-timing-window',
    }] as unknown as ToolSessionRecord[];

    const summary = buildPersonalizedJourney({
      reports,
      toolSessions,
    });

    expect(summary.heading).toBe('下一步，不该重新从零开始');
    expect(summary.journey.reportCard.href).toBe('/result/report_personalized_test');
    expect(summary.journey.toolCards.length).toBeGreaterThan(0);
  });
});
