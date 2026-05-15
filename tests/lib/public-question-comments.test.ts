jest.mock('@/lib/database', () => {
  const statements = new Map<string, { run: jest.Mock; all: jest.Mock; get: jest.Mock }>();
  const exec = jest.fn();
  const prepare = jest.fn((sql: string) => {
    const key = sql.replace(/\s+/g, ' ').trim();
    if (!statements.has(key)) {
      statements.set(key, { run: jest.fn(), all: jest.fn(), get: jest.fn() });
    }
    return statements.get(key);
  });

  return {
    db: {
      exec,
      prepare,
      __mock: { exec, prepare, statements },
    },
  };
});

jest.mock('@/lib/env', () => ({
  getApiBaseUrl: jest.fn(() => 'https://example.test/v1'),
  getApiKey: jest.fn(() => ''),
  getDefaultModel: jest.fn(() => 'test-model'),
}));

jest.mock('@/lib/openai-compatible-chat', () => ({
  createOpenAiCompatibleChatCompletion: jest.fn(),
}));

jest.mock('@/lib/utils', () => ({
  generateId: jest.fn(() => 'fixed_id'),
}));

import { db } from '@/lib/database';
import { createPublicQuestionComment, listVisiblePublicQuestionComments } from '@/lib/public-question-comments';

const mockedDb = db as unknown as {
  __mock: {
    exec: jest.Mock;
    prepare: jest.Mock;
    statements: Map<string, { run: jest.Mock; all: jest.Mock; get: jest.Mock }>;
  };
};

function lastPreparedStatement() {
  const statements = [...mockedDb.__mock.statements.values()];
  return statements[statements.length - 1];
}

describe('public question comments', () => {
  beforeEach(() => {
    mockedDb.__mock.exec.mockClear();
    mockedDb.__mock.prepare.mockClear();
    mockedDb.__mock.statements.clear();
  });

  test('stores visible comments as user assets with tags and source context', async () => {
    const comment = await createPublicQuestionComment({
      questionId: 'q1',
      questionText: '今年事业窗口怎么看？',
      userId: 'guest_1',
      sessionId: 'guest_1',
      authorName: '测试用户',
      content: '我的情况类似，想问明年工作风险要不要提前准备？',
      sourceContext: { route: '/questions/q1', title: '事业窗口' },
    });

    const insert = lastPreparedStatement();
    expect(insert.run).toHaveBeenCalledWith(
      'pqc_fixed_id',
      'q1',
      'guest_1',
      'guest_1',
      '测试用户',
      '我的情况类似，想问明年工作风险要不要提前准备？',
      'visible',
      '审核服务不可用，规则未命中，默认显示',
      'fallback',
      null,
      expect.stringContaining('career-wealth'),
      expect.stringContaining('/questions/q1'),
    );
    expect(comment.userId).toBe('guest_1');
    expect(comment.sessionId).toBe('guest_1');
    expect(comment.assetTags).toEqual(expect.arrayContaining(['public-discussion', 'career-wealth', 'timing', 'risk']));
  });

  test('hides ad comments before storing', async () => {
    const comment = await createPublicQuestionComment({
      questionId: 'q1',
      questionText: '感情怎么看？',
      content: '加我微信 abcd1234 付费咨询',
    });

    const insert = lastPreparedStatement();
    expect(insert.run).toHaveBeenCalledWith(
      'pqc_fixed_id',
      'q1',
      null,
      null,
      '匿名用户',
      '加我微信 abcd1234 付费咨询',
      'hidden',
      '疑似广告、引流或联系方式',
      'rules',
      null,
      expect.any(String),
      expect.any(String),
    );
    expect(comment.status).toBe('hidden');
  });

  test('maps visible rows with engine replies and asset tags', () => {
    mockedDb.__mock.prepare.mockImplementationOnce(() => ({ all: jest.fn(() => [
      {
        id: 'c1',
        question_id: 'q1',
        user_id: 'guest_1',
        session_id: 'guest_1',
        author_name: '用户',
        content: '类似经历',
        status: 'visible',
        moderation_reason: 'ok',
        engine_reply: '先把时间点说清楚。',
        asset_tags: JSON.stringify(['public-discussion', 'self-disclosure']),
        created_at: '2026-05-12 10:00:00',
      },
    ]) }));

    const comments = listVisiblePublicQuestionComments('q1');

    expect(comments[0]).toMatchObject({
      id: 'c1',
      userId: 'guest_1',
      sessionId: 'guest_1',
      engineReply: '先把时间点说清楚。',
      assetTags: ['public-discussion', 'self-disclosure'],
    });
  });
});
