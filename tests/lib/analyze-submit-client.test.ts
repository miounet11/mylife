import fs from 'fs';
import path from 'path';

describe('analyze submit client stability', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'components/fortune-form/use-analyze-submit.ts'),
    'utf8',
  );

  it('bounds streamed analyze requests with total and idle timeouts', () => {
    expect(source).toContain('ANALYZE_REQUEST_TIMEOUT_MS = 90_000');
    expect(source).toContain('ANALYZE_IDLE_TIMEOUT_MS = 45_000');
    expect(source).toContain("controller.abort('request-timeout')");
    expect(source).toContain("controller.abort('idle-timeout')");
    expect(source).toContain('refreshIdleTimeout()');
  });

  it('clears analyze timers when requests finish, fail, or unmount', () => {
    expect(source).toContain('clearTimeout(timeoutRef.current)');
    expect(source).toContain('clearTimeout(idleTimeoutRef.current)');
    expect(source).toContain('requestRef.current?.abort()');
  });

  it('surfaces a recoverable message for timed-out analyze connections', () => {
    expect(source).toContain("reason === 'request-timeout' || reason === 'idle-timeout'");
    expect(source).toContain('本次连接等待时间过长');
  });
});
