export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import {
  LearningTrackMapGrid,
  LearningTrackMapSummary,
  LearningTrackQuickLinks,
} from '@/components/learning-track-map';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { getLearningTracksOverview } from '@/lib/learning-track-stats';

export const metadata = {
  title: '学习专题 | 人生K线',
  description: '入门、事业、财富、关系、健康、迁移与应用等专题阅读。',
  alternates: { canonical: '/learn' },
};

export default function LearnPage() {
  const overview = getLearningTracksOverview();

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '开始判断', compact: true }}>
      <AnalyticsPageView eventName="learn_page_viewed" page="/learn" meta={{ surfaceKey: 'learning_map' }} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <header className="border-b border-[color:var(--hairline)] pb-4">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[color:var(--ink-1)]">专题</h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
            按主题阅读。可先看报告，再打开对应专题。
          </p>
          <div className="mt-3">
            <LearningTrackQuickLinks />
          </div>
          <div className="mt-3">
            <LearningTrackMapSummary overview={overview} />
          </div>
        </header>

        <PageIllustrationStrip surface="learn/hub" title="专题路径" compact limit={1} />

        <LearningTrackMapGrid overview={overview} />

        <nav className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-4 text-[13px]">
          <Link href="/knowledge" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            知识库
          </Link>
          <Link href="/cases" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            案例
          </Link>
          <Link href="/world-yi" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            世界易
          </Link>
          <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            请老师
          </Link>
        </nav>
      </div>
    </AppPage>
  );
}
