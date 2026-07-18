import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMemoryNarrative,
  memoryInputFromChatContext,
} from '@/lib/chat/memory-narrative';
import { buildTeacherOpening } from '@/lib/teacher-opening';

describe('buildMemoryNarrative', () => {
  it('returns null without signals', () => {
    assert.equal(buildMemoryNarrative({}), null);
    assert.equal(buildMemoryNarrative({ predictionCount: 0, eventCount: 0 }), null);
    assert.equal(buildMemoryNarrative({ hitCount: 3 }), null);
  });

  it('formats prediction revisit with hits when both provided', () => {
    const line = buildMemoryNarrative({ predictionCount: 5, hitCount: 4 });
    assert.ok(line);
    assert.match(line!, /回访 5 条预测/);
    assert.match(line!, /命中 4/);
    assert.match(line!, /推进/);
  });

  it('leans conservative when hit ratio is low', () => {
    const line = buildMemoryNarrative({ predictionCount: 10, hitCount: 2 });
    assert.ok(line);
    assert.match(line!, /保守/);
  });

  it('omits hit count when not provided (never invents)', () => {
    const line = buildMemoryNarrative({ predictionCount: 3 });
    assert.ok(line);
    assert.match(line!, /回访 3 条预测/);
    assert.ok(!/命中/.test(line!));
  });

  it('formats event-only memory', () => {
    const line = buildMemoryNarrative({
      eventCount: 2,
      lastEventLabel: '跳槽窗口',
    });
    assert.ok(line);
    assert.match(line!, /2 条事件/);
    assert.match(line!, /跳槽窗口/);
    assert.match(line!, /回访|懂你/);
  });

  it('ignores impossible hitCount > predictionCount', () => {
    const line = buildMemoryNarrative({ predictionCount: 2, hitCount: 9 });
    assert.ok(line);
    assert.ok(!/命中/.test(line!));
  });
});

describe('memoryInputFromChatContext', () => {
  it('returns null for empty context', () => {
    assert.equal(memoryInputFromChatContext(null), null);
    assert.equal(memoryInputFromChatContext({}), null);
  });

  it('maps validation summary without inventing rates', () => {
    const input = memoryInputFromChatContext({
      validationSummary: { accurateCount: 2, driftCount: 1, pendingCount: 3 },
      confirmedPastEventCount: 4,
      recentEvents: [{ title: '项目上线' }],
    });
    assert.ok(input);
    assert.equal(input!.predictionCount, 3); // accurate + drift
    assert.equal(input!.hitCount, 2);
    assert.equal(input!.eventCount, 4);
    assert.equal(input!.lastEventLabel, '项目上线');
  });

  it('prefers explicit prediction stats when provided', () => {
    const input = memoryInputFromChatContext({
      validationSummary: { accurateCount: 1, driftCount: 0, pendingCount: 0 },
      predictionStats: { predictionCount: 8, hitCount: 5 },
    });
    assert.ok(input);
    assert.equal(input!.predictionCount, 8);
    assert.equal(input!.hitCount, 5);
  });
});

describe('buildTeacherOpening memoryLine', () => {
  it('exposes memoryLine without polluting unbound firstMes template', () => {
    const view = buildTeacherOpening({
      teacherId: 'overview',
      memory: { predictionCount: 4, hitCount: 3 },
    });
    assert.ok(view.memoryLine);
    assert.match(view.memoryLine!, /回访 4/);
    // firstMes stays the unbound template; chip carries memory
    assert.ok(view.firstMes.includes('不会编造') || view.firstMes.includes('还没绑定'));
    assert.ok(!view.firstMes.includes('回访 4'));
  });

  it('leaves memoryLine null when no memory input', () => {
    const view = buildTeacherOpening({ teacherId: 'career' });
    assert.ok(!view.memoryLine);
  });
});
