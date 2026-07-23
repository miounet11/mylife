import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeShopFengshui,
  resolveIndustryElement,
  resolveDirectionElement,
  analyzeShopName,
  generateColorScheme,
  analyzeOpeningDate,
} from '@/lib/fengshui';

describe('Fengshui engine pure functions', () => {
  test('resolveIndustryElement maps 餐饮 to fire', () => {
    const profile = resolveIndustryElement('餐饮');
    assert.strictEqual(profile.element, 'fire');
  });

  test('resolveDirectionElement maps 南 to fire', () => {
    const profile = resolveDirectionElement('南');
    assert.strictEqual(profile.element, 'fire');
  });

  test('analyzeShopName returns totalScore and characters', () => {
    const result = analyzeShopName('青木小馆', ['fire', 'wood']);
    assert.ok(typeof result.totalScore === 'number');
    assert.ok(result.totalScore >= 0 && result.totalScore <= 100);
    assert.ok(Array.isArray(result.characters));
    assert.ok(result.characters.length >= 1);
    assert.ok(typeof result.summary === 'string' && result.summary.length > 0);
  });

  test('generateColorScheme returns primary/secondary/accent', () => {
    const scheme = generateColorScheme(['fire', 'wood'], '新中式');
    assert.ok(scheme.primary?.hex);
    assert.ok(scheme.secondary?.hex);
    assert.ok(scheme.accent?.hex);
    assert.ok(Array.isArray(scheme.avoidColors));
  });

  test('analyzeOpeningDate handles provided date', () => {
    const result = analyzeOpeningDate(
      '2026-08-08',
      { favorable: ['fire'], unfavorable: [], basisLabel: '行业五行结构' },
      2026,
    );
    assert.ok(typeof result.seasonPreference === 'string');
    assert.ok(typeof result.reason === 'string');
  });

  test('analyzeShopFengshui returns five radar dimensions and overall score', () => {
    const output = analyzeShopFengshui(
      {
        industryType: '餐饮',
        shopName: '青木小馆',
        doorDirection: '南',
        decorPreference: '新中式',
        openingDate: '2026-08-08',
      },
      ['fire', 'wood'],
      [],
      '行业五行结构',
    );

    assert.ok(typeof output.overallScore === 'number');
    assert.ok(output.overallScore >= 0 && output.overallScore <= 100);
    for (const key of ['industry', 'direction', 'nameScore', 'colorScore', 'timingScore'] as const) {
      assert.ok(typeof output.radarScores[key] === 'number', `missing radar ${key}`);
    }
    assert.ok(output.structuralSummary.length > 10);
    assert.ok(output.layoutAdvice.overallLayout);
    assert.strictEqual(output.industryElement, 'fire');
    assert.strictEqual(output.doorElement, 'fire');
  });
});
