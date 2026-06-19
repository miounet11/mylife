import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, FileQuestion, Layers3, MessageSquareText, UserRound } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { getPublicReportFeedSummary, listPublicQuestionFeedItems, listPublicReportFeedItemsPaged } from '@/lib/public-growth-feed';

export const dynamic = 'force-dynamic';

const PER_PAGE = 48;

export function generateMetadata() {
  return createPublicContentMetadata({
    title: '公开测算结果与用户追问 | 人生K线',
    description: '匿名公开的结构判断案例和用户追问集合，帮助你从真实问题里理解格局、日主、阶段节奏和行动选择。',
    path: '/reports',
    type: 'website',
  });
}

interface PageProps {
  searchParams?: Promise<{ page?: string }>;
}

export default async function PublicReportsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const requestedPage = Math.max(1, Number.parseInt(sp.page || '1', 10) || 1);
  const reportPage = listPublicReportFeedItemsPaged(requestedPage, PER_PAGE);
  const reports = reportPage.items;
  const questions = listPublicQuestionFeedItems(60);
  const reportSummary = getPublicReportFeedSummary();
  const dailyBuckets = reportSummary.dailyBuckets;
  const latestPublishedAt = reportSummary.latestPublishedAt;
  const schemas = [
    createCollectionPageSchema({
      headline: '公开测算结果与用户追问',
      description: '匿名公开的结构判断案例和用户追问集合。',
      path: '/reports',
      keywords: ['八字测算案例', '命理问题', '结构判断', '人生K线公开结果'],
    }),
    createItemListSchema(
      '公开结构判断案例',
      reports.slice(0, 20).map((item, index) => ({
        name: item.title,
        path: item.href,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      '用户公开追问',
      questions.slice(0, 20).map((item, index) => ({
        name: item.question,
        path: item.href,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="cases_page_viewed" page="/reports" meta={{ surfaceKey: 'public_reports_page', contentType: 'public_report' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始免费测算" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO 区 */}
        <section className="fb-card mb-3 overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
          <div className="bg-[color:var(--fb-blue)] px-4 py-2.5 text-white text-[12px] font-bold uppercase tracking-[0.14em]">
            公开结果库 · 命理/易学门户
          </div>
          <div className="px-4 py-3">
            <h1 className="text-[22px] font-bold text-[color:var(--fb-ink-1)] leading-[1.2]">
              真实测算结果和追问，匿名公开给你参考
            </h1>
            <p className="mt-1 text-[13px] leading-[1.4] text-[color:var(--fb-ink-2)] max-w-[640px]">
              这里不展示姓名、生日、出生地等敏感信息，只保留格局、日主、阶段判断、行动建议和用户真实问题。
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">八字</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">紫微</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">六爻</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">奇门</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">择日</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                href="/analyze"
                className="inline-flex h-8 items-center gap-1.5 bg-[color:var(--fb-blue)] px-3 text-[12px] font-bold text-white hover:bg-[#365899]"
              >
                生成我的免费报告
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--ink-1)]">{reportPage.total}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">公开匿名报告</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--ink-1)]">{dailyBuckets[0]?.count || 0}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">最近一天发布</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--ink-1)]">{questions.length}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">公开用户追问</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-sm font-black text-[color:var(--ink-1)]">{formatDateTime(latestPublishedAt) || '暂无'}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">最新发布时间</div>
          </div>
        </section>

        <section className="mt-6 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">Publication Ledger</div>
              <h2 className="mt-1 text-lg font-black text-[color:var(--ink-1)]">每日公开发布情况</h2>
            </div>
            <div className="text-xs text-[color:var(--ink-4)]">按公开报告更新时间/创建时间汇总，用户身份已匿名化。</div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {dailyBuckets.length ? dailyBuckets.slice(0, 6).map((bucket) => (
              <div key={bucket.date} className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-[color:var(--ink-1)]">{bucket.date}</div>
                  <div className="rounded-full bg-[color:var(--brand)] px-2 py-0.5 text-xs font-bold text-white">{bucket.count} 条</div>
                </div>
                <div className="mt-2 space-y-1.5">
                  {bucket.items.slice(0, 4).map((item) => (
                    <Link key={item.id} href={item.href} className="block rounded-[var(--radius)] bg-[color:var(--paper)] px-2.5 py-2 text-xs hover:text-[color:var(--brand-strong)]">
                      <div className="flex items-center justify-between gap-2 font-semibold text-[color:var(--ink-2)]">
                        <span className="truncate" title={item.title}>{item.title}</span>
                        <span className="shrink-0 text-[color:var(--ink-5)]">{item.publishedTime || '--:--'}</span>
                      </div>
                      <div className="mt-1 truncate text-xs text-[color:var(--ink-4)]" title={`隶属 ${item.ownerLabel}`}>隶属 {item.ownerLabel}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )) : (
              <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4 text-sm text-[color:var(--ink-4)] md:col-span-3">
                暂无公开发布记录。
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-[color:var(--brand-strong)]" />
              <h2 className="text-lg font-black text-[color:var(--ink-1)]">最新公开测算结果</h2>
            </div>
            <div className="grid gap-3">
              {reports.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:border-[color:var(--brand)]"
                >
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-[color:var(--ink-4)]">
                    <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5">{item.patternType}</span>
                    <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5">{item.dayMaster}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5">
                      <CalendarDays className="h-3 w-3" />
                      {item.publishedDate || '日期待同步'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5">
                      <Clock3 className="h-3 w-3" />
                      {item.publishedTime || '时间待同步'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5">
                      <UserRound className="h-3 w-3" />
                      {item.ownerLabel}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-black leading-snug text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--ink-4)]">{item.description}</p>
                </Link>
              ))}
            </div>
            {reportPage.totalPages > 1 ? (
              <nav
                className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-4 py-3 text-xs"
                aria-label="公开测算结果分页"
              >
                <div className="text-[color:var(--ink-4)]">
                  第 <span className="font-bold text-[color:var(--ink-1)]">{reportPage.page}</span> / {reportPage.totalPages} 页 ·
                  共 <span className="font-bold text-[color:var(--ink-1)]">{reportPage.total}</span> 条
                </div>
                <div className="flex items-center gap-2">
                  {reportPage.page > 1 ? (
                    <Link
                      href={`/reports?page=${reportPage.page - 1}`}
                      className="inline-flex h-8 items-center rounded-full border border-[color:var(--hairline)] px-3 font-semibold text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand-strong)]"
                    >
                      上一页
                    </Link>
                  ) : (
                    <span className="inline-flex h-8 items-center rounded-full border border-[color:var(--hairline)] px-3 font-semibold text-[color:var(--ink-5)] opacity-60">
                      上一页
                    </span>
                  )}
                  {reportPage.page < reportPage.totalPages ? (
                    <Link
                      href={`/reports?page=${reportPage.page + 1}`}
                      className="inline-flex h-8 items-center rounded-full bg-[color:var(--brand)] px-3 font-semibold text-white transition hover:bg-[color:var(--brand-strong)]"
                    >
                      下一页
                    </Link>
                  ) : (
                    <span className="inline-flex h-8 items-center rounded-full bg-[color:var(--bg-sunken)] px-3 font-semibold text-[color:var(--ink-5)] opacity-60">
                      下一页
                    </span>
                  )}
                </div>
              </nav>
            ) : null}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-[color:var(--brand-strong)]" />
              <h2 className="text-lg font-black text-[color:var(--ink-1)]">用户正在问什么</h2>
            </div>
            <div className="grid gap-3">
              {questions.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:border-[color:var(--brand)]"
                >
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-xs font-semibold text-[color:var(--ink-4)]">
                    <FileQuestion className="h-3 w-3" />
                    {item.contextLabel}
                  </div>
                  <h3 className="mt-2 text-sm font-black leading-6 text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                    {item.question}
                  </h3>
                  {item.reportHref && (
                    <div className="mt-2 text-xs font-semibold text-[color:var(--brand-strong)]">有关联匿名报告 →</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-5 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                看完公开内容后
              </div>
              <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)]">把别人的问题，转成你的下一步</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-4)]">
                先用公开报告找相似处，再去知识库补方法、看案例对照、用工具拆单项问题，最后生成自己的完整判断。
              </p>
            </div>
            <Link
              href="/analyze"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
            >
              生成我的判断
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { href: '/knowledge', title: '先补判断方法', body: '看格局、日主、阶段节奏背后的解释框架。' },
              { href: '/cases', title: '再看案例对照', body: '用公开案例判断自己的问题更像哪一种场景。' },
              { href: '/tools', title: '拆成单项工具', body: '把职业、关系、财富、阶段窗口分开验证。' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:border-[color:var(--brand)]"
              >
                <div className="flex items-center justify-between gap-3 text-sm font-black text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                  {item.title}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </div>
                <p className="mt-2 text-xs leading-5 text-[color:var(--ink-4)]">{item.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ').slice(0, 16);
  return date.toISOString().replace('T', ' ').slice(0, 16);
}
