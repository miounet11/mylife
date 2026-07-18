'use client';

import dynamic from 'next/dynamic';

const AIAssistantChat = dynamic(() => import('@/components/ai-assistant-chat'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-1 items-center justify-center p-6 text-[13px] text-[color:var(--ink-5)]">
      正在打开顾问对话…
    </div>
  ),
});

/** Client boundary for /chat — mounts full AI assistant with consultant opening. */
export default function ChatPageClient() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <AIAssistantChat />
    </div>
  );
}
