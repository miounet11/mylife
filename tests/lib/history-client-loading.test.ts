import fs from 'fs';
import path from 'path';

describe('history client loading stability', () => {
  const historyPageSource = fs.readFileSync(
    path.join(process.cwd(), 'app/history/page.tsx'),
    'utf8',
  );
  const analyzeWorkspaceSource = fs.readFileSync(
    path.join(process.cwd(), 'components/analyze-workspace.tsx'),
    'utf8',
  );

  it('bounds history page loading with timeout and unmount abort', () => {
    expect(historyPageSource).toContain('HISTORY_PAGE_TIMEOUT_MS = 12_000');
    expect(historyPageSource).toContain('fetchJsonWithTimeout<HistoryResponse>');
    expect(historyPageSource).toContain("timeoutReason: 'history-page-timeout'");
    expect(historyPageSource).toContain("abortControllerRef(controllerRef, 'history-page-unmounted')");
    expect(historyPageSource).toContain('加载历史等待时间过长，请稍后重试');
  });

  it('bounds analyze workspace history loading with timeout and unmount abort', () => {
    expect(analyzeWorkspaceSource).toContain('ANALYZE_HISTORY_TIMEOUT_MS = 12_000');
    expect(analyzeWorkspaceSource).toContain('fetchJsonWithTimeout<HistoryResponse>');
    expect(analyzeWorkspaceSource).toContain("timeoutReason: 'analyze-history-timeout'");
    expect(analyzeWorkspaceSource).toContain("abortControllerRef(controllerRef, 'analyze-workspace-unmounted')");
    expect(analyzeWorkspaceSource).toContain('加载判断列表等待时间过长，请稍后重试');
  });
});
