import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { StickyAnalyzeBar } from '@/components/conversion/sticky-analyze-bar';
import JsonLd from '@/components/seo/json-ld';
import { buildHotlist } from '@/lib/content-os/entity-content';
import { buildPageMetadata, buildItemListJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = buildPageMetadata({
  title: '热门命运主题与更新榜｜人生K线',
  description:
    '高意图人生决策主题与最新结构判断文章一览：换工作、迁城、创业等真实问题，方便站内发现与继续阅读。',
  path: '/hotlist',
  keywords: ['热门', '命运主题', '八字', '人生K线', '排行', '更新'],
  multiLanguage: true,
});

export default function HotlistPage() {
  const items = buildHotlist(36);
  const listLd = buildItemListJsonLd(
    '人生K线热门主题榜',
    items.map((item) => ({ name: item.title, path: item.href })),
  );

  return (
    <AppPage>
      <AnalyticsPageView page="/hotlist" />
      <JsonLd data={listLd} />
      <FocusHero
        eyebrow="热门"
        title="热门命运主题与更新榜"
        description="把高意图人生问题与最新深度文章放在同一张榜单，方便你快速找到正在纠结的决策主题。"
        actions={
          <>
            <Link
              href="/topics"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              主题库
            </Link>
            <Link
              href="/knowledge"
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              知识库
            </Link>
            <Link
              href="/analyze"
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              免费排盘
            </Link>
          </>
        }
      />

      <section className="mx-auto max-w-3xl px-4 pb-10">
        <ol className="divide-y divide-[color:var(--hairline)] rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--paper)]">
          {items.map((item) => (
            <li key={`${item.kind}-${item.href}-${item.rank}`}>
              <Link
                href={item.href}
                className="flex gap-4 px-4 py-4 transition hover:bg-[color:var(--paper-2,#fafaf9)]"
              >
                <div className="w-8 shrink-0 text-center text-[15px] font-semibold text-[color:var(--brand-strong)]">
                  {item.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[color:var(--paper-2,#f5f5f4)] px-2 py-0.5 text-[11px] text-[color:var(--ink-4)]">
                      {item.kind === 'entity' ? '实体' : '更新'} · {item.badge}
                    </span>
                  </div>
                  <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]">
                    {item.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
                    {item.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
        {items.length === 0 ? (
          <p className="mt-6 text-sm text-[color:var(--ink-4)]">
            内容管线正在填充，请先从主题库进入。
          </p>
        ) : null}
      </section>

      <StickyAnalyzeBar />
    </AppPage>
  );
}
