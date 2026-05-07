import {
  MINGLI_SEO_GEO_EXPANSION_BATCH_ID,
  MINGLI_SEO_GEO_EXPANSION_BRAND_PACK_ID,
  MINGLI_SEO_GEO_EXPANSION_LIBRARY_KEY,
  buildMingliSeoGeoExpansionVisualManifest,
} from '@/lib/mingli-seo-geo-expansion-visual-assets';

describe('mingli seo/geo expansion visual assets', () => {
  const manifest = buildMingliSeoGeoExpansionVisualManifest();

  it('builds the 143-asset expansion batch for the 500 visual plan', () => {
    expect(manifest.batch).toMatchObject({
      id: MINGLI_SEO_GEO_EXPANSION_BATCH_ID,
      libraryKey: MINGLI_SEO_GEO_EXPANSION_LIBRARY_KEY,
      module: 'MINGLI',
      targetCount: 143,
      model: 'gpt-image-2',
      brandPackId: MINGLI_SEO_GEO_EXPANSION_BRAND_PACK_ID,
    });
    expect(manifest.assets).toHaveLength(143);
    expect(manifest.batch.meta?.targetTotalPlan).toBe(500);
  });

  it('keeps ids and slugs unique across themes and audiences', () => {
    expect(new Set(manifest.assets.map((asset) => asset.id)).size).toBe(143);
    expect(new Set(manifest.assets.map((asset) => asset.slug)).size).toBe(143);
    expect(new Set(manifest.assets.map((asset) => asset.ratio))).toEqual(new Set(['16:9', '4:5']));
    expect(new Set(manifest.assets.map((asset) => `${asset.meta?.themeKey || ''}`)).size).toBe(13);
    expect(new Set(manifest.assets.map((asset) => `${asset.meta?.audienceKey || ''}`)).size).toBe(11);
  });

  it('covers SEO/GEO topics, overseas audiences and tool routes', () => {
    const joined = JSON.stringify(manifest);

    expect(joined).toContain('八字第一份报告怎么看');
    expect(joined).toContain('流年运势窗口');
    expect(joined).toContain('起名五行与用字');
    expect(joined).toContain('奇门决策地图');
    expect(joined).toContain('家居风水动线');
    expect(joined).toContain('美国加拿大华人');
    expect(joined).toContain('海外留学生');
    expect(joined).toContain('多代同住家庭');
    expect(joined).toContain('BaZi report online');
    expect(joined).toContain('Qi Men Dun Jia reading');
    expect(joined).toContain('application-home-order');
    expect(joined).toContain('application-timing-selection');
  });

  it('locks image text, brand and safety prompt contracts', () => {
    const prompt = manifest.assets[0].prompt || '';
    const negativePrompt = manifest.assets[0].negativePrompt || '';

    expect(prompt).toContain('Required in-image text');
    expect(prompt).toContain('Text density contract');
    expect(prompt).toContain('世界易 / 人生K线 · www.life-kline.com');
    expect(prompt).toContain('文化观察 / 不定命 / 可复盘');
    expect(prompt).toContain('No deterministic fate claims');
    expect(prompt).toContain('No guaranteed wealth, relationship, career, exam, immigration or real-estate outcome');
    expect(negativePrompt).toContain('medical diagnosis');
    expect(negativePrompt).toContain('garbled Chinese text');
  });
});
