import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildChatHref,
  buildReportContinueChatHref,
  buildTeachersIntentHref,
  buildToolOpeningChatHref,
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
    assert.equal(teacherIdFromFollowupIntent('palmistry-reading'), 'practice');
  });

  it('builds tool opening without question', () => {
    const href = buildToolOpeningChatHref({
      reportId: 'r9',
      intent: 'wealth',
      window: '工具结果：年度窗口',
      source: 'tool_result_opening',
    });
    assert.ok(href.includes('mode=opening'));
    assert.ok(href.includes('teacher=wealth'));
    assert.ok(href.includes('reportId=r9'));
    assert.ok(!href.includes('question='));
  });

  it('builds teachers intent hub', () => {
    const href = buildTeachersIntentHref({ intent: 'career', reportId: 'r1' });
    assert.ok(href.startsWith('/teachers?'));
    assert.ok(href.includes('intent=career'));
    assert.ok(href.includes('reportId=r1'));
  });
});
