import { describe, expect, test } from '@jest/globals';
import sitemap from '@/app/sitemap';

describe('sitemap tools coverage', () => {
  test('includes tool center and tool detail pages', () => {
    const entries = sitemap();
    const urls = entries.map((item) => item.url);

    expect(urls).toContain('https://www.life-kline.com/tools');
    expect(urls).toContain('https://www.life-kline.com/tools/category/career');
    expect(urls).toContain('https://www.life-kline.com/tools/career-role-fit');
  });

  test('includes visual asset collection and approved visual asset pages', () => {
    const entries = sitemap();
    const urls = entries.map((item) => item.url);

    expect(urls).toContain('https://www.life-kline.com/visual-assets');
    expect(urls).toContain('https://www.life-kline.com/visual-assets/content-system-map');
  });
});
