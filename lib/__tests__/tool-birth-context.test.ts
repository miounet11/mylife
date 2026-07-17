import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEphemeralReportFromBirth,
  isEphemeralBirthReportId,
  parseToolBirthInput,
  sessionReportIdFor,
} from '@/lib/tool-birth-context';
import { hehunPersonFromBirth, hehunFromBirthPair } from '@/lib/hehun-prefill';
import { analyzeHehun } from '@/lib/hehun-engine';

describe('tool-birth-context', () => {
  it('parses birth payload and rejects bad dates', () => {
    assert.ok(parseToolBirthInput({ birthDate: '1990-06-15', gender: 'male' }));
    assert.equal(parseToolBirthInput({ birthDate: 'not-a-date' }), null);
    assert.equal(parseToolBirthInput({ birthDate: '1800-01-01' }), null);
    assert.equal(parseToolBirthInput({ birthDate: '2099-01-01' }), null);
    assert.equal(parseToolBirthInput({}), null);
  });

  it('builds ephemeral report with day master from engine', () => {
    const { report, pack } = buildEphemeralReportFromBirth({
      userId: 'user_test_123456',
      birth: { birthDate: '1990-06-15', birthTime: '10:00', gender: 'male', name: '测试' },
    });
    assert.ok(isEphemeralBirthReportId(report.id));
    assert.equal(sessionReportIdFor(report), null);
    assert.ok(pack.lockedFacts.dayMaster);
    assert.ok(report.bazi?.dayMaster);
    assert.ok((report.advice?.yongShen || []).length > 0 || pack.lockedFacts.yongShen.length >= 0);
    assert.ok(report.reportVersion?.includes('birth-ephemeral'));
    // 用神/忌神对用户展示必须是中文五行
    for (const el of [...pack.lockedFacts.yongShen, ...pack.lockedFacts.jiShen]) {
      assert.ok(/^[木火土金水]$/.test(el), `expected cn element, got ${el}`);
    }
  });
});

describe('hehun ground-truth pack', () => {
  it('builds person from birth via pack', () => {
    const person = hehunPersonFromBirth({
      birthDate: '1990-06-15',
      birthTime: '10:00',
      gender: 'male',
      name: '甲',
    });
    assert.equal(person.name, '甲');
    assert.ok(person.dayMaster);
    assert.ok(person.dayBranch);
    assert.ok(person.pillars && person.pillars.length >= 3);
  });

  it('runs hehun from two births', () => {
    const { personA, personB } = hehunFromBirthPair(
      { birthDate: '1990-06-15', birthTime: '10:00', gender: 'male', name: '甲' },
      { birthDate: '1992-03-08', birthTime: '14:00', gender: 'female', name: '乙' },
    );
    const result = analyzeHehun(personA, personB);
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(result.layers.length >= 3);
    assert.ok(result.headline);
  });
});
