import { describe, expect, test } from '@jest/globals';
import {
  getKnowledgeArticleBySlug,
  getManagedContentEntryBySlug,
  isPublicKnowledgeEntry,
} from '@/lib/content-store';
import { getVisualAssetsForContentEntry } from '@/lib/visual-asset-library';

const p0Articles = [
  {
    slug: 'palmistry-photo-upload-guide',
    expectedAsset: 'PALM-SEOGEO-017',
    expectedText: '无滤镜',
  },
  {
    slug: 'palmistry-reading-boundaries',
    expectedAsset: 'PALM-SEOGEO-018',
    expectedText: '不判断寿命',
  },
  {
    slug: 'palmistry-three-major-lines-guide',
    expectedAsset: 'PALM-SEOGEO-001',
    expectedText: '不判断寿命',
  },
  {
    slug: 'overseas-chinese-palmistry-reading-upload',
    expectedAsset: 'PALM-SEOGEO-077',
    expectedText: 'Palm Reading Upload',
  },
];

describe('palmistry P0 SEO/GEO content', () => {
  test('publishes the P0 knowledge entry set with palmistry upload journeys', () => {
    for (const articleConfig of p0Articles) {
      const entry = getManagedContentEntryBySlug('knowledge', articleConfig.slug);
      const article = getKnowledgeArticleBySlug(articleConfig.slug);

      expect(entry).toBeTruthy();
      expect(article).toBeTruthy();
      expect(isPublicKnowledgeEntry(entry!)).toBe(true);
      expect(entry?.meta?.contentBatch).toBe('palmistry-seo-geo-p0-2026-05-05');
      expect(entry?.meta?.relatedToolSlugs).toContain('application-palmistry-reading');
      expect(JSON.stringify(entry?.meta?.geoOptimization)).toContain('Palm Reading');

      const text = article!.sections
        .flatMap((section) => section.paragraphs)
        .join('\n');
      expect(text).toContain(articleConfig.expectedText);
      expect(text).toContain('不诊病');
    }
  });

  test('binds approved palmistry visual assets to every P0 article', () => {
    for (const articleConfig of p0Articles) {
      const entry = getManagedContentEntryBySlug('knowledge', articleConfig.slug);
      const assets = getVisualAssetsForContentEntry(entry!, 3);

      expect(assets.length).toBeGreaterThanOrEqual(3);
      expect(assets[0]?.id).toBe(articleConfig.expectedAsset);
      expect(assets.every((asset) => asset.publicUrl.includes('/images/visual-assets/palmistry-seo-geo-80-v1/'))).toBe(true);
      expect(assets.every((asset) => asset.relatedToolSlugs.includes('application-palmistry-reading'))).toBe(true);
    }
  });
});
