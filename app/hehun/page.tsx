import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import HehunWorkspace from '@/components/hehun/hehun-workspace';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '合婚合盘',
  description: '双人日柱与用忌互补对照，支持从报告/档案一键预填，也可双方填生日即时对盘。',
  path: '/hehun',
});

export default function HehunPage() {
  return (
    <AppPage header={{ ctaHref: '/dimensions/marriage', ctaLabel: '单盘婚恋', compact: true }}>
      <AnalyticsPageView
        eventName="hehun_page_viewed"
        page="/hehun"
        meta={{ surfaceKey: 'hehun', funnel: 'hehun_hub' }}
      />
      <AnalyticsPageView
        eventName="hehun_workspace_viewed"
        page="/hehun"
        meta={{ surfaceKey: 'hehun', kind: 'workspace' }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="合婚"
          title="双盘对照"
          description="日主互动、夫妻宫、用忌互补。可双方填生日即时对盘，或从报告/档案一键预填。"
          actions={
            <>
              <Link
                href="/dimensions/marriage"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                单盘谈婚论嫁
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                工具中心
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                完整报告
              </Link>
              <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                请老师
              </Link>
            </>
          }
        />
        <Suspense fallback={<div className="py-6 text-[13px] text-[color:var(--ink-5)]">加载中…</div>}>
          <HehunWorkspace />
        </Suspense>
      </div>
    </AppPage>
  );
}
