import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import HehunWorkspace from '@/components/hehun/hehun-workspace';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '合婚双盘｜双方生日即时对盘',
  description:
    '合婚双盘：双方填生日即可对照日主互动、夫妻宫、用忌互补与大运同步；支持从完整报告或档案一键预填，无需先生成双份报告。结构对照，非迷信承诺。',
  path: '/hehun',
  keywords: [
    '合婚',
    '合盘',
    '八字合婚',
    '双盘对照',
    '夫妻宫',
    '用忌互补',
    '大运同步',
    '人生K线',
  ],
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
        <PageIllustrationStrip surface="hehun/hub" title="双盘对照" compact limit={1} />
        <Suspense fallback={<div className="py-6 text-[13px] text-[color:var(--ink-5)]">加载中…</div>}>
          <HehunWorkspace />
        </Suspense>
      </div>
    </AppPage>
  );
}
