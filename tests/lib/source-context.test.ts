import { describe, expect, test } from '@jest/globals';
import { deleteManagedContentEntry, saveManagedContentEntry } from '@/lib/content-store';
import { appendSourceToHref, buildSourceCtaStrategy, buildSourceJourneyCopy, getSourceContext } from '@/lib/source-context';

describe('source context', () => {
  test('parses lifecycle report followup source from knowledge content', () => {
    const id = 'content_test_source_context_knowledge';

    try {
      saveManagedContentEntry({
        id,
        contentType: 'knowledge',
        subtype: null,
        slug: 'career-plan-source-context',
        title: '职业规划文章',
        name: null,
        excerpt: '用于测试来源上下文。',
        category: '事业判断',
        readTime: '5 分钟',
        tags: ['事业', '职业'],
        featured: false,
        seoTitle: '职业规划文章',
        seoDescription: '用于测试来源上下文。',
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

      const context = getSourceContext('lifecycle_report_followup:knowledge_article:career-plan-source-context');

      expect(context.isLifecycleRecall).toBe(true);
      expect(context.isKnowledgeSource).toBe(true);
      expect(context.originalSource).toBe('knowledge_article:career-plan-source-context');
      expect(context.shortLabel).toBe('职业规划文章');
      expect(context.reportHeadline).toContain('职业规划文章');
      expect(context.toolDescription).toContain('直接拿到一个可执行结果');
    } finally {
      deleteManagedContentEntry(id);
    }
  });

  test('keeps direct tool detail source readable', () => {
    const context = getSourceContext('tool_detail');

    expect(context.surfaceType).toBe('tool_detail');
    expect(context.guidanceLabel).toBe('工具承接');
    expect(context.reportDescription).toContain('底盘');
  });

  test('keeps nested tool detail source while preserving tool detail semantics', () => {
    const context = getSourceContext('tool_detail:knowledge_article:career-plan-source-context');

    expect(context.surfaceType).toBe('tool_detail');
    expect(context.originalSource).toBe('knowledge_article:career-plan-source-context');
    expect(context.guidanceLabel).toBe('工具承接');
    expect(context.toolHeadline).toContain('工具详情');
  });

  test('appends source to internal href without dropping hash', () => {
    expect(appendSourceToHref('/tools/career?foo=1#runner', 'knowledge_article:career-plan-source-context'))
      .toBe('/tools/career?foo=1&source=knowledge_article%3Acareer-plan-source-context#runner');
  });

  test('does not overwrite an existing source query', () => {
    expect(appendSourceToHref('/tools/career?source=existing', 'knowledge_article:new-source'))
      .toBe('/tools/career?source=existing');
  });

  test('builds source-aware journey copy for content sources', () => {
    const id = 'content_test_source_context_journey_copy';

    try {
      saveManagedContentEntry({
        id,
        contentType: 'knowledge',
        subtype: null,
        slug: 'career-plan-source-context-copy',
        title: '职业规划文章',
        name: null,
        excerpt: '用于测试来源旅程文案。',
        category: '事业判断',
        readTime: '5 分钟',
        tags: ['事业', '职业'],
        featured: false,
        seoTitle: '职业规划文章',
        seoDescription: '用于测试来源旅程文案。',
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

      const copy = buildSourceJourneyCopy('knowledge_article:career-plan-source-context-copy', {
        title: '默认标题',
        description: '默认描述',
      });

      expect(copy.title).toContain('职业规划文章');
      expect(copy.description).toContain('内容线索');
    } finally {
      deleteManagedContentEntry(id);
    }
  });

  test('builds CTA strategy for knowledge sources', () => {
    const strategy = buildSourceCtaStrategy('knowledge_article:career-plan-source-context');

    expect(strategy.strategyKey).toBe('knowledge_to_self_judgment');
    expect(strategy.sourceFamily).toBe('knowledge_article');
    expect(strategy.reportPrimaryLabel).toContain('文章');
    expect(strategy.toolPrimaryLabel).toContain('工具');
    expect(strategy.searchAnalyzeLabel).toContain('结构');
  });

  test('builds CTA strategy for lifecycle recall sources', () => {
    const strategy = buildSourceCtaStrategy('lifecycle_report_followup:knowledge_article:career-plan-source-context');

    expect(strategy.strategyKey).toBe('lifecycle_recall_resume');
    expect(strategy.sourceFamily).toBe('knowledge_article');
    expect(strategy.reportPrimaryLabel).toContain('上次');
    expect(strategy.toolPrimaryLabel).toContain('继续');
    expect(strategy.actionGuide).toContain('回访');
  });

  test('builds CTA strategy for retention workbench sources', () => {
    const profileStrategy = buildSourceCtaStrategy('profile_page');
    const historyStrategy = buildSourceCtaStrategy('history_drift_review');
    const eventsStrategy = buildSourceCtaStrategy('important_events_drift');

    expect(profileStrategy.strategyKey).toBe('retention_workbench_resume');
    expect(profileStrategy.sourceFamily).toBe('profile_page');
    expect(historyStrategy.sourceFamily).toBe('history_page');
    expect(eventsStrategy.sourceFamily).toBe('events_page');
    expect(profileStrategy.actionGuide).toContain('复访工作台');
  });
});
