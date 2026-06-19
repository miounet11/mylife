import fs from 'fs';
import path from 'path';

describe('newsletter client request stability', () => {
  const signupSource = fs.readFileSync(
    path.join(process.cwd(), 'components/newsletter-signup.tsx'),
    'utf8',
  );
  const managerSource = fs.readFileSync(
    path.join(process.cwd(), 'components/newsletter-manager.tsx'),
    'utf8',
  );
  const timingBarSource = fs.readFileSync(
    path.join(process.cwd(), 'components/result-v2/timing-subscribe-bar.tsx'),
    'utf8',
  );

  it('bounds newsletter signup submits with the shared timeout helper', () => {
    expect(signupSource).toContain('NEWSLETTER_SIGNUP_TIMEOUT_MS = 12_000');
    expect(signupSource).toContain('fetchJsonWithTimeout<NewsletterSignupResponse>');
    expect(signupSource).toContain("timeoutReason: 'newsletter-signup-timeout'");
    expect(signupSource).toContain('订阅等待时间过长，请稍后重试');
    expect(signupSource).not.toContain("await fetch('/api/newsletter'");
  });

  it('bounds newsletter manager lookup and mutation requests', () => {
    expect(managerSource).toContain('NEWSLETTER_MANAGER_TIMEOUT_MS = 12_000');
    expect(managerSource).toContain('fetchJsonWithTimeout<NewsletterLookupResponse>');
    expect(managerSource).toContain('fetchJsonWithTimeout<NewsletterUpdateResponse>');
    expect(managerSource).toContain("timeoutReason: 'newsletter-manager-lookup-timeout'");
    expect(managerSource).toContain("timeoutReason: mode === 'subscribe' ? 'newsletter-manager-subscribe-timeout' : 'newsletter-manager-unsubscribe-timeout'");
    expect(managerSource).toContain('查询订阅等待时间过长，请稍后重试');
    expect(managerSource).toContain('恢复订阅等待时间过长，请稍后重试');
    expect(managerSource).toContain('退订等待时间过长，请稍后重试');
    expect(managerSource).not.toContain('await fetch(`/api/newsletter');
    expect(managerSource).not.toContain("await fetch('/api/newsletter'");
  });

  it('bounds timing subscribe bar submits with the shared timeout helper', () => {
    expect(timingBarSource).toContain('TIMING_SUBSCRIBE_TIMEOUT_MS = 12_000');
    expect(timingBarSource).toContain('fetchJsonWithTimeout<TimingSubscribeResponse>');
    expect(timingBarSource).toContain("timeoutReason: 'timing-subscribe-timeout'");
    expect(timingBarSource).toContain('订阅等待时间过长，请稍后重试');
    expect(timingBarSource).not.toContain("await fetch('/api/newsletter'");
  });
});
