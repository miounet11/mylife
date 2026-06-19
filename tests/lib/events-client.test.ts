import fs from 'fs';
import path from 'path';

describe('events client request stability', () => {
  const eventsPageSource = fs.readFileSync(
    path.join(process.cwd(), 'app/events/page.tsx'),
    'utf8',
  );
  const chatEventsSource = fs.readFileSync(
    path.join(process.cwd(), 'components/ai-assistant-chat/use-chat-events.ts'),
    'utf8',
  );

  it('bounds events page load and mutation requests with the shared helper', () => {
    expect(eventsPageSource).toContain('EVENTS_LOAD_TIMEOUT_MS = 12_000');
    expect(eventsPageSource).toContain('EVENTS_SAVE_TIMEOUT_MS = 12_000');
    expect(eventsPageSource).toContain('EVENTS_DELETE_TIMEOUT_MS = 8_000');
    expect(eventsPageSource).toContain('fetchJsonWithTimeout<EventsResponse>');
    expect(eventsPageSource).toContain("timeoutReason: 'events-load-timeout'");
    expect(eventsPageSource).toContain("timeoutReason: isEditMode ? 'events-update-timeout' : 'events-create-timeout'");
    expect(eventsPageSource).toContain("timeoutReason: 'events-delete-timeout'");
    expect(eventsPageSource).toContain("timeoutReason: 'events-reminder-timeout'");
    expect(eventsPageSource).toContain("timeoutReason: 'events-feedback-timeout'");
    expect(eventsPageSource).not.toContain("await fetch('/api/events'");
  });

  it('surfaces recoverable timeout copy for event operations', () => {
    expect(eventsPageSource).toContain('加载事件等待时间过长，请稍后重试');
    expect(eventsPageSource).toContain('创建事件等待时间过长，请稍后重试');
    expect(eventsPageSource).toContain('更新事件等待时间过长，请稍后重试');
    expect(eventsPageSource).toContain('删除事件等待时间过长，请稍后重试');
    expect(eventsPageSource).toContain('提醒更新等待时间过长，请稍后重试');
    expect(eventsPageSource).toContain('验证结果保存等待时间过长，请稍后重试');
  });

  it('bounds chat-to-event saves with the shared helper', () => {
    expect(chatEventsSource).toContain('CHAT_EVENT_SAVE_TIMEOUT_MS = 12_000');
    expect(chatEventsSource).toContain('fetchJsonWithTimeout<any>');
    expect(chatEventsSource).toContain("timeoutReason: 'chat-event-save-timeout'");
    expect(chatEventsSource).toContain('保存事件等待时间过长，请稍后重试');
    expect(chatEventsSource).not.toContain("await fetch('/api/events'");
  });
});
