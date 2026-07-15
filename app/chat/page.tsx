import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import ChatWorkspace from '@/components/chat/chat-workspace';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';

export const metadata: Metadata = {
  title: '结构追问｜基于报告继续深问',
  description: '结合你的报告、档案与事件记录，把判断拆成可执行的行动顺序。',
};

export default function ChatPage() {
  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '生成报告', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="对话"
          title="结构追问"
          description="带着明确问题进入：当前处境、最想验证的一件事、以及你愿意采取的下一步。"
          actions={
            <>
              <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                请老师
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                生成报告
              </Link>
              <Link href="/profile" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                我的档案
              </Link>
            </>
          }
        />
        <Suspense fallback={<div className="py-4 text-sm text-[color:var(--ink-5)]">加载中…</div>}>
          <ChatWorkspace />
        </Suspense>
      </div>
    </AppPage>
  );
}
