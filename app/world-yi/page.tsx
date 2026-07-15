import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import EncyclopediaWorldYiSidebar from '@/components/encyclopedia-world-yi-sidebar';
import { getEncyclopediaWorldYiLens } from '@/lib/encyclopedia-world-yi-lens';
import { WORLD_YI_DOMAINS } from '@/lib/portal-nav';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export const metadata: Metadata = {
  title: '世界易学说｜结构、时位与动作',
  description: '世界易 v1 方法论：用结构、时位、环境与动作帮助现代人做判断，不替代现实决策。',
  alternates: { canonical: '/world-yi' },
};

export default function WorldYiPage() {
  const lens = getEncyclopediaWorldYiLens({ slug: 'gua-qian', category: '64 卦百科', source: 'world-yi-hub' });
  const stats = getWorldYiPublicStats();

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '接到我的报告', compact: true }}>
      <AnalyticsPageView
        eventName="world_yi_page_viewed"
        page="/world-yi"
        meta={{ surfaceKey: 'world_yi' }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="世界易"
          title="结构、时位与动作"
          description="把传统命理翻译成现代判断语言：先看结构张力，再看阶段匹配，最后落到可验证动作。"
          actions={
            <>
              <Link
                href="/knowledge/world-yi-v1-manifesto"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                阅读总论
              </Link>
              <Link href="/learn/intro" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                入门专题
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                接到报告
              </Link>
            </>
          }
          footer={
            <span>
              公开知识 {stats.publicKnowledgeCount} · 公开案例 {stats.publicCaseCount}
            </span>
          }
        />

        {lens ? <EncyclopediaWorldYiSidebar lens={lens} /> : null}

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">按人生主题</h2>
          <EntryLinkGrid items={WORLD_YI_DOMAINS} />
        </section>
      </div>
    </AppPage>
  );
}
