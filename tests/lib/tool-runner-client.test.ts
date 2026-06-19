import fs from 'fs';
import path from 'path';

describe('tool runner client request stability', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'components/tool-runner.tsx'),
    'utf8',
  );

  it('bounds tool run requests with the shared timeout helper', () => {
    expect(source).toContain('TOOL_RUN_TIMEOUT_MS = 20_000');
    expect(source).toContain('fetchJsonWithTimeout<any>');
    expect(source).toContain("timeoutReason: 'tool-run-timeout'");
    expect(source).toContain('工具运行等待时间过长，请稍后重试');
    expect(source).not.toContain("await fetch('/api/tools/run'");
  });
});
