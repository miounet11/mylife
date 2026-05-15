const mockGetApiKey = jest.fn(() => '');

jest.mock('@/lib/user-utils', () => ({
  getOrCreateGuestUserId: jest.fn(() => 'guest_1'),
}));

jest.mock('@/lib/env', () => ({
  getApiKey: (...args: any[]) => mockGetApiKey(...(args as [])),
  getApiBaseUrl: jest.fn(() => 'https://example.invalid/v1'),
  getChatLlmTimeoutMs: jest.fn(() => 240_000),
  getDefaultModel: jest.fn(() => 'primary-model'),
}));

const mockCreateQuestion = jest.fn((record) => record);
const mockGetChatByUserId = jest.fn(() => []);
const mockCreateOpenAiCompatibleChatCompletion = jest.fn();
const mockRecordModelAttempt = jest.fn();

jest.mock('@/lib/database', () => ({
  eventOperations: { getByReportId: jest.fn(() => []), getByUserId: jest.fn(() => []) },
  fortuneOperations: { getById: jest.fn(() => null), getByUserId: jest.fn(() => []) },
  questionOperations: {
    create: (...args: any[]) => mockCreateQuestion(...(args as [unknown])),
    getChatByUserId: (...args: any[]) => mockGetChatByUserId(...(args as [])),
  },
  runInTransaction: jest.fn((fn) => fn()),
  toolSessionOperations: { getByUserId: jest.fn(() => []), listByUser: jest.fn(() => []) },
}));

jest.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS: { chat: { max: 999, windowMs: 60_000 } },
  checkRateLimit: jest.fn(() => ({ allowed: true })),
  getClientKey: jest.fn(() => 'client_1'),
}));

jest.mock('@/lib/analytics', () => ({
  trackServerEvent: jest.fn(),
}));

jest.mock('@/lib/openai-compatible-chat', () => ({
  createOpenAiCompatibleChatCompletion: (...args: any[]) => mockCreateOpenAiCompatibleChatCompletion(...args),
}));

jest.mock('@/lib/llm-provider-health', () => ({
  recordModelAttempt: (...args: any[]) => mockRecordModelAttempt(...args),
}));

jest.mock('openai', () => jest.fn().mockImplementation(() => ({
  chat: { completions: { create: jest.fn() } },
})));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/route';

describe('chat route fallback copy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApiKey.mockReturnValue('');
    mockGetChatByUserId.mockReturnValue([]);
    mockCreateQuestion.mockImplementation((record) => record);
    mockCreateOpenAiCompatibleChatCompletion.mockReset();
    mockRecordModelAttempt.mockReset();
  });

  test('does not pretend fallback is a stable structural answer when LLM is unavailable', async () => {
    const request = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ question: '我下个月要不要换工作？' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.llmUsed).toBe(false);
    expect(payload.answer).toContain('不硬编答案');
    expect(payload.answer).toContain('重生成');
    expect(payload.answer).not.toContain('当前上游模型不稳定');
    expect(payload.answer).not.toContain('稳定版结构回复');
  });

  test('uses one primary model call with 240s timeout and disables SDK retries', async () => {
    mockGetApiKey.mockReturnValue('test-key');
    mockCreateOpenAiCompatibleChatCompletion.mockResolvedValue({
      choices: [{ message: { content: '真实模型回答' } }],
    });

    const request = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ question: '我下个月要不要换工作？' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.llmUsed).toBe(true);
    expect(payload.answer).toBe('真实模型回答');
    expect(mockCreateOpenAiCompatibleChatCompletion).toHaveBeenCalledTimes(1);
    expect(mockCreateOpenAiCompatibleChatCompletion.mock.calls[0][1].model).toBe('primary-model');
    expect(mockCreateOpenAiCompatibleChatCompletion.mock.calls[0][2]).toMatchObject({
      timeout: 240_000,
      maxRetries: 0,
    });
  });

  test('does not retry or fallback to another model after a model failure', async () => {
    mockGetApiKey.mockReturnValue('test-key');
    mockCreateOpenAiCompatibleChatCompletion.mockRejectedValue(new Error('first call failed'));

    const request = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ question: '我下个月要不要换工作？' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.llmUsed).toBe(false);
    expect(payload.answer).toContain('不硬编答案');
    expect(mockCreateOpenAiCompatibleChatCompletion).toHaveBeenCalledTimes(1);
    expect(mockRecordModelAttempt).toHaveBeenCalledWith(expect.objectContaining({
      model: 'primary-model',
      scope: 'chat',
      success: false,
    }));
  });
});
