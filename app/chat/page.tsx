import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AppPage } from '@/components/layout/app-page';
import ChatPageClient from '@/components/chat/chat-page-client';

export const metadata: Metadata = {
  title: '顾问开场｜基于报告继续深问',
  description: '老师先开场，一点即发。结合报告、档案与事件，把判断拆成可执行动作。',
};

/**
 * Compact messenger shell: title strip + one full-height panel.
 * Height accounts for site header + title + safe area (no footer).
 */
export default function ChatPage() {
  return (
    <AppPage
      header={{ ctaHref: '/analyze', ctaLabel: '生成报告', compact: true }}
      showFooter={false}
      mainClassName="page-frame !py-0 md:!py-0"
    >
      <div
        className="mx-auto flex w-full max-w-3xl flex-col px-3 pt-2 sm:px-4 sm:pt-2.5"
        style={{
          height: 'calc(100dvh - var(--site-header-offset))',
          maxHeight: 'calc(100dvh - var(--site-header-offset))',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
              顾问开场
            </h1>
            <p className="mt-0.5 text-[12px] leading-[1.35] text-[color:var(--ink-5)]">
              老师先说 · 一点即发
            </p>
          </div>
          <nav className="flex shrink-0 flex-wrap items-center gap-x-3 text-[12px] text-[color:var(--ink-3)]">
            <Link
              href="/teachers"
              className="underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
            >
              请老师
            </Link>
            <Link
              href="/analyze"
              className="underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
            >
              排盘
            </Link>
            <Link
              href="/history"
              className="underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
            >
              历史
            </Link>
          </nav>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[color:var(--hairline)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center text-[13px] text-[color:var(--ink-5)]">
                加载中…
              </div>
            }
          >
            <ChatPageClient />
          </Suspense>
        </div>
      </div>
    </AppPage>
  );
}
