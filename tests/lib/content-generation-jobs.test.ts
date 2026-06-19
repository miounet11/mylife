const mockGenerateManagedContentDrafts = jest.fn();
const mockContentGenerationJobOperations = {
  create: jest.fn(),
  getById: jest.fn(),
  claimNextRunnable: jest.fn(),
  claimNextRunnableStandard: jest.fn(),
  claimNextWorldYiV2Runnable: jest.fn(),
  markCompleted: jest.fn(),
  markRetry: jest.fn(),
  markFailed: jest.fn(),
};
const mockListManagedContentEntries = jest.fn();
const mockSaveManagedContentEntry = jest.fn();

jest.mock('@/lib/content-generation', () => {
  const actual = jest.requireActual('@/lib/content-generation');
  return {
    ...actual,
    generateManagedContentDrafts: (...args: unknown[]) => mockGenerateManagedContentDrafts(...args),
  };
});

jest.mock('@/lib/database', () => ({
  contentGenerationJobOperations: mockContentGenerationJobOperations,
}));

jest.mock('@/lib/content-store', () => ({
  listManagedContentEntries: (...args: unknown[]) => mockListManagedContentEntries(...args),
  saveManagedContentEntry: (...args: unknown[]) => mockSaveManagedContentEntry(...args),
}));

import {
  claimNextWorldYiV2Task,
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
    excerpt: '这是一篇用于验证内容生成队列保存路径的测试文章摘要，覆盖真实用户问题、判断变量、现实代价、执行节奏和后续个人测算动作，确保质量门槛能被稳定满足。',
    category: '职业',
    readTime: '6 分钟',
    tags: ['职业', '时机', '决策', '流年'],
    featured: false,
    seoTitle: '2026 职业节奏判断完整指南',
    seoDescription: '验证内容生成队列保存路径，并确保草稿具备完整搜索摘要、用户价值、现实误区、执行节奏、风险边界、判断变量和后续个人测算动作说明，避免短内容混进公开内容库。',
    sections: [
      { title: '第一节', paragraphs: ['第一段内容长度足够，用来说明职业节奏判断不能只看单一信号，而要结合现实岗位、行业周期和个人状态。', '第二段内容同样足够长，用来模拟真实内容如何把用户焦虑转成可检查的行动变量。'] },
      { title: '第二节', paragraphs: ['第一段内容长度足够，用来解释换岗时机需要同时考虑外部机会、内部能力和家庭约束。', '第二段内容同样足够长，用来说明判断窗口不是确定承诺，而是帮助用户减少盲目行动。'] },
      { title: '第三节', paragraphs: ['第一段内容长度足够，用来覆盖常见误区，包括过度依赖单一结论和忽略现实成本。', '第二段内容同样足够长，用来强调公开内容必须能承接到更具体的个人测算。'] },
      { title: '第四节', paragraphs: ['第一段内容长度足够，用来说明用户下一步应该整理真实问题、出生信息和当前选择。', '第二段内容同样足够长，用来验证保存路径里的质量评分、摘要和元数据都能稳定落库。'] },
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
    mockContentGenerationJobOperations.markCompleted.mockReturnValue({ changes: 1 });
    mockContentGenerationJobOperations.markRetry.mockReturnValue({ changes: 1 });
    mockContentGenerationJobOperations.markFailed.mockReturnValue({ changes: 1 });
    mockContentGenerationJobOperations.getById.mockReturnValue(null);
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
    mockContentGenerationJobOperations.claimNextRunnableStandard.mockReturnValue({
      id: 'content_job_1',
      userId: 'admin_user',
      status: 'running',
      request: {
        topic: '2026 职业节奏判断',
        contentType: 'knowledge',
      },
      attempts: 1,
      maxAttempts: 3,
      lockedAt: 'lease-content-job-1',
      meta: {
        topic: '2026 职业节奏判断',
      },
    });
    mockContentGenerationJobOperations.getById.mockReturnValue({
      id: 'content_job_1',
      status: 'running',
      lockedAt: 'lease-content-job-1',
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

  it('does not save generated content when the claimed job lease is lost', async () => {
    mockContentGenerationJobOperations.claimNextRunnableStandard.mockReturnValue({
      id: 'content_job_lease_lost',
      userId: 'admin_user',
      status: 'running',
      request: {
        topic: '租约丢失',
      },
      attempts: 1,
      maxAttempts: 3,
      lockedAt: 'old-lease',
      meta: {},
    });
    mockContentGenerationJobOperations.getById.mockReturnValue({
      id: 'content_job_lease_lost',
      status: 'running',
      lockedAt: 'new-lease',
    });
    mockGenerateManagedContentDrafts.mockResolvedValue({
      entries: [createDraft()],
      llmSucceededCount: 1,
      fallbackCount: 0,
    });

    const result = await processNextContentGenerationJob();

    expect(result).toEqual(expect.objectContaining({
      processed: true,
      status: 'lease_lost',
      jobId: 'content_job_lease_lost',
    }));
    expect(mockSaveManagedContentEntry).not.toHaveBeenCalled();
    expect(mockContentGenerationJobOperations.markCompleted).not.toHaveBeenCalled();
  });

  it('deduplicates slugs against existing content and same-batch entries', async () => {
    mockContentGenerationJobOperations.claimNextRunnableStandard.mockReturnValue({
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
    mockContentGenerationJobOperations.claimNextRunnableStandard.mockReturnValue({
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

  it('standard processor claims only standard content jobs', async () => {
    mockContentGenerationJobOperations.claimNextRunnableStandard.mockReturnValue(null);

    const result = await processNextContentGenerationJob();

    expect(result).toEqual(expect.objectContaining({
      processed: false,
      reason: 'empty',
    }));
    expect(mockContentGenerationJobOperations.claimNextRunnableStandard).toHaveBeenCalledWith(expect.any(Number));
    expect(mockContentGenerationJobOperations.claimNextRunnable).not.toHaveBeenCalled();
    expect(mockContentGenerationJobOperations.claimNextWorldYiV2Runnable).not.toHaveBeenCalled();
  });

  it('world yi v2 worker claims only world yi v2 jobs without retrying standard jobs', () => {
    mockContentGenerationJobOperations.claimNextWorldYiV2Runnable.mockReturnValue({
      id: 'worldyi_v2_job',
      status: 'running',
      meta: {
        isWorldYiV2HighConc: true,
      },
    });

    const job = claimNextWorldYiV2Task(45);

    expect(job).toEqual(expect.objectContaining({
      id: 'worldyi_v2_job',
    }));
    expect(mockContentGenerationJobOperations.claimNextWorldYiV2Runnable).toHaveBeenCalledWith(45);
    expect(mockContentGenerationJobOperations.claimNextRunnable).not.toHaveBeenCalled();
    expect(mockContentGenerationJobOperations.markRetry).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        lastError: 'MISROUTED_FROM_WORLDYI_V2_CLAIM',
      }),
    );
  });
});
