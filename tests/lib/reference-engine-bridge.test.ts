import { describe, expect, test } from '@jest/globals';
import { buildReferenceIntelligencePack } from '@/lib/reference-intelligence';
import {
  applyReferenceIntelligenceToStateVector,
  buildReferenceContextOverlay,
  calibrateStateVectorCurrent,
} from '@/lib/reference-engine-bridge';

describe('reference engine bridge', () => {
  test('calibrates state vector with reference deltas and clamps to valid bounds', () => {
    const adjusted = calibrateStateVectorCurrent(
      { tianShi: 9.4, diLi: 1.2, renHe: 5 },
      { tianShiDelta: 1.5, diLiDelta: -2, renHeDelta: 0.4 }
    );

    expect(adjusted.tianShi).toBe(10);
    expect(adjusted.diLi).toBe(0);
    expect(adjusted.renHe).toBe(5.4);
  });

  test('applies reference intelligence pack to state vector current values', () => {
    const pack = buildReferenceIntelligencePack({
      sourceDocuments: [
        {
          id: 'src_1',
          sourceType: 'site',
          platform: 'zhihu',
          sourceId: 'zhihu-search',
          canonicalUrl: 'https://www.zhihu.com/question/1',
          title: '城市迁移和办公环境更适合稳定推进',
          author: null,
          publishedAt: '2026-03-12T00:00:00.000Z',
          language: 'zh-CN',
          summary: '围绕城市、居住、办公环境和稳定布局展开。',
          tags: ['城市', '办公环境', '适合'],
          rawMeta: {},
          rightsStatus: 'platform_restricted',
          licenseName: null,
          reusePolicy: null,
          contentHash: null,
          createdAt: '2026-03-12T00:00:00.000Z',
          updatedAt: '2026-03-12T00:00:00.000Z',
        },
      ],
    });

    const stateVector = applyReferenceIntelligenceToStateVector(
      {
        current: { tianShi: 5, diLi: 5, renHe: 5 },
      },
      pack
    );

    expect(stateVector.current.diLi).toBeGreaterThan(5);
  });

  test('builds overlay hints and citations for downstream prompt or context injection', () => {
    const pack = buildReferenceIntelligencePack({
      sourceDocuments: [
        {
          id: 'src_1',
          sourceType: 'site',
          platform: 'zhihu',
          sourceId: 'zhihu-search',
          canonicalUrl: 'https://www.zhihu.com/question/1',
          title: '真太阳时和流年窗口怎么看',
          author: null,
          publishedAt: '2026-03-12T00:00:00.000Z',
          language: 'zh-CN',
          summary: '围绕真太阳时、节气和流年窗口展开。',
          tags: ['真太阳时', '节气', '流年'],
          rawMeta: {},
          rightsStatus: 'platform_restricted',
          licenseName: null,
          reusePolicy: null,
          contentHash: null,
          createdAt: '2026-03-12T00:00:00.000Z',
          updatedAt: '2026-03-12T00:00:00.000Z',
        },
      ],
    });

    const overlay = buildReferenceContextOverlay(pack);

    expect(overlay.timingHints.length).toBeGreaterThan(0);
    expect(overlay.directives.length).toBeGreaterThan(0);
    expect(overlay.citations[0]?.dimension).toBe('tianShi');
    expect(overlay.timingHints.join(' ')).not.toContain('解释增强即可');
  });
});
