import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildChartAudit } from '../chart-audit';

describe('chart-audit', () => {
  it('flags 1984-10-08 stored morning chart when clock is 18:25', () => {
    const pack = buildChartAudit({
      birthDate: '1984-10-08',
      birthTime: '18:25',
      birthPlace: '台中',
      storedFingerprint: '甲子 癸酉 乙亥 庚辰',
    });
    assert.ok(pack);
    assert.equal(pack!.likelyMorningDefault, true);
    const clock = pack!.variants.find((v) => v.key === 'clock');
    const morning = pack!.variants.find((v) => v.key === 'morning');
    assert.equal(clock?.fingerprint, '甲子 甲戌 乙亥 乙酉');
    assert.equal(morning?.fingerprint, '甲子 癸酉 乙亥 庚辰');
    assert.equal(morning?.matchesStored, true);
    assert.ok(pack!.jieqiLine.includes('寒露') || pack!.jieqiLine.includes('节'));
    assert.ok(decodeURIComponent(pack!.recomputeHref).includes('18:25'));
  });
});
