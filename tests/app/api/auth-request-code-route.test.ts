const mockCreateLoginCode = jest.fn();
const mockDeletePendingLoginCode = jest.fn();
const mockAdminPasswordRequiredFor = jest.fn();
const mockIsEmailDeliveryConfigured = jest.fn();
const mockSendLoginCodeEmail = jest.fn();
const mockShouldShowAuthPreviewCode = jest.fn();
const mockTrackServerEvent = jest.fn();

jest.mock('@/lib/auth', () => ({
  adminPasswordRequiredFor: (...args: unknown[]) => mockAdminPasswordRequiredFor(...args),
  createLoginCode: (...args: unknown[]) => mockCreateLoginCode(...args),
  deletePendingLoginCode: (...args: unknown[]) => mockDeletePendingLoginCode(...args),
}));

jest.mock('@/lib/env', () => ({
  shouldShowAuthPreviewCode: (...args: unknown[]) => mockShouldShowAuthPreviewCode(...args),
}));

jest.mock('@/lib/email', () => ({
  isEmailDeliveryConfigured: (...args: unknown[]) => mockIsEmailDeliveryConfigured(...args),
  sendLoginCodeEmail: (...args: unknown[]) => mockSendLoginCodeEmail(...args),
}));

jest.mock('@/lib/analytics', () => ({
  trackServerEvent: (...args: unknown[]) => mockTrackServerEvent(...args),
}));

import { POST } from '@/app/api/auth/request-code/route';

function createRequest(email: string) {
  return new Request('http://localhost/api/auth/request-code', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'jest',
    },
    body: JSON.stringify({ email }),
  }) as any;
}

describe('POST /api/auth/request-code', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateLoginCode.mockReturnValue({
      email: 'user@example.com',
      code: '123456',
      expiresAt: '2026-06-06T00:15:00.000Z',
    });
    mockDeletePendingLoginCode.mockReturnValue({ changes: 1 });
    mockAdminPasswordRequiredFor.mockReturnValue(false);
    mockIsEmailDeliveryConfigured.mockReturnValue(true);
    mockSendLoginCodeEmail.mockResolvedValue({ success: true, message: 'ok' });
    mockShouldShowAuthPreviewCode.mockReturnValue(false);
  });

  it('returns success without deleting the code when email delivery succeeds', async () => {
    const response = await POST(createRequest('user@example.com'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockSendLoginCodeEmail).toHaveBeenCalledWith(
      'user@example.com',
      '123456',
      '2026-06-06T00:15:00.000Z',
    );
    expect(mockDeletePendingLoginCode).not.toHaveBeenCalled();
  });

  it('deletes the pending login code when configured email delivery returns failure', async () => {
    mockSendLoginCodeEmail.mockResolvedValue({ success: false, message: 'SMTP timeout' });

    const response = await POST(createRequest('user@example.com'));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      success: false,
      error: '邮件服务暂时不可用，请稍后重试',
    });
    expect(mockDeletePendingLoginCode).toHaveBeenCalledWith('user@example.com', '123456');
    expect(mockTrackServerEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'email_delivery_failed',
      meta: expect.objectContaining({
        channel: 'auth_code',
        reason: 'SMTP timeout',
      }),
    }));
  });

  it('deletes the pending login code when email delivery throws', async () => {
    mockSendLoginCodeEmail.mockRejectedValue(new Error('socket timeout'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await POST(createRequest('user@example.com'));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.success).toBe(false);
    expect(mockDeletePendingLoginCode).toHaveBeenCalledWith('user@example.com', '123456');
    expect(mockTrackServerEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'email_delivery_failed',
      meta: expect.objectContaining({
        reason: 'socket timeout',
      }),
    }));

    consoleSpy.mockRestore();
  });

  it('does not attempt delivery when email is not configured', async () => {
    mockIsEmailDeliveryConfigured.mockReturnValue(false);
    mockShouldShowAuthPreviewCode.mockReturnValue(true);

    const response = await POST(createRequest('user@example.com'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.deliveryConfigured).toBe(false);
    expect(payload.previewCode).toBe('123456');
    expect(mockSendLoginCodeEmail).not.toHaveBeenCalled();
    expect(mockDeletePendingLoginCode).not.toHaveBeenCalled();
  });
});
