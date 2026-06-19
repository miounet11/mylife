import fs from 'fs';
import path from 'path';

describe('tool premium request panel client request stability', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'components/tool-premium-request-panel.tsx'),
    'utf8',
  );

  it('bounds tool premium service submits with the shared timeout helper', () => {
    expect(source).toContain('TOOL_PREMIUM_SERVICE_TIMEOUT_MS = 12_000');
    expect(source).toContain('fetchJsonWithTimeout<ToolPremiumServiceSubmitResponse>');
    expect(source).toContain('isAbortLikeError(requestError)');
    expect(source).toContain("timeoutReason: 'tool-premium-service-submit-timeout'");
    expect(source).toContain('专项需求提交等待时间过长，请稍后重试');
    expect(source).not.toContain("await fetch('/api/premium-services'");
  });
});
