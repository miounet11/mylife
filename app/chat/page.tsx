import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import ChatPageClient from '@/components/chat/chat-page-client';

export const metadata: Metadata = {
  title: '顾问开场｜基于报告继续深问',
  description: '老师先开场，一点即发。结合报告、档案与事件，把判断拆成可执行动作。',
};

export default function ChatPage() {
  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '生成报告', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 pb-8 md:py-8">
        <FocusHero
          eyebrow="对话"
          title="顾问开场"
          description="不预填长问题。老师先开场，点议题或一键开口即可；有报告时会自动带上命盘真值。"
          actions={
            <>
              <Link
                href="/teachers"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                请老师
              </Link>
              <Link
                href="/analyze"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                生成报告
              </Link>
              <Link
                href="/history"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                历史报告
              </Link>
            </>
          }
        />
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-white shadow-sm">
          <div className="h-[min(72vh,720px)] min-h-[480px]">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-[13px] text-[color:var(--ink-5)]">
                  加载中…
                </div>
              }
            >
              <ChatPageClient />
            </Suspense>
          </div>
        </div>
      </div>
    </AppPage>
  );
}
