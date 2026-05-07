const mockGenerateManagedContentDrafts = jest.fn();
const mockContentGenerationJobOperations = {
  create: jest.fn(),
  getById: jest.fn(),
  claimNextRunnable: jest.fn(),
  markCompleted: jest.fn(),
  markRetry: jest.fn(),
  markFailed: jest.fn(),
};
const mockListManagedContentEntries = jest.fn();
const mockSaveManagedContentEntry = jest.fn();

jest.mock('@/lib/content-generation', () => ({
  generateManagedContentDrafts: (...args: unknown[]) => mockGenerateManagedContentDrafts(...args),
}));

jest.mock('@/lib/database', () => ({
  contentGenerationJobOperations: mockContentGenerationJobOperations,
}));

jest.mock('@/lib/content-store', () => ({
  listManagedContentEntries: (...args: unknown[]) => mockListManagedContentEntries(...args),
  saveManagedContentEntry: (...args: unknown[]) => mockSaveManagedContentEntry(...args),
}));

import {
  enqueueContentGenerationJob,
  processNextContentGenerationJob,
} from '@/lib/content-generation-jobs';

function createDraft(overrides: Record<string, unknown> = {}) {
  return {
    contentType: 'knowledge',
    subtype: null,
    slug: 'career-timing-2026',
    title: '2026 职业节奏判断',
    name: null,
    excerpt: '这是一篇用于验证内容生成队列保存路径的测试文章摘要。',
    category: '职业',
    readTime: '6 分钟',
    tags: ['职业', '时机'],
    featured: false,
    seoTitle: '2026 职业节奏判断',
    seoDescription: '验证内容生成队列保存路径。',
    sections: [
      { title: '第一节', paragraphs: ['第一段。', '第二段。'] },
      { title: '第二节', paragraphs: ['第一段。', '第二段。'] },
      { title: '第三节', paragraphs: ['第一段。', '第二段。'] },
      { title: '第四节', paragraphs: ['第一段。', '第二段。'] },
    ],
    status: 'draft',
    source: 'agent-llm:seo',
    llmUsed: true,
    ...overrides,
  };
}

describe('content generation jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListManagedContentEntries.mockReturnValue([]);
    mockSaveManagedContentEntry.mockImplementation((entry) => ({
      ...entry,
      id: entry.id || `saved_${entry.slug}`,
      updatedAt: '2026-05-05T03:40:00.000Z',
    }));
  });

  it('enqueues a pending job with normalized metadata', () => {
    mockContentGenerationJobOperations.getById.mockReturnValue({
      id: 'content_job_created',
      status: 'pending',
    });

    const job = enqueueContentGenerationJob({
      userId: 'admin_user',
      input: {
        topic: '2026 职业节奏判断',
        contentType: 'knowledge',
        platform: 'seo',
      },
      meta: {
        trigger: 'test',
      },
    });

    expect(mockContentGenerationJobOperations.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'admin_user',
      status: 'pending',
      generatedCount: 0,
      llmSucceededCount: 0,
      fallbackCount: 0,
      request: expect.objectContaining({
        topic: '2026 职业节奏判断',
      }),
      meta: expect.objectContaining({
        trigger: 'test',
        topic: '2026 职业节奏判断',
        mode: 'single',
        contentType: 'knowledge',
        platform: 'seo',
      }),
    }));
    expect(job).toEqual(expect.objectContaining({
      id: 'content_job_created',
    }));
  });

  it('processes and saves generated content with llm and fallback counts', async () => {
    mockContentGenerationJobOperations.claimNextRunnable.mockReturnValue({
      id: 'content_job_1',
      userId: 'admin_user',
      status: 'running',
      request: {
        topic: '2026 职业节奏判断',
        contentType: 'knowledge',
      },
      attempts: 1,
      maxAttempts: 3,
      meta: {
        topic: '2026 职业节奏判断',
      },
    });
    mockGenerateManagedContentDrafts.mockResolvedValue({
      entries: [
        createDraft(),
        createDraft({
          slug: 'fallback-case-2026',
          contentType: 'case',
          source: 'agent-fallback:seo',
          llmUsed: false,
        }),
      ],
      llmSucceededCount: 1,
      fallbackCount: 1,
    });

    const result = await processNextContentGenerationJob();

    expect(result).toEqual(expect.objectContaining({
      processed: true,
      status: 'completed',
      jobId: 'content_job_1',
      generatedCount: 2,
      llmSucceededCount: 1,
      fallbackCount: 1,
    }));
    expect(mockSaveManagedContentEntry).toHaveBeenCalledTimes(2);
    expect(mockSaveManagedContentEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'career-timing-2026',
        source: 'agent-llm:seo',
        meta: expect.objectContaining({
          contentGenerationJob: true,
        }),
      }),
      'admin_user'
    );
    expect(mockContentGenerationJobOperations.markCompleted).toHaveBeenCalledWith(
      'content_job_1',
      expect.objectContaining({
        generatedCount: 2,
        llmSucceededCount: 1,
        fallbackCount: 1,
        result: expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({
              slug: 'career-timing-2026',
            }),
          ]),
        }),
      })
    );
  });

  it('deduplicates slugs against existing content and same-batch entries', async () => {
    mockContentGenerationJobOperations.claimNextRunnable.mockReturnValue({
      id: 'content_job_dupe',
      userId: 'admin_user',
      status: 'running',
      request: {
        topic: '重复 slug',
      },
      attempts: 1,
      maxAttempts: 3,
      meta: {},
    });
    mockListManagedContentEntries.mockReturnValue([
      { slug: 'career-timing-2026' },
    ]);
    mockGenerateManagedContentDrafts.mockResolvedValue({
      entries: [
        createDraft(),
        createDraft({
          title: '第二篇',
        }),
      ],
      llmSucceededCount: 2,
      fallbackCount: 0,
    });

    await processNextContentGenerationJob();

    expect(mockSaveManagedContentEntry).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        slug: 'career-timing-2026-2',
      }),
      'admin_user'
    );
    expect(mockSaveManagedContentEntry).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        slug: 'career-timing-2026-3',
      }),
      'admin_user'
    );
  });

  it('marks retry when generation fails before max attempts', async () => {
    mockContentGenerationJobOperations.claimNextRunnable.mockReturnValue({
      id: 'content_job_retry',
      userId: 'admin_user',
      status: 'running',
      request: {
        topic: '失败重试',
      },
      attempts: 1,
      maxAttempts: 3,
      generatedCount: 0,
      llmSucceededCount: 0,
      fallbackCount: 0,
      meta: {},
    });
    mockContentGenerationJobOperations.getById.mockReturnValue({
      attempts: 1,
      maxAttempts: 3,
    });
    mockGenerateManagedContentDrafts.mockRejectedValue(new Error('LLM_TIMEOUT'));

    const result = await processNextContentGenerationJob();

    expect(result).toEqual(expect.objectContaining({
      processed: true,
      status: 'retry',
      jobId: 'content_job_retry',
      reason: 'LLM_TIMEOUT',
    }));
    expect(mockContentGenerationJobOperations.markRetry).toHaveBeenCalledWith(
      'content_job_retry',
      expect.objectContaining({
        lastError: 'LLM_TIMEOUT',
        generatedCount: 0,
        llmSucceededCount: 0,
        fallbackCount: 0,
      })
    );
  });
});
