import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyUserQuestion } from '../chat-user-signal';

describe('classifyUserQuestion (from prod logs)', () => {
  it('flags truncated sex typing as incomplete', () => {
    const s = classifyUserQuestion('我在se');
    assert.equal(s.kind, 'incomplete');
    assert.ok(s.localAnswer);
  });

  it('treats A vs B as either_or verdict', () => {
    const s = classifyUserQuestion('我适合在苏州发展还是深圳？');
    assert.equal(s.kind, 'either_or');
    assert.equal(s.forceIntent, 'event-verdict');
    assert.match(s.systemAddon, /二选一/);
  });

  it('explains 十神 vs 五行 when user asks 正官 vs 忌神', () => {
    const s = classifyUserQuestion('正官（水）为忌神，为什么还忌神为火、木');
    assert.equal(s.kind, 'yongshen_why');
    assert.match(s.systemAddon, /十神/);
  });

  it('blocks medical/sexual function diagnosis', () => {
    const s = classifyUserQuestion('我在sex上的表现如何？猛吗？还是会早泄？');
    assert.equal(s.kind, 'intimacy_medical');
    assert.match(s.systemAddon, /医生/);
    assert.equal(s.localAnswer, undefined);
  });

  it('detects concrete timing windows', () => {
    const s = classifyUserQuestion('我2026.6来新公司实习，什么时候有机会转正？');
    assert.equal(s.kind, 'timing_when');
  });
});
