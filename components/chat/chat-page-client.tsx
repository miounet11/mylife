'use client';

/**
 * Chat client boundary.
 * Mount AI assistant directly (no dynamic import).
 * Dynamic + timeout was added against hung next/dynamic, but under
 * Cloudflare Rocket Loader / delayed script execution it often left users
 * stuck on "顾问对话准备中" or timed out into "对话加载失败".
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AIAssistantChat from '@/components/ai-assistant-chat';
import { ClientErrorBoundary } from '@/components/client-error-boundary';
import { trackClientEvent } from '@/lib/analytics-client';
import type { SiteLocale } from '@/lib/i18n/site-locale';

/** Client boundary for /chat — mounts full AI assistant with consultant opening. */
export default function ChatPageClient({
  uiLocale = 'zh-CN',
}: {
  uiLocale?: SiteLocale | string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const trackedKeyRef = useRef('');

  // Analytics (once per query key)
  useEffect(() => {
    try {
      const teacher = (searchParams?.get('teacher') || '').trim();
      const mode = (searchParams?.get('mode') || 'opening').trim() || 'opening';
      const source = (searchParams?.get('source') || '').trim();
      const reportId = (searchParams?.get('reportId') || searchParams?.get('id') || '').trim();
      const intent = (searchParams?.get('intent') || '').trim();
      const key = `${pathname}|${teacher}|${mode}|${source}|${reportId}|${intent}|${uiLocale}`;
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
    } catch (e) {
      console.warn('[chat-page-client] track failed', e);
    }
  }, [searchParams, uiLocale, pathname]);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 flex-col"
      data-route="chat"
      data-ui-locale={uiLocale}
    >
      <ClientErrorBoundary route="/chat" variant="inline">
        <AIAssistantChat uiLocale={uiLocale} />
      </ClientErrorBoundary>
    </div>
  );
}
