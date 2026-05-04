import { parseVisualAssetWorkflow } from '@/lib/visual-asset-workflow';
import { readImageBase64FromProviderResponse, readImageUrlFromProviderResponse } from '@/lib/visual-asset-orchestrator';
import { buildVisualAssetPrompt, evaluateVisualAssetAutoQa } from '@/lib/visual-assets';

describe('visual asset workflow', () => {
  it('parses workflow defaults and typed runtime settings', () => {
    const workflow = parseVisualAssetWorkflow({
      id: 'custom-workflow',
      runtime: {
        maxConcurrentImageJobs: 30,
        maxAttempts: 3,
      },
      stages: {
        publishToR2: true,
      },
      storage: {
        localPublicRoot: 'public/custom-assets',
      },
    });

    expect(workflow.id).toBe('custom-workflow');
    expect(workflow.runtime.maxConcurrentImageJobs).toBe(30);
    expect(workflow.runtime.maxConcurrentNarrativeJobs).toBe(4);
    expect(workflow.runtime.maxAttempts).toBe(3);
    expect(workflow.stages.publishToR2).toBe(true);
    expect(workflow.storage.localPublicRoot).toBe('public/custom-assets');
    expect(workflow.providers.image.defaultModel).toBe('gpt-image-2');
    expect(workflow.providers.image.coreModel).toBe('gpt-image-2-pro');
  });

  it('extracts provider image urls from json, markdown and raw text', () => {
    expect(readImageUrlFromProviderResponse({ image_url: 'https://example.com/a.png' })).toBe('https://example.com/a.png');
    expect(readImageUrlFromProviderResponse({ data: [{ url: 'https://example.com/b.png' }] })).toBe('https://example.com/b.png');
    expect(readImageUrlFromProviderResponse({}, '![image](https://example.com/c.png)')).toBe('https://example.com/c.png');
    expect(readImageUrlFromProviderResponse({}, 'created: https://example.com/d.png')).toBe('https://example.com/d.png');
    expect(readImageUrlFromProviderResponse({}, 'no url')).toBe('');
  });

  it('extracts provider base64 image payloads from json and data urls', () => {
    expect(readImageBase64FromProviderResponse({ b64_json: 'YWJj' })).toEqual({
      b64Json: 'YWJj',
      contentType: 'image/png',
    });
    expect(readImageBase64FromProviderResponse({ data: [{ b64_json: 'ZGVm' }] })).toEqual({
      b64Json: 'ZGVm',
      contentType: 'image/png',
    });
    expect(readImageBase64FromProviderResponse({}, 'data:image/webp;base64, Z2hp ')).toEqual({
      b64Json: 'Z2hp',
      contentType: 'image/webp',
    });
    expect(readImageBase64FromProviderResponse({}, 'no image')).toBeNull();
  });

  it('builds prompts that require generated readable image text and compact brand signature', () => {
    const prompt = buildVisualAssetPrompt({
      title: '测试图',
      slug: 'test-visual',
      overlayCopySimplified: '世界易结构图',
      overlayCopyTraditional: '世界易結構圖',
      size: '2048x1152',
    } as any);

    expect(prompt).toContain('Required in-image text');
    expect(prompt).toContain('世界易结构图');
    expect(prompt).toContain('www.life-kline.com');
    expect(prompt).toContain('4-7%');
  });

  it('records file-size warnings when provider returns smaller images than requested', () => {
    const prompt = buildVisualAssetPrompt({
      title: '测试图',
      slug: 'test-visual',
      overlayCopySimplified: '世界易结构图',
      size: '2048x1152',
    } as any);

    const qa = evaluateVisualAssetAutoQa({
      id: 'visual_test_size_warning',
      assetType: 'brand_pad',
      module: 'TEST',
      batchId: 'test',
      slug: 'visual-test-size-warning',
      title: '测试图',
      prompt,
      negativePrompt: '',
      model: 'gpt-image-2',
      size: '2048x1152',
      ratio: '16:9',
      quality: 'medium',
      sourceImageIds: [],
      brandReferenceIds: [],
      outputPath: '/tmp/test.png',
      publicUrl: '/images/test.png',
      altText: '测试图',
      narrativeSections: [],
      targetRoutes: [],
      relatedContentSlugs: [],
      relatedToolSlugs: [],
      relatedReportThemes: [],
      status: 'generated',
      qaStatus: 'needs_review',
      qaScore: 0,
      qaNotes: {},
      correctionCount: 0,
      version: 1,
      meta: {},
    }, {
      actualImageWidth: 1672,
      actualImageHeight: 941,
      storageBytes: 200000,
      contentType: 'image/png',
    });

    expect(qa.errorCodes).not.toContain('IMAGE_ASPECT_RATIO_MISMATCH');
    expect(qa.warnings).toContain('IMAGE_SIZE_LOWER_THAN_REQUESTED');
    expect(qa.status).toBe('needs_review');
  });
});
