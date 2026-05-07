import {
  HOME_LAYOUT_DIAGNOSIS_BRAND_PACK_ID,
  HOME_LAYOUT_DIAGNOSIS_LIBRARY_KEY,
  HOME_LAYOUT_DIAGNOSIS_VISUAL_BATCH_ID,
  buildHomeLayoutDiagnosisVisualManifest,
} from '@/lib/home-layout-diagnosis-visual-assets';

describe('home layout diagnosis visual assets', () => {
  const manifest = buildHomeLayoutDiagnosisVisualManifest();

  it('builds a 200-asset manifest for the home layout diagnosis library', () => {
    expect(manifest.batch).toMatchObject({
      id: HOME_LAYOUT_DIAGNOSIS_VISUAL_BATCH_ID,
      libraryKey: HOME_LAYOUT_DIAGNOSIS_LIBRARY_KEY,
      module: 'MINGLI',
      targetCount: 200,
      model: 'gpt-image-2',
      brandPackId: HOME_LAYOUT_DIAGNOSIS_BRAND_PACK_ID,
    });
    expect(manifest.assets).toHaveLength(200);
  });

  it('keeps ids and slugs unique and uses both desktop and mobile ratios', () => {
    expect(new Set(manifest.assets.map((asset) => asset.id)).size).toBe(200);
    expect(new Set(manifest.assets.map((asset) => asset.slug)).size).toBe(200);
    expect(new Set(manifest.assets.map((asset) => asset.ratio))).toEqual(new Set(['16:9', '9:16']));
    expect(manifest.assets.every((asset) => asset.targetRoutes?.includes('/tools/application-home-order'))).toBe(true);
    expect(manifest.assets.every((asset) => asset.targetRoutes?.includes('/chat'))).toBe(true);
  });

  it('covers mainstream overseas Chinese floor-plan archetypes and issue themes', () => {
    const prompts = manifest.assets.map((asset) => asset.prompt).join('\n');
    const layoutKeys = new Set(manifest.assets.map((asset) => `${asset.meta?.layoutKey || ''}`));
    const issueKeys = new Set(manifest.assets.map((asset) => `${asset.meta?.issueKey || ''}`));

    expect(layoutKeys.size).toBe(20);
    expect(issueKeys.size).toBe(10);
    expect(prompts).toContain('Overseas Chinese users');
    expect(prompts).toContain('condos, townhouses, single-family homes, basement suites, studios, lofts, duplexes');
    expect(prompts).toContain('North America, Australia, the UK, Singapore, Malaysia');
  });

  it('locks required diagnosis prompt modules and safety boundaries', () => {
    const prompt = manifest.assets[0].prompt || '';

    expect(prompt).toContain('户型问题诊断图');
    expect(prompt).toContain('HOME LAYOUT ISSUE DIAGNOSIS');
    expect(prompt).toContain('方向假设：上北下南，左西右东，仅供结构分析参考');
    expect(prompt).toContain('核心问题清单');
    expect(prompt).toContain('因果链');
    expect(prompt).toContain('优先级');
    expect(prompt).toContain('低成本调整');
    expect(prompt).toContain('7-21 天观察');
    expect(prompt).toContain('Text density contract');
    expect(prompt).toContain('Do not render paragraph blocks');
    expect(prompt).toContain('icon node -> icon node -> icon node');
    expect(prompt).toContain('门线冲');
    expect(prompt).toContain('动静分区');
    expect(prompt).toContain('洁污分区');
    expect(prompt).toContain('穿堂动线');
    expect(prompt).toContain('不要使用大吉、大凶、必灾、注定');
    expect(prompt).toContain('Do not invent external roads, bridges, hospitals, schools, floor level, resident identity');
  });
});
