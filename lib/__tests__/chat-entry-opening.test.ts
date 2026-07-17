import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildChatHref,
  buildReportContinueChatHref,
  buildTopicChatHref,
  teacherIdFromFollowupIntent,
} from '@/lib/chat-entry';
import { buildTeacherChatHref } from '@/lib/teachers';

describe('chat entry opening mode', () => {
  it('continue href has teacher and no question', () => {
    const href = buildReportContinueChatHref({ reportId: 'r1', teacher: 'overview' });
    assert.ok(href.includes('reportId=r1'));
    assert.ok(href.includes('teacher=overview'));
    assert.ok(href.includes('mode=opening'));
    assert.ok(!href.includes('question='));
  });

  it('topic href defaults to opening', () => {
    const href = buildTopicChatHref('r1', 'career', '事业');
    assert.ok(href.includes('teacher=career'));
    assert.ok(href.includes('mode=opening'));
    assert.ok(!href.includes('question='));
  });

  it('teacher href defaults to opening', () => {
    const href = buildTeacherChatHref({ teacherId: 'wealth', reportId: 'r1' });
    assert.ok(href.includes('mode=opening'));
    assert.ok(!href.includes('question='));
  });

  it('prefill mode keeps question', () => {
    const href = buildChatHref({
      reportId: 'r1',
      teacher: 'timing',
      question: '本月推进什么',
      mode: 'prefill',
    });
    assert.ok(href.includes('question='));
    assert.ok(href.includes('teacher=timing'));
  });

  it('maps intents to teachers', () => {
    assert.equal(teacherIdFromFollowupIntent('window'), 'timing');
    assert.equal(teacherIdFromFollowupIntent('next-action'), 'career');
  });
});
