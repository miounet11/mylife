import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import { DOC_ENTRIES } from '@/lib/portal-nav';

export const metadata: Metadata = {
  title: '文档与读法指南',
  description: '出生信息填写、真太阳时说明、第一份报告阅读顺序。',
  alternates: { canonical: '/docs' },
};

export default function DocsPage() {
  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '开始判断', compact: true }}>
      <AnalyticsPageView
        eventName="docs_page_viewed"
        page="/docs"
        meta={{ surfaceKey: 'docs' }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="文档"
          title="先理解方法，再读报告"
          description="出生信息、真太阳时与第一份报告的阅读顺序。"
          actions={
            <>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                开始判断
              </Link>
              <Link href="/learn" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                学习专题
              </Link>
            </>
          }
        />
        <PageIllustrationStrip surface="docs/hub" title="方法路径" compact limit={1} />
        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">推荐阅读</h2>
          <EntryLinkGrid items={DOC_ENTRIES} />
        </section>
      </div>
    </AppPage>
  );
}
