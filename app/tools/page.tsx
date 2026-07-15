import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import DimensionsShowcase from '@/components/dimensions/dimensions-showcase';
import JourneyStrip from '@/components/content/journey-strip';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import { TOOL_ENTRIES } from '@/lib/portal-nav';
import { TOOL_CATEGORY_META, type ToolCategoryKey } from '@/lib/portal-tools';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '工具中心｜流年窗口、今日一签与十维度入口',
  description:
    '高意图免费命理工具：2026 流年主窗口、今日一签、手相观察；并与十维度深度研判、完整八字报告、预测回访互通，适合快速验证与深度判断衔接。',
  path: '/tools',
  keywords: ['八字工具', '流年窗口', '今日一签', '手相观察', '十维度', '免费命理测试'],
});

const CATEGORY_KEYS = Object.keys(TOOL_CATEGORY_META) as ToolCategoryKey[];

export default function ToolsPage() {
  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: '十维度', compact: true }}>
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page="/tools"
        meta={{ surfaceKey: 'tools' }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="工具"
          title="快速测试，或进入场景研判"
          description="单项工具适合快速验证；十维度适合结构判断。两者都可接到完整报告。"
          actions={
            <>
              <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                十维度
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

        <JourneyStrip active="tools" />

        <DimensionsShowcase
          title="场景研判"
          description="运势、工作、投资等高频问题。"
          limit={6}
          source="tools_hub"
          compact
        />

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">推荐工具</h2>
          <EntryLinkGrid items={TOOL_ENTRIES} />
        </section>

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">按主题</h2>
          <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {CATEGORY_KEYS.map((key) => {
              const meta = TOOL_CATEGORY_META[key];
              return (
                <li key={key}>
                  <Link
                    href={`/tools/category/${key}`}
                    className="group flex flex-col gap-0.5 py-2.5 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <span className="text-[13px] font-medium text-[color:var(--ink-1)] group-hover:underline">
                      {meta.title}
                    </span>
                    <span className="min-w-0 text-[12px] text-[color:var(--ink-5)] sm:max-w-[55%] sm:truncate sm:text-right">
                      {meta.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppPage>
  );
}
