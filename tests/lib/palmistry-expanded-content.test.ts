import { describe, expect, test } from '@jest/globals';
import {
  getKnowledgeArticleBySlug,
  getManagedContentEntryBySlug,
  isPublicKnowledgeEntry,
  listManagedContentEntries,
} from '@/lib/content-store';
import { getVisualAssetsForContentEntry } from '@/lib/visual-asset-library';

const batchKey = 'palmistry-seo-geo-p1-p3-2026-05-05';

const expandedArticles = [
  { slug: 'palmistry-life-line-boundary-guide', priority: 'P1', expectedAsset: 'PALM-SEOGEO-002', expectedText: '不判断寿命' },
  { slug: 'palmistry-head-line-thinking-guide', priority: 'P1', expectedAsset: 'PALM-SEOGEO-003', expectedText: '不是人格诊断' },
  { slug: 'palmistry-heart-line-expression-guide', priority: 'P1', expectedAsset: 'PALM-SEOGEO-004', expectedText: '不判断婚姻结果' },
  { slug: 'palmistry-fate-line-career-boundary', priority: 'P1', expectedAsset: 'PALM-SEOGEO-005', expectedText: '不定职业成败' },
  { slug: 'palmistry-mercury-health-line-boundary', priority: 'P1', expectedAsset: 'PALM-SEOGEO-007', expectedText: '不做疾病判断' },
  { slug: 'palmistry-marriage-line-boundary', priority: 'P1', expectedAsset: 'PALM-SEOGEO-008', expectedText: '不定婚姻结果' },
  { slug: 'palmistry-wealth-line-boundary', priority: 'P1', expectedAsset: 'PALM-SEOGEO-009', expectedText: '不承诺财富结果' },
  { slug: 'palmistry-palm-mounts-map-guide', priority: 'P1', expectedAsset: 'PALM-SEOGEO-010', expectedText: '掌丘分区' },
  { slug: 'palmistry-five-element-hand-shape-guide', priority: 'P1', expectedAsset: 'PALM-SEOGEO-015', expectedText: '五行手型' },
  { slug: 'palmistry-left-right-dominant-hand-guide', priority: 'P1', expectedAsset: 'PALM-SEOGEO-016', expectedText: '惯用手' },
  { slug: 'palmistry-non-deterministic-report-guide', priority: 'P1', expectedAsset: 'PALM-SEOGEO-020', expectedText: '非定命' },
  { slug: 'palmistry-bilingual-terms-guide', priority: 'P1', expectedAsset: 'PALM-SEOGEO-019', expectedText: 'Palm Lines' },
  { slug: 'north-america-chinese-palmistry-reading', priority: 'P2', expectedAsset: 'PALM-SEOGEO-017', expectedText: '北美华人' },
  { slug: 'uk-europe-chinese-palmistry-reading', priority: 'P2', expectedAsset: 'PALM-SEOGEO-037', expectedText: '英国欧洲华人' },
  { slug: 'australia-new-zealand-chinese-palmistry-reading', priority: 'P2', expectedAsset: 'PALM-SEOGEO-057', expectedText: '澳新华人' },
  { slug: 'singapore-malaysia-chinese-palmistry-reading', priority: 'P2', expectedAsset: 'PALM-SEOGEO-077', expectedText: '新马华人' },
  { slug: 'palmistry-upload-photo-faq', priority: 'P3', expectedAsset: 'PALM-SEOGEO-017', expectedText: '照片质量' },
  { slug: 'palmistry-life-line-not-lifespan', priority: 'P3', expectedAsset: 'PALM-SEOGEO-002', expectedText: '不会把生命线长度、深浅或断续解释成寿命长短' },
  { slug: 'palmistry-health-line-not-diagnosis', priority: 'P3', expectedAsset: 'PALM-SEOGEO-007', expectedText: '不做疾病、器官状态或治疗建议判断' },
  { slug: 'palmistry-marriage-line-not-marriage-result', priority: 'P3', expectedAsset: 'PALM-SEOGEO-008', expectedText: '不用于判断结婚次数' },
  { slug: 'palmistry-wealth-line-not-get-rich-proof', priority: 'P3', expectedAsset: 'PALM-SEOGEO-009', expectedText: '不是发财证明' },
  { slug: 'palmistry-left-hand-right-hand-faq', priority: 'P3', expectedAsset: 'PALM-SEOGEO-016', expectedText: '优先上传惯用手' },
  { slug: 'palmistry-palm-mounts-faq', priority: 'P3', expectedAsset: 'PALM-SEOGEO-010', expectedText: '掌心位置地图' },
  { slug: 'palmistry-report-quality-checklist', priority: 'P3', expectedAsset: 'PALM-SEOGEO-020', expectedText: '质量清单' },
];

describe('palmistry expanded P1-P3 SEO/GEO content', () => {
  test('publishes the expanded palmistry knowledge batch with priority metadata', () => {
    const entries = listManagedContentEntries().filter((entry) => entry.meta?.contentBatch === batchKey);

    expect(entries).toHaveLength(24);
    expect(entries.filter((entry) => entry.meta?.contentPriority === 'P1')).toHaveLength(12);
    expect(entries.filter((entry) => entry.meta?.contentPriority === 'P2')).toHaveLength(4);
    expect(entries.filter((entry) => entry.meta?.contentPriority === 'P3')).toHaveLength(8);

    for (const articleConfig of expandedArticles) {
      const entry = getManagedContentEntryBySlug('knowledge', articleConfig.slug);
      const article = getKnowledgeArticleBySlug(articleConfig.slug);

      expect(entry).toBeTruthy();
      expect(article).toBeTruthy();
      expect(isPublicKnowledgeEntry(entry!)).toBe(true);
      expect(entry?.meta?.contentBatch).toBe(batchKey);
      expect(entry?.meta?.contentPriority).toBe(articleConfig.priority);
      expect(entry?.meta?.publicationMode).toBe('parallel_prepare_serial_sqlite_write');
      expect(entry?.meta?.relatedToolSlugs).toContain('application-palmistry-reading');
      expect(JSON.stringify(entry?.meta?.geoOptimization)).toContain('Chinese Palmistry');

      const text = [
        article!.title,
        article!.excerpt,
        article!.seoTitle,
        article!.seoDescription,
        ...article!.sections.flatMap((section) => [section.title, ...section.paragraphs]),
      ].join('\n');
      expect(text).toContain(articleConfig.expectedText);
      expect(text).toContain('不诊病');
      expect(text).toContain('不判断寿命');
      expect(text).toContain('不定命');
    }
  });

  test('binds approved palmistry visual assets to every expanded article', () => {
    for (const articleConfig of expandedArticles) {
      const entry = getManagedContentEntryBySlug('knowledge', articleConfig.slug);
      const assets = getVisualAssetsForContentEntry(entry!, 4);

      expect(assets.length).toBeGreaterThanOrEqual(3);
      expect(assets[0]?.id).toBe(articleConfig.expectedAsset);
      expect(assets.every((asset) => asset.id.startsWith('PALM-SEOGEO-'))).toBe(true);
      expect(assets.every((asset) => asset.publicUrl.includes('/images/visual-assets/palmistry-seo-geo-80-v1/'))).toBe(true);
      expect(assets.every((asset) => asset.relatedToolSlugs.includes('application-palmistry-reading'))).toBe(true);
    }
  });
});
