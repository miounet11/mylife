import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildBaziSpaceBridge,
  facingsForElements,
  mergeBridgeIntoActions,
  profileLinkFromFortuneRow,
} from '@/lib/fengshui/space/bazi-space-bridge';
import { createDefaultLabState, simulateSpaceField } from '@/lib/fengshui/space/field-sim';

describe('fengshui bazi space bridge', () => {
  it('normalizes English 用神 to 中文 for spatial match', () => {
    const link = profileLinkFromFortuneRow({
      id: 'f1',
      name: '测',
      bazi: {
        dayMaster: '甲',
        pillars: [
          { celestialStem: '甲', earthlyBranch: '子' },
          { celestialStem: '丙', earthlyBranch: '寅' },
          { celestialStem: '甲', earthlyBranch: '辰' },
          { celestialStem: '戊', earthlyBranch: '午' },
        ],
        yongShen: { yongShen: ['wood', 'water'], xiShen: ['fire'], jiShen: ['metal'] },
      },
    });
    assert.ok(link);
    assert.equal(link!.dayMaster, '甲');
    assert.ok(link!.yongShen.includes('木'));
    assert.ok(link!.yongShen.includes('水'));
    assert.ok(!link!.yongShen.includes('wood'));
    assert.ok((link!.xiShen || []).includes('火'));
    assert.ok(link!.jiShen.includes('金'));
  });

  it('bridge treats south facing as fire vs 用神木 as mismatch, not crash', () => {
    const bridge = buildBaziSpaceBridge({
      activeDomain: 'residential',
      planOverlayMode: 'bagua8',
      room: { entranceFacing: '南' } as never,
      profileLink: {
        fortuneId: 'f1',
        birthSignature: 'x',
        dayMaster: '甲',
        yongShen: ['木', '水'],
        xiShen: [],
        jiShen: ['金'],
        linkedAt: new Date().toISOString(),
      },
    });
    assert.equal(bridge.linked, true);
    assert.equal(bridge.entranceMatch, false);
    assert.match(bridge.entranceNote, /南/);
    assert.ok(bridge.enhanceFacings.includes('东'));
    assert.ok(bridge.enhanceFacings.includes('东南'));
    assert.ok(bridge.reduceFacings.includes('西'));
    assert.ok(bridge.enhanceNotes.length + bridge.reduceNotes.length > 0);
  });

  it('maps 木 to 东/东南 and 水 to 北', () => {
    const dirs = facingsForElements(['wood', '水']);
    assert.deepEqual(dirs.sort(), ['东', '北', '东南'].sort());
  });

  it('mergeBridgeIntoActions prepends 人宅 lines onto live sim', () => {
    const state = createDefaultLabState();
    state.profileLink = {
      fortuneId: 'f1',
      birthSignature: 'x',
      dayMaster: '甲',
      yongShen: ['木'],
      xiShen: ['水'],
      jiShen: ['金'],
      linkedAt: new Date().toISOString(),
    };
    const sim = simulateSpaceField(state);
    const bridge = buildBaziSpaceBridge(state);
    const merged = mergeBridgeIntoActions(sim, bridge);
    assert.ok(merged.structuralNotes.some((n) => n.includes('用神') || n.includes('日主')));
    assert.ok(merged.priorityActions.some((a) => a.includes('用神方位')));
  });
});
