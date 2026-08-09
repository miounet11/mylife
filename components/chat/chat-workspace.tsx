'use client';

/**
 * DEPRECATED dual path — archived as thin redirect to the canonical chat client.
 *
 * Historical ChatWorkspace duplicated stream/anchor logic vs AIAssistantChat.
 * Product law (2026-08): one chat client only (`/chat` → ChatPageClient → AIAssistantChat).
 * This module remains only so old imports/backups do not break builds.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ChatWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams?.toString() || '';
    // Preserve query (reportId, teacher, source…) when collapsing dual path
    router.replace(q ? `/chat?${q}` : '/chat');
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6 text-[13px] text-[color:var(--ink-4)]">
      正在进入顾问对话…
    </div>
  );
}
