import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  const config = { windowMs: 1000, maxRequests: 3 };

  it('allows requests within limit', () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  it('blocks requests exceeding limit', () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks remaining count', () => {
    const key = `test-remaining-${Date.now()}`;
    expect(checkRateLimit(key, config).remaining).toBe(2);
    expect(checkRateLimit(key, config).remaining).toBe(1);
    expect(checkRateLimit(key, config).remaining).toBe(0);
  });

  it('resets after window expires', async () => {
    const shortConfig = { windowMs: 50, maxRequests: 1 };
    const key = `test-reset-${Date.now()}`;
    checkRateLimit(key, shortConfig);
    expect(checkRateLimit(key, shortConfig).allowed).toBe(false);
    await new Promise(r => setTimeout(r, 60));
    expect(checkRateLimit(key, shortConfig).allowed).toBe(true);
  });

  it('has predefined configs', () => {
    expect(RATE_LIMITS.analyze.maxRequests).toBe(5);
    expect(RATE_LIMITS.chat.maxRequests).toBe(10);
    expect(RATE_LIMITS.general.maxRequests).toBe(30);
  });
});
