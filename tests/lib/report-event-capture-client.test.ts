import fs from 'fs';
import path from 'path';

describe('report event capture client request stability', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'components/report-event-capture.tsx'),
    'utf8',
  );

  it('bounds result report event saves with the shared timeout helper', () => {
    expect(source).toContain('REPORT_EVENT_CAPTURE_TIMEOUT_MS = 12_000');
    expect(source).toContain('fetchJsonWithTimeout<EventSaveResponse>');
    expect(source).toContain('isAbortLikeError(requestError)');
    expect(source).toContain("timeoutReason: 'report-event-save-timeout'");
    expect(source).toContain("timeoutReason: 'report-past-event-save-timeout'");
    expect(source).not.toContain("await fetch('/api/events'");
  });

  it('surfaces recoverable timeout copy for both result report event save paths', () => {
    expect(source).toContain('保存事件等待时间过长，请稍后重试');
    expect(source).toContain('保存历史事件等待时间过长，请稍后重试');
    expect(source).toContain('网络异常，保存事件失败');
    expect(source).toContain('网络异常，保存历史事件失败');
  });
});
