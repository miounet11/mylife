const mockEnqueueContentGenerationJob = jest.fn();

jest.mock('@/lib/content-generation-jobs', () => ({
  enqueueContentGenerationJob: (...args: unknown[]) => mockEnqueueContentGenerationJob(...args),
}));

import {
  enqueuePublicContentOpportunityDraftJobs,
  evaluatePublicContentOpportunities,
  extractPublicContentOpportunities,
  sanitizePublicOpportunityText,
} from '@/lib/public-content-opportunity';

describe('public content opportunity extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueContentGenerationJob.mockImplementation(({ input }) => ({
      id: `job_${input.topic}`,
      status: 'pending',
      request: input,
    }));
  });

  test('defaults to one valuable opportunity from a focused public question', () => {
    const opportunities = extractPublicContentOpportunities({
      id: 'q1',
      type: 'question',
      isPublic: true,
      href: '/questions/q1',
      question: '我应该怎么判断 2027 年事业窗口，要不要跳槽去新行业？',
      answer: '先确认资源、窗口和关键承诺，再推进事业动作。',
      contextLabel: '身旺格 · 甲木',
      actionPoints: ['先拿到关键承诺，再扩大投入。'],
    });

    expect(opportunities).toHaveLength(1);
    expect(opportunities[0]).toEqual(expect.objectContaining({
      sourceId: 'q1',
      sourceType: 'question',
      risk: 'low',
      contentType: 'case',
      topic: expect.stringContaining('事业窗口'),
      generationInput: expect.objectContaining({
        platform: 'public-growth',
        status: 'draft',
        featured: false,
        topic: expect.stringContaining('事业窗口'),
      }),
      meta: expect.objectContaining({
        publicContentOpportunity: true,
        draftOnly: true,
      }),
    }));
  });

  test('expands to at most three only when multiple strong non-duplicate intents exist', () => {
    const opportunities = extractPublicContentOpportunities({
      id: 'q_multi',
      type: 'question',
      isPublic: true,
      question: '2027 年我想跳槽创业，同时担心财务现金流，也想知道婚姻关系怎么沟通，下一步应该如何判断风险和机会？',
      answer: '这个问题要拆成事业窗口、财富投入边界、关系沟通节奏三个部分，各自验证后再行动。',
      contextLabel: '匿名公开案例',
      analysisPoints: ['事业、财富、关系三个意图都很明确。'],
      actionPoints: ['先拆决策顺序。', '再列风险边界。', '最后确认可验证动作。'],
      tags: ['事业', '财富', '关系'],
    }, { maxOpportunities: 3 });

    expect(opportunities).toHaveLength(3);
    expect(opportunities.map((item) => item.topic).join('\n')).toContain('事业窗口');
    expect(opportunities.map((item) => item.topic).join('\n')).toContain('关系问题');
    expect(opportunities.map((item) => item.topic).join('\n')).toContain('财务选择');
  });

  test('redacts private identity details before building source signals', () => {
    const clean = sanitizePublicOpportunityText('我叫张三，1992年5月1日出生，出生地 北京市朝阳区，微信 wxabcd1234，手机号 13812345678，事业怎么看？', 260);

    expect(clean).not.toContain('张三');
    expect(clean).not.toContain('1992年5月1日');
    expect(clean).not.toContain('北京市朝阳区');
    expect(clean).not.toContain('wxabcd1234');
    expect(clean).not.toContain('13812345678');
    expect(clean).toContain('[已脱敏]');
  });

  test('rejects privacy-heavy or high-risk sources instead of creating content farm drafts', () => {
    const evaluation = evaluatePublicContentOpportunities({
      id: 'q_privacy',
      type: 'question',
      isPublic: true,
      question: '我叫张三，1992年5月1日出生，出生地 北京市朝阳区，微信 wxabcd1234，手机号 13812345678，邮箱 a@example.com，帮我算事业。',
    });

    expect(evaluation.accepted).toHaveLength(0);
    expect(evaluation.rejected[0]).toEqual(expect.objectContaining({
      reason: 'privacy-heavy',
      risk: 'high',
    }));
  });

  test('rejects low-signal generic input', () => {
    const evaluation = evaluatePublicContentOpportunities({
      id: 'c1',
      type: 'comment',
      isPublic: true,
      comments: [{ body: '看看' }],
    });

    expect(evaluation.accepted).toHaveLength(0);
    expect(evaluation.rejected[0]).toEqual(expect.objectContaining({
      reason: 'low-signal',
    }));
  });

  test('rejects private source', () => {
    const evaluation = evaluatePublicContentOpportunities({
      id: 'r_private',
      type: 'report',
      isPublic: false,
      summary: '事业窗口很明确。',
    });

    expect(evaluation.accepted).toHaveLength(0);
    expect(evaluation.rejected[0]).toEqual(expect.objectContaining({
      reason: 'private-source',
    }));
  });

  test('enqueues draft generation jobs only for accepted opportunities', () => {
    const result = enqueuePublicContentOpportunityDraftJobs({
      userId: 'system_public_growth',
      source: {
        id: 'q_enqueue',
        type: 'question',
        isPublic: true,
        href: '/questions/q_enqueue',
        question: '2027 年事业窗口怎么判断，要不要跳槽？',
        answer: '先看阶段、资源和行动边界。',
        actionPoints: ['先验证岗位承诺。'],
      },
    });

    expect(result.opportunities).toHaveLength(1);
    expect(result.jobs).toHaveLength(1);
    expect(mockEnqueueContentGenerationJob).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'system_public_growth',
      input: expect.objectContaining({
        platform: 'public-growth',
        status: 'draft',
        topic: expect.stringContaining('事业窗口'),
      }),
      meta: expect.objectContaining({
        publicContentOpportunity: true,
        sourceId: 'q_enqueue',
        draftOnly: true,
      }),
    }));
  });

  test('does not enqueue rejected low-quality sources', () => {
    const result = enqueuePublicContentOpportunityDraftJobs({
      userId: 'system_public_growth',
      source: {
        id: 'q_bad',
        type: 'question',
        isPublic: true,
        question: '看看',
      },
    });

    expect(result.opportunities).toHaveLength(0);
    expect(result.jobs).toHaveLength(0);
    expect(result.rejected[0]).toEqual(expect.objectContaining({
      reason: 'low-signal',
    }));
    expect(mockEnqueueContentGenerationJob).not.toHaveBeenCalled();
  });
});
