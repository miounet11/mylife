import { generateAugmentedFollowups } from '@/lib/followup-augmenter';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';

jest.mock('openai', () => jest.fn().mockImplementation(() => ({})));

jest.mock('@/lib/env', () => ({
  getApiBaseUrl: jest.fn(() => 'https://example.test/v1'),
  getApiKey: jest.fn(() => 'test-key'),
  getDefaultModel: jest.fn(() => 'gpt-5.4-mini-my'),
}));

jest.mock('@/lib/openai-compatible-chat', () => ({
  createOpenAiCompatibleChatCompletion: jest.fn(),
}));

const mockedCreateChatCompletion = createOpenAiCompatibleChatCompletion as jest.MockedFunction<typeof createOpenAiCompatibleChatCompletion>;

describe('followup augmenter', () => {
  beforeEach(() => {
    mockedCreateChatCompletion.mockReset();
  });

  it('includes json in messages when using json_object response format', async () => {
    mockedCreateChatCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              suggestions: [
                { label: '事业', intent: 'scenario', question: '你现在这条事业线更需要先看甲木日主和窗口月份之间的牵引，而不是急着下结论。你最想先拆哪一个现实选择？' },
              ],
            }),
          },
        },
      ],
    } as never);

    await generateAugmentedFollowups({
      baseSuggestions: [
        { label: '事业', intent: 'scenario', question: '事业怎么判断？' },
      ],
      reportFacts: {
        patternType: '正官格',
        dayMaster: '甲木',
        topWindowLabel: '2026 春季',
      },
      timeoutMs: 1000,
    });

    expect(mockedCreateChatCompletion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        responseFormat: { type: 'json_object' },
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringMatching(/json/i),
          }),
        ]),
      }),
      expect.anything(),
    );
  });
});
