import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createDefaultLabState, simulateSpaceField } from '@/lib/fengshui/space/field-sim';
import { buildFengshuiSpaceReport, reportToPlainText } from '@/lib/fengshui/space/full-report';
import { heuristicBeautify } from '@/lib/fengshui/space/beautify';
import { ensureFloorZones } from '@/lib/fengshui/space/cad-ops';

describe('fengshui full report + beautify', () => {
  it('builds multi-section report with renzhai section', () => {
    const state = createDefaultLabState();
    state.profileLink = {
      fortuneId: 'f1',
      birthSignature: 'sig',
      displayName: '测试',
      dayMaster: '甲',
      yongShen: ['木', '水'],
      jiShen: ['土'],
      linkedAt: new Date().toISOString(),
    };
    const result = simulateSpaceField(state);
    const report = buildFengshuiSpaceReport(state, result);
    assert.equal(report.schema, 'life-kline.fengshui-space-report.v1');
    assert.ok(report.sections.some((s) => s.id === 'renzhai'));
    assert.ok(report.profileLinked);
    const text = reportToPlainText(report);
    assert.ok(text.includes('人宅合参'));
  });

  it('heuristic beautify returns zones and image prompt', () => {
    const state = createDefaultLabState();
    const zones = ensureFloorZones(state);
    const r = heuristicBeautify(state, zones);
    assert.ok(r.zones.length > 0);
    assert.ok(r.imagePrompt.includes('floor plan'));
  });
});
