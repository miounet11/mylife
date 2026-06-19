const mockCreateTransport = jest.fn();

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: (...args: unknown[]) => mockCreateTransport(...args),
  },
}));

function setConfiguredMailEnv(overrides: Record<string, string | undefined> = {}) {
  process.env.MAIL_FROM = 'sender@example.com';
  process.env.MAIL_SMTP_HOST = 'smtp.example.com';
  process.env.MAIL_AUTH_USER = 'sender@example.com';
  process.env.MAIL_AUTH_PASSWORD = 'secret';

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('mail runtime configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.MAIL_FROM;
    delete process.env.MAIL_FROM_NAME;
    delete process.env.EMAIL_APP_NAME;
    delete process.env.MAIL_SMTP_HOST;
    delete process.env.MAIL_SMTP_HOST_IP;
    delete process.env.MAIL_SMTP_PORT;
    delete process.env.MAIL_SMTP_SECURE;
    delete process.env.MAIL_SMTP_IGNORE_TLS;
    delete process.env.MAIL_SMTP_DISABLE_AUTH;
    delete process.env.MAIL_SMTP_TIMEOUT_MS;
    delete process.env.MAIL_SMTP_CONNECTION_TIMEOUT_MS;
    delete process.env.MAIL_SMTP_GREETING_TIMEOUT_MS;
    delete process.env.MAIL_SMTP_SOCKET_TIMEOUT_MS;
    delete process.env.MAIL_AUTH_USER;
    delete process.env.MAIL_AUTH_PASSWORD;
    delete process.env.MAIL_PASSWORD;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not use code-level SMTP defaults when mail env is missing', async () => {
    const { getMailDebugConfig, sendMailV2 } = await import('@/mail');

    expect(getMailDebugConfig()).toEqual(expect.objectContaining({
      host: '',
      from: '',
      authUser: '',
      configured: false,
    }));

    const result = await sendMailV2({
      to: 'user@example.com',
      subject: 'test',
      content: 'hello',
    });

    expect(result).toEqual(expect.objectContaining({
      success: false,
      errorCode: 'MAIL_NOT_CONFIGURED',
    }));
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });

  it('applies bounded SMTP timeouts to send operations', async () => {
    setConfiguredMailEnv({
      MAIL_SMTP_TIMEOUT_MS: '7000',
      MAIL_SMTP_CONNECTION_TIMEOUT_MS: '9000',
      MAIL_SMTP_GREETING_TIMEOUT_MS: 'abc',
      MAIL_SMTP_SOCKET_TIMEOUT_MS: '70000',
    });
    const close = jest.fn();
    const sendMail = jest.fn().mockResolvedValue({
      messageId: 'message-1',
      accepted: ['user@example.com'],
      rejected: [],
    });
    mockCreateTransport.mockReturnValue({ sendMail, close });

    const { getMailDebugConfig, sendMailV2 } = await import('@/mail');
    const debugConfig = getMailDebugConfig();

    expect(debugConfig).toEqual(expect.objectContaining({
      connectionTimeoutMs: 9000,
      greetingTimeoutMs: 7000,
      socketTimeoutMs: 7000,
      configured: true,
    }));

    const result = await sendMailV2({
      to: 'user@example.com',
      subject: 'test',
      content: 'hello',
    });

    expect(result.success).toBe(true);
    expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.example.com',
      connectionTimeout: 9000,
      greetingTimeout: 7000,
      socketTimeout: 7000,
      auth: {
        user: 'sender@example.com',
        pass: 'secret',
      },
    }));
    expect(close).toHaveBeenCalled();
  });

  it('verifies and closes the SMTP transporter when configured', async () => {
    setConfiguredMailEnv();
    const close = jest.fn();
    const verify = jest.fn().mockResolvedValue(true);
    mockCreateTransport.mockReturnValue({ verify, close });

    const { verifyMailConnection } = await import('@/mail');
    const result = await verifyMailConnection();

    expect(result.success).toBe(true);
    expect(verify).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
