jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/lib/user-utils', () => ({
  getCurrentUserId: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  fortuneOperations: {
    getByUserId: jest.fn(),
  },
  toolSessionOperations: {
    listByUser: jest.fn(),
  },
  reportJourneyEventOperations: {
    listByUser: jest.fn(),
  },
}));

jest.mock('@/lib/surface-journeys', () => ({
  buildPersonalizedJourney: jest.fn(() => ({
    heading: '下一步',
    description: '继续推进',
    journey: {
      reportCard: { href: '/analyze', title: '综合测算', description: '先测算', eyebrow: '报告' },
      toolCards: [],
      knowledgeCards: [],
      caseCards: [],
    },
  })),
}));

import { GET } from '@/app/api/journey/summary/route';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations, reportJourneyEventOperations, toolSessionOperations } from '@/lib/database';
import { getCurrentUserId } from '@/lib/user-utils';

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedToolSessionOperations = toolSessionOperations as jest.Mocked<typeof toolSessionOperations>;
const mockedReportJourneyEventOperations = reportJourneyEventOperations as jest.Mocked<typeof reportJourneyEventOperations>;

describe('GET /api/journey/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentUserId.mockResolvedValue(null);
    mockedGetAuthSession.mockResolvedValue({
      authenticated: true,
      user: {
        id: 'user_journey_summary',
        email: 'user@example.com',
        role: 'user',
      },
    } as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([
      {
        id: 'report_summary_1',
        userId: 'user_journey_summary',
        name: '测试用户',
        birthDate: '1990-01-01',
        birthTime: '08:00',
        timezone: 8,
        gender: 'female',
        bazi: {},
        fiveElements: {},
        tenGods: {},
        pattern: { type: '事业结构', strength: 'strong', quality: 'good', description: '事业' },
        fortune: {},
        advice: { career: '事业优先。' },
        evidence: {},
        analysis: {
          opening: '当前事业节奏明显。',
          explanation: '岗位和组织压力是重点。',
        },
      } as any,
    ]);
    mockedToolSessionOperations.listByUser.mockReturnValue([]);
    mockedReportJourneyEventOperations.listByUser.mockReturnValue([
      {
        id: 'rje_summary_1',
        userId: 'user_journey_summary',
        reportId: 'report_summary_1',
        workflowId: 'report-journey-v1',
        layerKey: 'category-report',
        actionTarget: 'report_journey_primary_category',
        category: 'relationship',
        toolSlug: 'relationship-pace-fit',
      },
    ] as any);
  });

  it('uses report journey events to personalize the growth hub', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedReportJourneyEventOperations.listByUser).toHaveBeenCalledWith('user_journey_summary', 20);
    expect(payload.data.growthHub.primaryTool.slug).toBe('relationship-pace-fit');
    expect(payload.data.growthHub.focusLine).toContain('主动点进');
  });

  it('uses current guest session data for unauthenticated users', async () => {
    mockedGetAuthSession.mockResolvedValueOnce({
      authenticated: false,
      user: null,
    } as any);
    mockedGetCurrentUserId.mockResolvedValueOnce('guest_journey_summary');
    mockedFortuneOperations.getByUserId.mockReturnValueOnce([]);
    mockedToolSessionOperations.listByUser.mockReturnValueOnce([]);
    mockedReportJourneyEventOperations.listByUser.mockReturnValueOnce([]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.authenticated).toBe(false);
    expect(payload.hasSessionContext).toBe(true);
    expect(payload.data.growthHub).not.toBeNull();
    expect(mockedReportJourneyEventOperations.listByUser).toHaveBeenCalledWith('guest_journey_summary', 20);
  });

  it('does not read journey events when no session exists', async () => {
    mockedGetAuthSession.mockResolvedValueOnce({
      authenticated: false,
      user: null,
    } as any);
    mockedGetCurrentUserId.mockResolvedValueOnce(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.authenticated).toBe(false);
    expect(payload.hasSessionContext).toBe(false);
    expect(payload.data.growthHub).toBeNull();
    expect(mockedReportJourneyEventOperations.listByUser).not.toHaveBeenCalled();
  });
});
