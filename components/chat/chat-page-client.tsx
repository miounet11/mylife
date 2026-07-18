'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackClientEvent } from '@/lib/analytics-client';

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
  const searchParams = useSearchParams();
  const trackedKeyRef = useRef('');

  // Restore chat_page_viewed (dropped after messenger shell rewrite ~2026-07-15).
  useEffect(() => {
    const teacher = (searchParams.get('teacher') || '').trim();
    const mode = (searchParams.get('mode') || 'opening').trim() || 'opening';
    const source = (searchParams.get('source') || '').trim();
    const reportId = (searchParams.get('reportId') || searchParams.get('id') || '').trim();
    const intent = (searchParams.get('intent') || '').trim();
    const key = `${teacher}|${mode}|${source}|${reportId}|${intent}`;
    if (trackedKeyRef.current === key) return;
    trackedKeyRef.current = key;
    void trackClientEvent({
      eventName: 'chat_page_viewed',
      page: '/chat',
      meta: {
        surfaceKey: 'assistant',
        teacher: teacher || null,
        mode,
        source: source || null,
        reportId: reportId || null,
        intent: intent || null,
        hasReport: Boolean(reportId),
      },
    });
  }, [searchParams]);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <AIAssistantChat />
    </div>
  );
}
