import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import AnalyticsPageView from '@/components/analytics-page-view';
import {
  listPublicQuestionFeedItems,
  listPublicReportFeedItems,
} from '@/lib/public-growth-feed';
import { listPublicToolCaseItems } from '@/lib/public-tool-cases';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = metadataFromPagePack('/reports');

export default function ReportsPage() {
  const reports = listPublicReportFeedItems(24);
  const tools = listPublicToolCaseItems(24);
  const questions = listPublicQuestionFeedItems(16);
  const seoPack = getPageSeoGeoPack('/reports');

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '生成我的测算', compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView eventName="public_content_hub_viewed" page="/reports" meta={{ geoReady: true }} />
      <div className="page-content space-y-8 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="持续公开 · 内容飞轮"
          title="用户测算与工具结果，脱敏后不断更新"
          description="高质量匿名报告与工具案例会进入本页与搜索索引。只展示结构读法，不暴露隐私。看懂别人的场景后，一键生成你自己的判断。"
          actions={
            <>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                生成我的报告
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                工具中心
              </Link>
              <Link href="/community" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                社区问答
              </Link>
            </>
          }
        />

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-end justify-between gap-2">
              <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">匿名测算报告</h2>
              <span className="text-[11px] text-[color:var(--ink-5)]">{reports.length} 条</span>
            </div>
            {reports.length === 0 ? (
              <p className="text-[13px] text-[color:var(--ink-4)]">暂无公开报告，生成测算后高质量结果会自动进入内容流。</p>
            ) : (
              <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
                {reports.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href.startsWith('/r/') || item.href.startsWith('/result/') ? item.href.replace(/^\/result\//, '/r/') : `/r/${item.id}`}
                      className="block py-3 hover:bg-[color:var(--bg-sunken)]"
                    >
                      <div className="text-[14px] font-semibold text-[color:var(--ink-1)]">{item.title}</div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                        {item.description}
                      </p>
                      <div className="mt-1 text-[11px] text-[color:var(--ink-5)]">
                        {[item.patternType, item.dayMaster, item.publishedDate].filter(Boolean).join(' · ')}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-end justify-between gap-2">
              <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">公开工具结果</h2>
              <span className="text-[11px] text-[color:var(--ink-5)]">{tools.length} 条</span>
            </div>
            {tools.length === 0 ? (
              <p className="text-[13px] text-[color:var(--ink-4)]">
                暂无公开工具案例。完成合婚、流年、维度等工具后，合格结果会自动脱敏公开。
              </p>
            ) : (
              <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
                {tools.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="block py-3 hover:bg-[color:var(--bg-sunken)]">
                      <div className="text-[14px] font-semibold text-[color:var(--ink-1)]">{item.title}</div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                        {item.summary}
                      </p>
                      <div className="mt-1 text-[11px] text-[color:var(--ink-5)]">
                        {[item.toolLabel, item.publishedAt?.slice(0, 10) || item.createdAt?.slice(0, 10)]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {questions.length > 0 ? (
          <section>
            <h2 className="mb-2 text-[15px] font-bold text-[color:var(--ink-1)]">公开追问</h2>
            <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
              {questions.slice(0, 12).map((q) => (
                <li key={q.id}>
                  <Link href={q.href || `/questions/${q.id}`} className="block py-2.5 hover:bg-[color:var(--bg-sunken)]">
                    <div className="text-[14px] font-medium text-[color:var(--ink-1)]">{q.title || q.question}</div>
                    {q.answerSummary ? (
                      <p className="mt-1 line-clamp-2 text-[12px] text-[color:var(--ink-4)]">{q.answerSummary}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-[12px] border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
          <strong className="text-[color:var(--ink-2)]">内容如何持续生成：</strong>
          用户完成主测算（默认公开摘要页）或工具运行后，系统对结果做质量门槛 + 隐私脱敏，合格内容自动进入本页、相关工具页的「公开内容流」与 sitemap，形成可被搜索引擎收录的案例库存。
        </section>

        <PageSeoGeoSection pathOrSlug="/reports" />
      </div>
    </AppPage>
  );
}
