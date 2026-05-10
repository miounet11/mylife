import { findInjectionPoint, ARTICLE_CTA_COPY, isArticleCtaEnabled } from '@/lib/article-cta';

describe('findInjectionPoint', () => {
  it('returns 2 (after 3rd section) when sections >= 4 and total chars >= 800', () => {
    const sections = [
      { content: 'a'.repeat(300) },
      { content: 'b'.repeat(300) },
      { content: 'c'.repeat(300) },
      { content: 'd'.repeat(300) },
    ];
    expect(findInjectionPoint(sections)).toEqual({ injectAfterIndex: 2 });
  });

  it('returns -1 when sections < 4', () => {
    const sections = [
      { content: 'a'.repeat(500) },
      { content: 'b'.repeat(500) },
      { content: 'c'.repeat(500) },
    ];
    expect(findInjectionPoint(sections)).toEqual({ injectAfterIndex: -1 });
  });

  it('returns -1 when total chars < 800', () => {
    const sections = [
      { content: 'a'.repeat(50) },
      { content: 'b'.repeat(50) },
      { content: 'c'.repeat(50) },
      { content: 'd'.repeat(50) },
    ];
    expect(findInjectionPoint(sections)).toEqual({ injectAfterIndex: -1 });
  });

  it('returns -1 when any section has meta.inlineCtaSuppressed=true', () => {
    const sections = [
      { content: 'a'.repeat(300) },
      { content: 'b'.repeat(300) },
      { content: 'c'.repeat(300), meta: { inlineCtaSuppressed: true } },
      { content: 'd'.repeat(300) },
    ];
    expect(findInjectionPoint(sections)).toEqual({ injectAfterIndex: -1 });
  });

  it('handles empty sections', () => {
    expect(findInjectionPoint([])).toEqual({ injectAfterIndex: -1 });
  });
});

describe('ARTICLE_CTA_COPY', () => {
  it('has knowledge / case / insight inline+sticky 文案', () => {
    for (const k of ['knowledge', 'case', 'insight'] as const) {
      expect(ARTICLE_CTA_COPY[k].inline.headline).toBeTruthy();
      expect(ARTICLE_CTA_COPY[k].inline.subline).toBeTruthy();
      expect(ARTICLE_CTA_COPY[k].inline.button).toBeTruthy();
      expect(ARTICLE_CTA_COPY[k].sticky.headline).toBeTruthy();
      expect(ARTICLE_CTA_COPY[k].sticky.button).toBeTruthy();
    }
  });
});

describe('isArticleCtaEnabled', () => {
  const original = process.env.NEXT_PUBLIC_ARTICLE_CTA_V1;
  afterEach(() => {
    process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 = original;
  });

  it('returns true when env=1', () => {
    process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 = '1';
    expect(isArticleCtaEnabled()).toBe(true);
  });

  it('returns false when env=0 or undefined', () => {
    process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 = '0';
    expect(isArticleCtaEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 = undefined;
    expect(isArticleCtaEnabled()).toBe(false);
  });
});
