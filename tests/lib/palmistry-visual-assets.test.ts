import {
  PALMISTRY_VISUAL_BATCH_ID,
  buildPalmistryVisualManifest,
} from '@/lib/palmistry-visual-assets';

describe('palmistry visual assets', () => {
  test('builds an SEO/GEO palmistry manifest with strict safety boundaries', () => {
    const manifest = buildPalmistryVisualManifest();

    expect(manifest.batch.id).toBe(PALMISTRY_VISUAL_BATCH_ID);
    expect(manifest.batch.targetCount).toBe(80);
    expect(manifest.assets).toHaveLength(80);
    expect(new Set(manifest.assets.map((asset) => asset.id)).size).toBe(80);
    expect(new Set(manifest.assets.map((asset) => asset.slug)).size).toBe(80);
    expect(new Set(manifest.assets.map((asset) => asset.ratio))).toEqual(new Set(['16:9', '4:5']));

    const first = manifest.assets[0];
    expect(first.prompt).toContain('abstract non-identifiable palm diagram only');
    expect(first.prompt).toContain('文化观察 / 不诊病 / 不定命');
    expect(first.prompt).toContain('No deterministic fate claims');
    expect(first.negativePrompt).toContain('real hand photo');
    expect(first.negativePrompt).toContain('medical diagnosis');
    expect(first.relatedToolSlugs).toContain('application-palmistry-reading');
    expect(first.targetRoutes).toContain('/tools/application-palmistry-reading');
  });

  test('covers overseas Chinese SEO/GEO audiences and core palmistry topics', () => {
    const manifest = buildPalmistryVisualManifest();
    const joined = JSON.stringify(manifest);

    expect(joined).toContain('北美华人');
    expect(joined).toContain('英国欧洲华人');
    expect(joined).toContain('澳新华人');
    expect(joined).toContain('新马华人');
    expect(joined).toContain('生命线');
    expect(joined).toContain('智慧线');
    expect(joined).toContain('感情线');
    expect(joined).toContain('掌丘分区图');
    expect(joined).toContain('palm reading upload');
    expect(joined).toContain('Chinese palmistry chart');
  });
});
