import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AppPage } from '@/components/layout/app-page';
import ChatPageClient from '@/components/chat/chat-page-client';
import { CapabilityIllustrationPanel } from '@/components/content/capability-illustration-panel';
import {
  chatOpeningSurface,
  isCapabilityTeacherId,
} from '@/lib/page-illustrations/capability-map';
import { getTeacher } from '@/lib/teachers';

export const metadata: Metadata = {
  title: '顾问开场｜基于报告继续深问',
  description: '老师先开场，一点即发。结合报告、档案与事件，把判断拆成可执行动作。',
};

/**
 * Compact messenger shell: title + teacher capability diagram + chat panel.
 * Height accounts for site header + title + capability strip + safe area.
 */
export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ teacher?: string; mode?: string; source?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const teacherParam = `${sp.teacher || ''}`.trim();
  const teacher = getTeacher(teacherParam || 'overview');
  const surface = chatOpeningSurface(teacher.id);
  const showCapability = isCapabilityTeacherId(teacher.id) || Boolean(teacherParam);

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
              {teacher.name} · 顾问开场
            </h1>
            <p className="mt-0.5 text-[12px] leading-[1.35] text-[color:var(--ink-5)]">
              {teacher.tagline} · 一点即发
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

        {showCapability ? (
          <div className="mb-2 max-h-[38vh] shrink-0 overflow-y-auto sm:max-h-[32vh]">
            <CapabilityIllustrationPanel
              surface={surface}
              teacherId={teacher.id}
              compact
              priority
              showCopy
            />
          </div>
        ) : null}

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
