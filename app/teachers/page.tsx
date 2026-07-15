import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import TeacherPicker from '@/components/teachers/teacher-picker';
import AnalyticsPageView from '@/components/analytics-page-view';
import { listTeachers } from '@/lib/teachers';
import { buildTeacherChatHref } from '@/lib/teachers';

export const metadata: Metadata = {
  title: '请老师 | 人生K线',
  description: '按问题选择老师：事业、财务、关系、节律、时机、地理与实践等。',
  alternates: { canonical: '/teachers' },
};

export default function TeachersPage() {
  const more = listTeachers({ tier: ['p1', 'p2'], galleryOnly: true });

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '生成报告', compact: true }}>
      <AnalyticsPageView eventName="teachers_page_viewed" page="/teachers" meta={{ surfaceKey: 'teachers' }} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <header className="border-b border-[color:var(--hairline)] pb-4">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[color:var(--ink-1)]">请老师</h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
            一位老师专一事。有报告时会带上你的盘与记录。
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              生成报告
            </Link>
            <Link href="/chat" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              直接对话
            </Link>
            <Link href="/profile" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              我的资料
            </Link>
          </div>
        </header>

        <TeacherPicker variant="gallery" title="常用" />

        {more.length ? (
          <section>
            <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">更多</h2>
            <ul className="mt-2 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
              {more.map((t) => (
                <li key={t.id}>
                  <Link
                    href={buildTeacherChatHref({ teacherId: t.id })}
                    className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
                  >
                    <span className="text-[13px] text-[color:var(--ink-1)] hover:underline">{t.name}</span>
                    <span className="truncate text-[12px] text-[color:var(--ink-5)]">{t.tagline}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppPage>
  );
}
