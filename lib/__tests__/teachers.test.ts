import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveTeacherPresentation } from '@/lib/i18n/teacher-copy';
import {
  TEACHERS,
  buildTeacherChatHref,
  buildTeacherSystemPreamble,
  getTeacher,
  listReportTeachers,
  teacherFromTopicKey,
} from '@/lib/teachers';

describe('teachers registry', () => {
  it('all public names end with 老师', () => {
    for (const t of TEACHERS) {
      assert.ok(t.name.endsWith('老师'), t.id);
      assert.ok(t.starters.length >= 1, t.id);
      assert.ok(t.boundary.length > 4, t.id);
    }
  });

  it('p0 report bar has overview career geo practice', () => {
    const ids = listReportTeachers().map((t) => t.id);
    assert.ok(ids.includes('overview'));
    assert.ok(ids.includes('career'));
    assert.ok(ids.includes('geo'));
    assert.ok(ids.includes('practice'));
  });

  it('topic maps to teacher', () => {
    assert.equal(teacherFromTopicKey('wealth').id, 'wealth');
    assert.equal(teacherFromTopicKey('marriage').id, 'relationship');
  });

  it('chat href carries teacher and report', () => {
    const href = buildTeacherChatHref({
      teacherId: 'career',
      reportId: 'r1',
      city: '上海',
    });
    assert.ok(href.includes('teacher=career'));
    assert.ok(href.includes('reportId=r1'));
    assert.ok(href.includes('city='));
  });

  it('system preamble is internal persona not marketing funnel', () => {
    const p = buildTeacherSystemPreamble(getTeacher('wealth'));
    assert.ok(p.includes('财务老师'));
    assert.ok(!p.includes('漏斗'));
    assert.ok(!p.includes('L0'));
  });

  it('EN presentation for P1/P2 overlays has no CJK in name', () => {
    const ids = [
      'hehun',
      'study',
      'partnership',
      'naming',
      'timing_selection',
      'guide',
      'terms',
      'expert_chart',
    ] as const;
    for (const id of ids) {
      const p = resolveTeacherPresentation(getTeacher(id), 'en');
      assert.ok(!/[\u4e00-\u9fff]/.test(p.name), `${id} name has CJK: ${p.name}`);
      assert.match(p.name, /Guide$/, id);
      assert.ok(p.tagline.length > 4, id);
      assert.ok(p.boundary.length > 4, id);
    }
  });
});
