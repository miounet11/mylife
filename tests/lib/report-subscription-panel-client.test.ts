import fs from 'fs';
import path from 'path';

describe('report subscription panel client request stability', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'components/report-subscription-panel.tsx'),
    'utf8',
  );

  it('bounds newsletter subscribes with the shared timeout helper', () => {
    expect(source).toContain('REPORT_SUBSCRIPTION_TIMEOUT_MS = 12_000');
    expect(source).toContain('fetchJsonWithTimeout<NewsletterSubscribeResponse>');
    expect(source).toContain('isAbortLikeError(requestError)');
    expect(source).toContain("timeoutReason: 'report-subscription-submit-timeout'");
    expect(source).toContain('订阅等待时间过长，请稍后重试');
    expect(source).not.toContain("await fetch('/api/newsletter'");
  });
});
