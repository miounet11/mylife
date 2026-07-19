'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackClientEvent } from '@/lib/analytics-client';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { isEnglishUiLocale } from '@/lib/i18n/teacher-copy';

function ChatShellLoading() {
  const [en, setEn] = useState(false);
  useEffect(() => {
    try {
      const fromDom = document.querySelector('[data-ui-locale]')?.getAttribute('data-ui-locale');
      const sp = new URLSearchParams(window.location.search);
      const path = window.location.pathname;
      setEn(
        isEnglishUiLocale(fromDom) ||
          isEnglishUiLocale(sp.get('lang')) ||
          isEnglishUiLocale(sp.get('locale')) ||
          path === '/en/chat' ||
          path.startsWith('/en/chat'),
      );
    } catch {
      /* ignore */
    }
  }, []);
  return (
    <div className="flex h-full w-full flex-1 items-center justify-center p-6 text-[13px] text-[color:var(--ink-5)]">
      {en ? 'Opening consultant chat…' : '正在打开顾问对话…'}
    </div>
  );
}

const AIAssistantChat = dynamic(() => import('@/components/ai-assistant-chat'), {
  ssr: false,
  loading: () => <ChatShellLoading />,
});

/** Client boundary for /chat — mounts full AI assistant with consultant opening. */
export default function ChatPageClient({
  uiLocale = 'zh-CN',
}: {
  uiLocale?: SiteLocale | string;
}) {
  const searchParams = useSearchParams();
  const trackedKeyRef = useRef('');

  // Restore chat_page_viewed (dropped after messenger shell rewrite ~2026-07-15).
  useEffect(() => {
    const teacher = (searchParams.get('teacher') || '').trim();
    const mode = (searchParams.get('mode') || 'opening').trim() || 'opening';
    const source = (searchParams.get('source') || '').trim();
    const reportId = (searchParams.get('reportId') || searchParams.get('id') || '').trim();
    const intent = (searchParams.get('intent') || '').trim();
    const key = `${teacher}|${mode}|${source}|${reportId}|${intent}|${uiLocale}`;
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
        locale: uiLocale || null,
      },
    });
  }, [searchParams, uiLocale]);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col" data-ui-locale={uiLocale}>
      <AIAssistantChat uiLocale={uiLocale} />
    </div>
  );
}
