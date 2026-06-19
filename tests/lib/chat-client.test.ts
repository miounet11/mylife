import fs from 'fs';
import path from 'path';

describe('chat client request stability', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'components/ai-assistant-chat.tsx'),
    'utf8',
  );

  it('bounds chat history and message requests with the shared timeout helper', () => {
    expect(source).toContain('CHAT_HISTORY_TIMEOUT_MS = 12_000');
    expect(source).toContain('CHAT_REPLY_TIMEOUT_MS = 90_000');
    expect(source).toContain('CHAT_DELETE_TIMEOUT_MS = 10_000');
    expect(source).toContain("timeoutReason: 'chat-history-timeout'");
    expect(source).toContain("timeoutReason: 'chat-reply-timeout'");
    expect(source).toContain("timeoutReason: 'chat-delete-timeout'");
    expect(source).toContain("timeoutReason: 'chat-regenerate-timeout'");
    expect(source).toContain("timeoutReason: 'chat-edit-timeout'");
    expect(source).not.toContain("await fetch('/api/chat'");
  });

  it('aborts in-flight chat requests on unmount and treats superseded aborts silently', () => {
    expect(source).toContain("abortControllerRef(historyControllerRef, 'chat-unmounted')");
    expect(source).toContain("abortControllerRef(replyControllerRef, 'chat-unmounted')");
    expect(source).toContain("abortControllerRef(messageActionControllerRef, 'chat-unmounted')");
    expect(source).toContain('function isSilentChatAbort');
    expect(source).toContain('/superseded|unmounted/i');
  });

  it('surfaces recoverable timeout messages for chat operations', () => {
    expect(source).toContain('加载聊天历史等待时间过长，请稍后重试');
    expect(source).toContain('AI 回复等待时间过长，请稍后重试');
    expect(source).toContain('删除消息等待时间过长，请稍后重试');
    expect(source).toContain('重新生成等待时间过长，请稍后重试');
    expect(source).toContain('修改消息等待时间过长，请稍后重试');
  });
});
