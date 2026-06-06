jest.mock('@/lib/user-utils', () => ({
  getOrCreateGuestUserId: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  fortuneOperations: {
    getById: jest.fn(),
    getByUserId: jest.fn(),
  },
  toolSessionOperations: {
    create: jest.fn(),
    listByUser: jest.fn(),
  },
}));

jest.mock('@/lib/analytics', () => ({
  trackServerEvent: jest.fn(),
}));

jest.mock('@/lib/agentic-report/llm-client', () => ({
  callJsonLLM: jest.fn(),
}));

import { POST } from '@/app/api/tools/run/route';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { callJsonLLM } from '@/lib/agentic-report/llm-client';

const mockedGetOrCreateGuestUserId = getOrCreateGuestUserId as jest.MockedFunction<typeof getOrCreateGuestUserId>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedToolSessionOperations = toolSessionOperations as jest.Mocked<typeof toolSessionOperations>;
const mockedCallJsonLLM = callJsonLLM as jest.MockedFunction<typeof callJsonLLM>;

describe('POST /api/tools/run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetOrCreateGuestUserId.mockResolvedValue('guest_test_user');
    mockedToolSessionOperations.listByUser.mockReturnValue([]);
    mockedCallJsonLLM.mockResolvedValue(null);
  });

  test('rejects when the user has no report yet', async () => {
    mockedFortuneOperations.getByUserId.mockReturnValue([]);

    const response = await POST(new Request('http://localhost/api/tools/run', {
      method: 'POST',
      body: JSON.stringify({
        toolSlug: 'career-role-fit',
      }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.redirectTo).toBe('/analyze?toolSlug=career-role-fit&source=tool_run_required');
  });

  test('preserves tool intent and attribution source when report is missing', async () => {
    mockedFortuneOperations.getByUserId.mockReturnValue([]);

    const response = await POST(new Request('http://localhost/api/tools/run', {
      method: 'POST',
      body: JSON.stringify({
        toolSlug: 'career-role-fit',
        attribution: {
          source: 'knowledge_article:career-plan-source-context',
        },
      }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.redirectTo).toBe('/analyze?toolSlug=career-role-fit&source=tool_run_required%3Aknowledge_article%3Acareer-plan-source-context');
  });

  test('creates a completed tool session when report exists', async () => {
    mockedFortuneOperations.getByUserId.mockReturnValue([
      {
        id: 'report_1',
        userId: 'guest_test_user',
        name: '测试用户',
        birthDate: '1990-01-01',
        birthTime: '12:00',
        timezone: 8,
        gender: 'female',
        bazi: {},
        fiveElements: {},
        tenGods: {},
        pattern: { type: '事业结构', strength: 'strong', quality: 'good', description: '事业' },
        fortune: {},
        advice: { overall: '先缩窄一个真实问题。' },
        evidence: {},
        analysis: {
          opening: '当前更适合先看事业节奏。',
          explanation: '不要一次推进太多事。',
        },
      } as any,
    ]);

    const response = await POST(new Request('http://localhost/api/tools/run', {
      method: 'POST',
      body: JSON.stringify({
        toolSlug: 'career-role-fit',
        note: '我在想是否换岗',
        attribution: {
          eventName: 'result_cta_clicked',
          page: '/knowledge/test',
          source: 'content_conversion_panel',
          target: 'content_primary_tool',
          timestamp: '2026-03-31T00:00:00.000Z',
        },
      }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.tool.slug).toBe('career-role-fit');
    expect(payload.data.workflow.workflowId).toBe('tool-run-v1');
    expect(mockedToolSessionOperations.create).toHaveBeenCalledTimes(1);
    const sessionInput = mockedToolSessionOperations.create.mock.calls[0]?.[0] as any;
    expect(sessionInput.meta.workflow.workflowId).toBe('tool-run-v1');
    expect(sessionInput.meta.llmEnhancement.used).toBe(false);
    expect(sessionInput.meta.quality.score).toBeGreaterThan(0);
    expect(sessionInput.meta.conversion.score).toBeGreaterThan(0);
    expect(sessionInput.meta.orchestrationEvents.length).toBeGreaterThan(0);
    expect(sessionInput.meta.attribution).toEqual({
      eventName: 'result_cta_clicked',
      page: '/knowledge/test',
      source: 'content_conversion_panel',
      target: 'content_primary_tool',
      timestamp: '2026-03-31T00:00:00.000Z',
    });
  });

  test('merges llm enhancement into a tool session when available', async () => {
    mockedCallJsonLLM.mockResolvedValue({
      headline: '岗位匹配增强判断：先稳住主线，再验证换岗窗口',
      summary: '这次判断显示，当前不是简单辞职问题，而是岗位结构、阶段窗口和表达接口需要一起校准。',
      recommendedAction: '先用两周时间验证岗位内是否还能调整职责边界，再决定是否外部投递。',
      riskReminder: '不要因为短期不舒服就把所有问题归因到行业或公司，先确认真正消耗点。',
      whyItMatches: '这个工具匹配当前报告里的事业节奏与角色压力，也承接了你的补充问题。',
      evidence: ['报告显示事业结构需要缩窄。', '补充问题集中在是否换岗。', '当前工具适合拆角色边界。'],
      premiumPreview: ['深测可展开未来 3-6 个月窗口。', '深测可比较留岗、转岗和外部机会。', '深测可给出谈判和投递顺序。'],
      deepDiveSections: [
        { heading: '先看结构', body: '你现在要先判断岗位本身是否还有调整空间。' },
        { heading: '再看窗口', body: '窗口不只是时间，也包括组织是否给你试探空间。' },
        { heading: '最后看动作', body: '先做低成本验证，再做高成本切换。' },
      ],
      conversionBridge: '如果你需要把留岗、转岗、投递拆成路线，可以进入深测版。',
    } as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([
      {
        id: 'report_2',
        userId: 'guest_test_user',
        name: '测试用户',
        birthDate: '1990-01-01',
        birthTime: '12:00',
        timezone: 8,
        gender: 'female',
        bazi: {},
        fiveElements: {},
        tenGods: {},
        pattern: { type: '事业结构', strength: 'strong', quality: 'good', description: '事业' },
        fortune: {},
        advice: { overall: '先缩窄一个真实问题。' },
        evidence: {},
        analysis: {
          opening: '当前更适合先看事业节奏。',
          explanation: '不要一次推进太多事。',
        },
      } as any,
    ]);

    const response = await POST(new Request('http://localhost/api/tools/run', {
      method: 'POST',
      body: JSON.stringify({
        toolSlug: 'career-role-fit',
        note: '我在想是否换岗',
      }),
    }) as any);

    expect(response.status).toBe(200);
    expect(mockedCallJsonLLM).toHaveBeenCalledWith(expect.objectContaining({
      model: 'grok-420-fast',
      modelChain: ['grok-420-fast', 'auto'],
    }));
    const session = mockedToolSessionOperations.create.mock.calls[0]?.[0] as any;
    expect(session.result.headline).toContain('岗位匹配增强判断');
    expect(session.meta.llmEnhancement.used).toBe(true);
    expect(session.meta.llmEnhancement.deepDiveSections).toHaveLength(3);
    expect(session.meta.quality.score).toBeGreaterThanOrEqual(78);
    expect(session.meta.conversion.tier).toMatch(/high|medium/);
  });
});
