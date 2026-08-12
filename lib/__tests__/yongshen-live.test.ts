import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveYongShenPresentation } from '../yongshen-live';
import { YONGSHEN_ENGINE_VERSION } from '../yongshen-engine-version';

describe('resolveYongShenPresentation', () => {
  it('recomputes 丙戌辛丑甲辰乙丑 live and marks stale when version missing', () => {
    const result = {
      basic: {
        dayMaster: '甲',
        pillars: [
          { ganZhi: '丙戌' },
          { ganZhi: '辛丑' },
          { ganZhi: '甲辰' },
          { ganZhi: '乙丑' },
        ],
      },
      // Old wrong cache
      advice: { yongShen: ['金', '土', '火'], jiShen: ['木', '水'] },
      yongShen: {
        strength: 'strong',
        strengthDesc: '身偏旺',
        yongShen: ['metal', 'earth', 'fire'],
        jiShen: ['wood', 'water'],
      },
    };
    const live = resolveYongShenPresentation(result);
    assert.equal(live.stale, true);
    assert.equal(live.liveVersion, YONGSHEN_ENGINE_VERSION);
    assert.ok(live.yongShen.some((e) => e === '水' || e === '木'));
    assert.ok(!live.yongShen.includes('金') || live.yongShen.includes('水'));
    assert.ok(live.reasonChain.length >= 2);
    assert.ok(/中和|弱/.test(live.strengthDesc));
  });

  it('not stale when engineVersions.yongShen matches current', () => {
    const result = {
      basic: {
        pillars: [
          { celestialStem: '甲', earthlyBranch: '寅' },
          { celestialStem: '丙', earthlyBranch: '寅' },
          { celestialStem: '甲', earthlyBranch: '寅' },
          { celestialStem: '甲', earthlyBranch: '寅' },
        ],
      },
      analysis: { engineVersions: { yongShen: YONGSHEN_ENGINE_VERSION } },
    };
    const live = resolveYongShenPresentation(result);
    assert.equal(live.stale, false);
  });
});
