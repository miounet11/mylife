import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  assertToolGeoReady,
  buildToolJsonLdGraph,
  buildToolPageMetadata,
  getToolSeoGeoPack,
  listToolSeoGeoPacks,
  toolPackToGeoMeta,
} from '@/lib/tools/tool-seo-geo';
import { isGeoReadySoft } from '@/lib/content-geo';

describe('tool SEO/GEO packs', () => {
  test('dedicated tools are geo-ready', () => {
    for (const slug of [
      'fengshui-space',
      'fengshui-simulator',
      'liuyao-cast',
      'ziwei-edu',
      'tools',
    ]) {
      assert.ok(getToolSeoGeoPack(slug), slug);
      assert.equal(assertToolGeoReady(slug), true, slug);
      const pack = getToolSeoGeoPack(slug)!;
      assert.ok(pack.faqs.length >= 1);
      assert.ok(pack.shareText.length > 10);
      assert.ok(pack.answerSummary.length >= 40);
      assert.ok(isGeoReadySoft(toolPackToGeoMeta(pack)));
    }
  });

  test('metadata and json-ld emit for space lab', () => {
    const meta = buildToolPageMetadata('fengshui-space');
    assert.ok(String(meta.title || '').includes('空间场') || String(meta.title || '').includes('选'));
    const pack = getToolSeoGeoPack('fengshui-space')!;
    const graph = buildToolJsonLdGraph(pack);
    assert.ok(graph.length >= 3);
    const types = graph.map((n) => (n as { '@type'?: string })['@type']);
    assert.ok(types.includes('WebApplication'));
    assert.ok(types.includes('FAQPage'));
    assert.ok(types.includes('BreadcrumbList'));
  });

  test('catalog has unique paths', () => {
    const packs = listToolSeoGeoPacks();
    const paths = packs.map((p) => p.path);
    assert.equal(new Set(paths).size, paths.length);
  });
});
