import Link from 'next/link';
import { ArrowRight, FileQuestion, Layers3, MessageSquareText } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { listPublicQuestionFeedItems, listPublicReportFeedItems } from '@/lib/public-growth-feed';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return createPublicContentMetadata({
    title: '公开测算结果与用户追问 | 人生K线',
    description: '匿名公开的结构判断案例和用户追问集合，帮助你从真实问题里理解格局、日主、阶段节奏和行动选择。',
    path: '/reports',
    type: 'website',
  });
}

export default function PublicReportsPage() {
  const reports = listPublicReportFeedItems(48);
  const questions = listPublicQuestionFeedItems(60);
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
        <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Layers3 className="h-3 w-3" />
              公开结果库
            </div>
            <h1 className="mt-2 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              真实测算结果和追问，匿名公开给你参考
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
              这里不展示姓名、生日、出生地等敏感信息，只保留格局、日主、阶段判断、行动建议和用户真实问题。
            </p>
          </div>
          <Link
            href="/analyze"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
          >
            生成我的免费报告
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--ink-1)]">{reports.length}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">公开匿名报告</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--ink-1)]">{questions.length}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">公开用户追问</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--ink-1)]">SEO</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">结果页 + 问题内容双入口</div>
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
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[color:var(--ink-4)]">
                    <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5">{item.patternType}</span>
                    <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5">{item.dayMaster}</span>
                  </div>
                  <h3 className="mt-2 text-base font-black leading-snug text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--ink-4)]">{item.description}</p>
                </Link>
              ))}
            </div>
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
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ink-4)]">
                    <FileQuestion className="h-3 w-3" />
                    {item.contextLabel}
                  </div>
                  <h3 className="mt-2 text-sm font-black leading-6 text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                    {item.question}
                  </h3>
                  {item.reportHref && (
                    <div className="mt-2 text-[11px] font-semibold text-[color:var(--brand-strong)]">有关联匿名报告 →</div>
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
