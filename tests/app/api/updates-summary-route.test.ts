jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/lib/user-utils', () => ({
  getCurrentUserId: jest.fn(),
}));

jest.mock('@/lib/updates-summary', () => ({
  buildUpdatesSummary: jest.fn(),
}));

import { GET } from '@/app/api/updates/summary/route';
import { getAuthSession } from '@/lib/auth';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { getCurrentUserId } from '@/lib/user-utils';

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;
const mockedBuildUpdatesSummary = buildUpdatesSummary as jest.MockedFunction<typeof buildUpdatesSummary>;

function createNextRequest(url: string) {
  return {
    nextUrl: new URL(url),
  } as any;
}

describe('GET /api/updates/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBuildUpdatesSummary.mockReturnValue({
      reportCount: 1,
      focusReport: {
        id: 'report_guest_updates',
        reportVersion: 'v4',
      },
    } as any);
  });

  it('returns summary for current guest session without requiring verified email', async () => {
    mockedGetAuthSession.mockResolvedValue({
      authenticated: false,
      user: null,
    } as any);
    mockedGetCurrentUserId.mockResolvedValue('guest_updates_1');

    const response = await GET(createNextRequest('http://localhost/api/updates/summary?reportId=report_guest_updates'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.authenticated).toBe(false);
    expect(payload.hasSessionContext).toBe(true);
    expect(mockedBuildUpdatesSummary).toHaveBeenCalledWith({
      userId: 'guest_updates_1',
      email: '',
      requestedReportId: 'report_guest_updates',
    });
    expect(payload.data.focusReport.id).toBe('report_guest_updates');
  });

  it('returns empty state when no browser session exists', async () => {
    mockedGetAuthSession.mockResolvedValue({
      authenticated: false,
      user: null,
    } as any);
    mockedGetCurrentUserId.mockResolvedValue(null);

    const response = await GET(createNextRequest('http://localhost/api/updates/summary'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.authenticated).toBe(false);
    expect(payload.hasSessionContext).toBe(false);
    expect(payload.data).toBeNull();
    expect(mockedBuildUpdatesSummary).not.toHaveBeenCalled();
  });
});
