import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AppPage } from '@/components/layout/app-page';
import ChatPageClient from '@/components/chat/chat-page-client';
import { ChatCapabilityShell } from '@/components/chat/chat-capability-shell';
import { ChatShareButton } from '@/components/chat/chat-share-button';
import { CapabilityIllustrationPanel } from '@/components/content/capability-illustration-panel';
import {
  chatOpeningSurface,
  isCapabilityTeacherId,
} from '@/lib/page-illustrations/capability-map';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { isEnglishUiLocale, localizeTeacher } from '@/lib/i18n/teacher-copy';
import { getTeacher } from '@/lib/teachers';

export const metadata: Metadata = {
  title: '顾问开场｜基于报告继续深问',
  description: '老师先开场，一点即发。结合报告、档案与事件，把判断拆成可执行动作。',
};

/**
 * Messenger shell layout:
 *  - slim top bar (teacher + links)
 *  - one card: collapsible capability strip + chat timeline
 * Keeps diagram visible without stealing most of the viewport.
 */
export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<{
    teacher?: string;
    mode?: string;
    source?: string;
    lang?: string;
  }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const en = isEnglishUiLocale(uiLocale);
  const teacherParam = `${sp.teacher || ''}`.trim();
  const teacher = localizeTeacher(getTeacher(teacherParam || 'overview'), uiLocale);
  const surface = chatOpeningSurface(teacher.id);
  const showCapability = isCapabilityTeacherId(teacher.id) || Boolean(teacherParam);

  const sharePath = `/chat?teacher=${encodeURIComponent(teacher.id)}&mode=opening&source=share_nav${
    en ? '&lang=en' : ''
  }`;

  return (
    <AppPage
      header={{
        ctaHref: '/analyze',
        ctaLabel: en ? 'Generate report' : '生成报告',
        compact: true,
      }}
      showFooter={false}
      mainClassName="page-frame !py-0 md:!py-0"
    >
      <div
        className="mx-auto flex w-full max-w-3xl flex-col px-3 pt-1.5 sm:px-4 sm:pt-2"
        data-ui-locale={uiLocale}
        style={{
          height: 'calc(100dvh - var(--site-header-offset))',
          maxHeight: 'calc(100dvh - var(--site-header-offset))',
          paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Slim page chrome — single row when possible */}
        <header className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)] sm:text-[15px]">
              {teacher.name}
              <span className="font-normal text-[color:var(--ink-5)]">
                {en ? ' · Opening' : ' · 开场'}
              </span>
            </h1>
            <p className="mt-0.5 truncate text-[11px] leading-[1.3] text-[color:var(--ink-5)] sm:text-[12px]">
              {teacher.tagline}
            </p>
          </div>
          <nav className="flex shrink-0 items-center gap-x-2.5 text-[11px] text-[color:var(--ink-3)] sm:gap-x-3 sm:text-[12px]">
            <ChatShareButton
              locale={uiLocale}
              title={
                en
                  ? `${teacher.name} · Life K-Line`
                  : `${teacher.name} · 人生K线`
              }
              text={
                en
                  ? `${teacher.name}: ${teacher.tagline}\nStart with a framework; personalize rhythm after you create a chart.`
                  : `${teacher.name}：${teacher.tagline}\n先框架开聊，排盘后可个性化节奏与窗口。`
              }
              path={sharePath}
            />
            <Link
              href="/teachers"
              className="underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
            >
              {en ? 'Guides' : '请老师'}
            </Link>
            <Link
              href="/analyze"
              className="underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
            >
              {en ? 'Chart' : '排盘'}
            </Link>
            <Link
              href="/history"
              className="hidden underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline sm:inline"
            >
              {en ? 'History' : '历史'}
            </Link>
          </nav>
        </header>

        {/* Unified messenger card */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[color:var(--hairline)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {showCapability ? (
            <ChatCapabilityShell
              title={
                en
                  ? `${teacher.name} · capability map`
                  : `${teacher.name} · 能力图解`
              }
              subtitle={teacher.tagline}
              defaultOpen={false}
            >
              <CapabilityIllustrationPanel
                surface={surface}
                teacherId={teacher.id}
                variant="chat"
                priority
                // chips stack removed — caption floats on the right of the diagram
                showCopy={false}
                hideHeader
                className="!rounded-none !border-0"
              />
            </ChatCapabilityShell>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center text-[13px] text-[color:var(--ink-5)]">
                  {en ? 'Loading…' : '加载中…'}
                </div>
              }
            >
              <ChatPageClient uiLocale={uiLocale} />
            </Suspense>
          </div>
        </div>
      </div>
    </AppPage>
  );
}
