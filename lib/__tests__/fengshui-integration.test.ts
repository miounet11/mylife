import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { FENGSHUI_AGENT_DEFINITION, EXTENSION_AGENT_KEYS } from '@/lib/agentic-report/agent-definitions';
import { LEARNING_TRACKS, getLearningTrack } from '@/lib/learning-tracks';

describe('Fengshui agent definition', () => {
  test('FENGSHUI_AGENT_DEFINITION exists with required fields', () => {
    assert.ok(FENGSHUI_AGENT_DEFINITION, 'FENGSHUI_AGENT_DEFINITION must be exported');
    assert.strictEqual(FENGSHUI_AGENT_DEFINITION.key, 'fengshui_advisor');
    assert.strictEqual(FENGSHUI_AGENT_DEFINITION.name, '商铺风水顾问');
    assert.strictEqual(typeof FENGSHUI_AGENT_DEFINITION.description, 'string');
    assert.strictEqual(FENGSHUI_AGENT_DEFINITION.wave, 1);
    assert.strictEqual(FENGSHUI_AGENT_DEFINITION.role, 'synthesize');
    assert.ok(FENGSHUI_AGENT_DEFINITION.systemPrompt.length > 0);
    assert.ok(FENGSHUI_AGENT_DEFINITION.systemPrompt.includes('结构化判断'));
  });

  test('EXTENSION_AGENT_KEYS includes fengshui_advisor', () => {
    assert.ok(EXTENSION_AGENT_KEYS.includes('fengshui_advisor'));
  });

  test('agent output schema has expected fields', () => {
    const schema = FENGSHUI_AGENT_DEFINITION.outputSchema as Record<string, string>;
    const expected = [
      'overallScore',
      'radarScores',
      'industryElement',
      'doorElement',
      'colorScheme',
      'timingWindow',
      'layoutAdvice',
      'structuralSummary',
    ];
    for (const field of expected) {
      assert.ok(field in schema, `outputSchema must contain ${field}`);
    }
    assert.strictEqual(schema.overallScore, 'number');
    assert.strictEqual(schema.industryElement, 'string');
    assert.strictEqual(schema.layoutAdvice, 'string[]');
  });

  test('agent input schema has expected fields', () => {
    const schema = FENGSHUI_AGENT_DEFINITION.inputSchema as Record<string, string>;
    assert.ok('industryType' in schema);
    assert.ok('shopName' in schema);
    assert.ok('doorDirection' in schema);
    assert.ok('decorPreference' in schema);
    assert.ok('openingDate' in schema);
  });
});

describe('Fengshui learning track', () => {
  test('track "fengshui" is registered in LEARNING_TRACKS', () => {
    const track = LEARNING_TRACKS.find((t) => t.key === 'fengshui');
    assert.ok(track, 'fengshui track must exist');
    assert.strictEqual(track.title, '商铺风水轨');
    assert.strictEqual(track.targetCount, 6);
  });

  test('getLearningTrack returns fengshui track', () => {
    const track = getLearningTrack('fengshui');
    assert.strictEqual(track.key, 'fengshui');
  });

  test('fengshui track has all 6 steps', () => {
    const track = getLearningTrack('fengshui');
    assert.strictEqual(track.steps.length, 6);
    const keys = track.steps.map((s) => s.key);
    assert.deepEqual(keys, [
      'fengshui-industry',
      'fengshui-direction',
      'fengshui-name',
      'fengshui-color',
      'fengshui-timing',
      'fengshui-tool',
    ]);
  });

  test('fengshui track steps have valid hrefs', () => {
    const track = getLearningTrack('fengshui');
    for (const step of track.steps) {
      assert.ok(step.href.startsWith('/'), `step ${step.key} href must start with /`);
      assert.ok(step.href.length > 1, `step ${step.key} href must not be just /`);
    }
  });
});
