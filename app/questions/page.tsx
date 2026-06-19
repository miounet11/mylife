import Link from 'next/link';
import { ArrowRight, FileQuestion, MessageSquareText, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import {
  getPublicQuestionStats,
  listPublicQuestionFeedItems,
} from '@/lib/public-growth-feed';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 60;

export function generateMetadata() {
  return createPublicContentMetadata({
    title: '用户公开追问 | 人生K线',
    description: '匿名公开的用户追问集合，按时间倒序浏览，搭配格局/日主/阶段判断的真实问答。',
    path: '/questions',
    type: 'website',
  });
}

function formatCreatedAtUtc(value?: string | null) {
  if (!value) return null;
  // questions.created_at 在 DB 里是 UTC 文本 'YYYY-MM-DD HH:MM:SS'
  const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return '刚刚';
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} 个月前`;
  return `${Math.floor(month / 12)} 年前`;
}

function formatAbsoluteUtc(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm} UTC`;
}

export default async function PublicQuestionsPage() {
  const stats = getPublicQuestionStats();
  const questions = listPublicQuestionFeedItems(PAGE_SIZE);

  const schemas = [
    createCollectionPageSchema({
      headline: '用户公开追问',
      description: '匿名公开的用户追问集合，按时间倒序浏览。',
      path: '/questions',
      keywords: ['八字追问', '命理问题', '结构判断', '人生K线公开追问'],
    }),
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
      <AnalyticsPageView
        eventName="cases_page_viewed"
        page="/questions"
        meta={{ surfaceKey: 'public_questions_page', contentType: 'public_question_list' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始免费测算" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO 区 */}
        <section className="fb-card mb-3 overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
          <div className="bg-[color:var(--fb-blue)] px-4 py-2.5 text-white text-[12px] font-bold uppercase tracking-[0.14em]">
            用户公开追问 · 命理/易学门户
          </div>
          <div className="px-4 py-3">
            <h1 className="text-[22px] font-bold text-[color:var(--fb-ink-1)] leading-[1.2]">
              真实用户在问什么 · 公开匿名追问集合
            </h1>
            <p className="mt-1 text-[13px] leading-[1.4] text-[color:var(--fb-ink-2)] max-w-[640px]">
              这里是用户实际发出的命理追问，全部匿名公开。每条都标注了创建时间，并尽可能保留关联的结构判断。
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

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--ink-1)]">{stats.total}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">公开追问总数</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--brand-strong)]">{stats.today}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">今日新增</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--ink-1)]">{stats.last24h}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">近 24 小时</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="text-2xl font-black text-[color:var(--ink-1)]">{stats.last2h}</div>
            <div className="mt-1 text-xs font-semibold text-[color:var(--ink-4)]">近 2 小时</div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--brand-strong)]" />
            <h2 className="text-lg font-black text-[color:var(--ink-1)]">最新公开追问</h2>
            <span className="ml-2 text-xs text-[color:var(--ink-4)]">显示最近 {questions.length} 条</span>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--hairline)] bg-[color:var(--paper)] p-8 text-center text-sm text-[color:var(--ink-4)]">
              暂无公开追问，去 <Link href="/chat" className="text-[color:var(--brand-strong)] font-semibold">结构追问</Link> 留下你的第一个问题。
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {questions.map((item) => {
                const createdAt = formatCreatedAtUtc(item.createdAt);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group block h-full rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:border-[color:var(--brand)]"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[color:var(--ink-4)]">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5">
                          <FileQuestion className="h-3 w-3" />
                          {item.contextLabel}
                        </span>
                        {createdAt ? (
                          <time
                            dateTime={createdAt.toISOString()}
                            title={formatAbsoluteUtc(createdAt)}
                            className="inline-flex items-center rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5"
                          >
                            {relativeTime(createdAt)}
                          </time>
                        ) : null}
                        {item.reportHref ? (
                          <span className="inline-flex items-center rounded-full bg-[color:var(--brand-soft)] px-2 py-0.5 text-[color:var(--brand-strong)]">
                            有关联匿名报告
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-sm font-black leading-6 text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                        {item.question}
                      </h3>
                      {item.answerSummary ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[color:var(--ink-4)]">
                          {item.answerSummary}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-10 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-5 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                看完别人的追问后
              </div>
              <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)]">把别人的问题，转成你的下一步</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-4)]">
                先用公开报告找相似处，再去知识库补方法、看案例对照，最后生成自己的判断。
              </p>
            </div>
            <Link
              href="/chat"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
            >
              发起我的追问
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
