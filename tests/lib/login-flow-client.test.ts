import fs from 'fs';
import path from 'path';

describe('login flow client request stability', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'components/login-flow.tsx'),
    'utf8',
  );

  it('bounds auth request and verification waits with abortable requests', () => {
    expect(source).toContain('LOGIN_REQUEST_CODE_TIMEOUT_MS = 15_000');
    expect(source).toContain('LOGIN_VERIFY_TIMEOUT_MS = 10_000');
    expect(source).toContain('fetchJsonWithTimeout<any>');
    expect(source).toContain("abortControllerRef(requestCodeControllerRef, 'login-flow-unmounted')");
    expect(source).toContain("abortControllerRef(verifyCodeControllerRef, 'login-flow-unmounted')");
    expect(source).toContain("supersedeReason: 'login-flow-superseded'");
  });

  it('surfaces recoverable timeout messages instead of leaving buttons busy', () => {
    expect(source).toContain('获取验证码等待时间过长，请稍后重试');
    expect(source).toContain('登录验证等待时间过长，请稍后重试');
    expect(source).toContain('if (mountedRef.current) {');
    expect(source).toContain('setRequesting(false)');
    expect(source).toContain('setVerifying(false)');
  });
});
