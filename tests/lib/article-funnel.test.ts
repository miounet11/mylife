import { computeArticleFunnel } from '@/lib/seo/article-funnel';

describe('computeArticleFunnel', () => {
  it('computes view→impressed→clicked→started conversion correctly', () => {
    const events = [
      { event_name: 'knowledge_article_viewed', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
      { event_name: 'knowledge_article_viewed', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
      { event_name: 'article_cta_impressed', meta: '{"surfaceKey":"knowledge_article:a","slug":"a","position":"inline"}' },
      { event_name: 'article_cta_clicked', meta: '{"surfaceKey":"knowledge_article:a","slug":"a","position":"inline"}' },
      { event_name: 'content_quick_analyze_started', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
    ];

    const result = computeArticleFunnel(events);
    expect(result.totals.views).toBe(2);
    expect(result.totals.impressed).toBe(1);
    expect(result.totals.clicked).toBe(1);
    expect(result.totals.started).toBe(1);
    expect(result.conversionRate).toBeCloseTo(0.5, 2);
  });

  it('handles 0 views without divide-by-zero', () => {
    const result = computeArticleFunnel([]);
    expect(result.totals.views).toBe(0);
    expect(result.conversionRate).toBe(0);
  });

  it('groups by surfaceKey for top articles', () => {
    const events = [
      { event_name: 'knowledge_article_viewed', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
      { event_name: 'knowledge_article_viewed', meta: '{"surfaceKey":"knowledge_article:b","slug":"b"}' },
      { event_name: 'content_quick_analyze_started', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
    ];
    const result = computeArticleFunnel(events);
    const topA = result.bySurface.find((s) => s.surfaceKey === 'knowledge_article:a');
    expect(topA?.views).toBe(1);
    expect(topA?.started).toBe(1);
  });
});
