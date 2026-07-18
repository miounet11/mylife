import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildChatEvalCase,
  classifyChatEvalBucket,
  desensitizeChatText,
  hitEngineTerms,
} from '@/lib/chat-eval';

describe('chat-eval', () => {
  it('desensitizes emails and phones', () => {
    const t = desensitizeChatText('联系 a@b.com 手机 13812345678 去清华大学生活');
    assert.ok(t.includes('[email]'));
    assert.ok(t.includes('[phone]'));
    assert.ok(t.includes('[org]'));
  });

  it('classifies grounded vs fallback', () => {
    assert.equal(
      classifyChatEvalBucket({
        question: '结合命局，事业方向怎么走？',
        answer: '判断依据：日主甲木，用神为水，当前大运…',
        llmUsed: true,
        hasReportId: true,
      }),
      'grounded_ok',
    );
    assert.equal(
      classifyChatEvalBucket({
        question: '事业版现在最该怎么推进？',
        answer: '这次没有拿到可用的深度解析结果，所以不硬编答案。可点重生成。',
        llmUsed: false,
        hasReportId: true,
      }),
      'fallback_template',
    );
    assert.equal(
      classifyChatEvalBucket({
        question: '123123123',
        answer: 'x',
        llmUsed: true,
        hasReportId: false,
      }),
      'noise',
    );
  });

  it('builds eval case with engine hits', () => {
    const c = buildChatEvalCase({
      id: 't1',
      question: '财运怎么样',
      answer: '日主壬水，用神金水，忌神木火。建议…风险…',
      llmUsed: true,
      reportId: 'r1',
    });
    assert.equal(c.bucket, 'grounded_ok');
    assert.ok(hitEngineTerms(c.answer).includes('日主'));
  });

  it('flags negative feedback in notes', () => {
    const c = buildChatEvalCase({
      id: 't2',
      question: '该不该跳槽',
      answer: '你可以考虑一下再决定。',
      llmUsed: true,
      reportId: 'r1',
      feedbackRating: 'not_helpful',
      structureFilled: 1,
      structureRich: false,
    });
    assert.ok(c.notes?.includes('not_helpful'));
    assert.equal(c.meta.feedbackRating, 'not_helpful');
  });
});
