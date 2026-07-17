import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildTeacherOpening,
  fillTeacherTemplate,
  slotsFromChatReport,
} from '@/lib/teacher-opening';
import { getTeacher } from '@/lib/teachers';

describe('teacher-opening', () => {
  it('fills template slots', () => {
    const text = fillTeacherTemplate('日主{{dayMaster}}，{{name}}，{{windowHint}}', {
      dayMaster: '甲',
      name: '案主',
      windowHint: '近期关注推进窗',
    });
    assert.match(text, /日主甲/);
    assert.match(text, /案主/);
    assert.match(text, /推进窗/);
  });

  it('builds career opening with starters', () => {
    const view = buildTeacherOpening({
      teacherId: 'career',
      slots: slotsFromChatReport({
        name: '测',
        dayMaster: '辛',
        pattern: '正格',
        currentDaYun: '乙酉',
      }),
    });
    assert.equal(view.teacherId, 'career');
    assert.ok(view.firstMes.includes('辛'));
    assert.ok(view.starters.length >= 2);
    assert.ok(view.chips.some((c) => c.label.includes('事业') || c.id === 'career'));
  });

  it('P0 teachers expose firstMes', () => {
    for (const id of ['overview', 'career', 'wealth', 'relationship', 'health', 'timing'] as const) {
      const t = getTeacher(id);
      assert.ok(t.firstMes && t.firstMes.length > 20, id);
      assert.ok((t.starters || []).length >= 2, id);
    }
  });

  it('swaps alternate greetings', () => {
    const a = buildTeacherOpening({ teacherId: 'overview', greetingIndex: 0 });
    const b = buildTeacherOpening({ teacherId: 'overview', greetingIndex: 1 });
    assert.ok(a.greetingCount >= 2);
    assert.notEqual(a.firstMes, b.firstMes);
  });
});
