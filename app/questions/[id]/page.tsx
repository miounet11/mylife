import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, FileQuestion, Layers3, MessageSquareText, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ChatMarkdown from '@/components/chat-markdown';
import PublicQuestionComments from '@/components/public-question-comments';
import PublicQuestionStructureCard from '@/components/public-question/structure-card';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { createBreadcrumbSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import {
  extractPublicQuestionStructure,
  shapeAnswerMarkdown,
} from '@/lib/public-question-enrichment';
import { listVisiblePublicQuestionComments } from '@/lib/public-question-comments';
import { getPublicQuestionFeedItem, listPublicQuestionFeedItems } from '@/lib/public-growth-feed';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

function createQuestionPageSchema(item: NonNullable<ReturnType<typeof getPublicQuestionFeedItem>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: item.title,
      text: item.question,
      dateCreated: item.createdAt,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answerSummary,
      },
    },
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const item = getPublicQuestionFeedItem(id);

  if (!item) {
    return { title: '公开问题未找到 | 人生K线' };
  }

  return createPublicContentMetadata({
    title: `${item.title} | 人生K线公开追问`,
    description: item.answerSummary || item.question,
    path: item.href,
    type: 'article',
    keywords: ['八字问题', '命理追问', '结构判断', item.contextLabel, '人生K线公开追问'],
    publishedTime: item.createdAt,
    modifiedTime: item.createdAt,
    section: '公开追问',
    tags: [item.contextLabel, '匿名问题', '结构判断'],
    answerSummary: item.answerSummary,
    searchIntents: ['用户追问', '命理结构判断', '公开案例参考'],
  });
}

export default async function PublicQuestionPage({ params }: PageProps) {
  const { id } = await params;
  const item = getPublicQuestionFeedItem(id);

  if (!item) notFound();

  const relatedQuestions = listPublicQuestionFeedItems(8).filter((question) => question.id !== item.id).slice(0, 4);
  const comments = listVisiblePublicQuestionComments(item.id);
  const structure = extractPublicQuestionStructure({
    answerText: item.answerText,
    analysisPoints: item.analysisPoints,
    contextLabel: item.contextLabel,
    authoritative: item.structured,
  });
  const answerMarkdown = shapeAnswerMarkdown(item.answerText || item.answerSummary);
  const schemas = [
    createBreadcrumbSchema([
      { name: '首页', path: '/' },
      { name: '公开结果库', path: '/reports' },
      { name: item.title, path: item.href },
    ]),
    createQuestionPageSchema(item),
  ];

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="cases_page_viewed" page={item.href} meta={{ surfaceKey: 'public_question_page', contentType: 'public_question', questionId: item.id }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始免费测算" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]">
          <ArrowLeft className="h-4 w-4" />
          返回公开结果库
        </Link>

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <article className="rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-7">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--bg-sunken)] px-2.5 py-1 text-xs font-bold text-[color:var(--ink-4)]">
              <FileQuestion className="h-3.5 w-3.5" />
              {item.contextLabel}
            </div>
            <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              {item.title}
            </h1>
            <p className="mt-4 text-base leading-8 text-[color:var(--ink-2)]">{item.question}</p>

            <section className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
              <div className="flex items-center gap-2 text-sm font-black text-[color:var(--ink-1)]">
                <Sparkles className="h-4 w-4 text-[color:var(--brand-strong)]" />
                公开解析
              </div>
              <div className="mt-3 text-sm leading-7 text-[color:var(--ink-2)]">
                <ChatMarkdown content={answerMarkdown} />
              </div>
            </section>

            <PublicQuestionStructureCard structure={structure} />

            {item.reportSummary && (
              <section className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
                <div className="text-sm font-black text-[color:var(--ink-1)]">关联报告摘要</div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink-3)]">{item.reportSummary}</p>
              </section>
            )}

            {item.analysisPoints.length > 0 && (
              <section className="mt-4 grid gap-3">
                <div className="text-sm font-black text-[color:var(--ink-1)]">结构与阶段判断</div>
                {item.analysisPoints.map((point) => (
                  <div key={point} className="flex gap-2 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 text-sm leading-6 text-[color:var(--ink-3)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-strong)]" />
                    <span>{point}</span>
                  </div>
                ))}
              </section>
            )}

            {item.actionPoints.length > 0 && (
              <section className="mt-4 grid gap-3">
                <div className="text-sm font-black text-[color:var(--ink-1)]">可执行建议</div>
                {item.actionPoints.slice(0, 4).map((point) => (
                  <div key={point} className="rounded-[var(--radius-md)] bg-[color:var(--bg-sunken)] p-3 text-sm leading-6 text-[color:var(--ink-3)]">
                    {point}
                  </div>
                ))}
              </section>
            )}
          </article>

          <aside className="grid gap-4 xl:sticky xl:top-20">
            <PublicQuestionComments questionId={item.id} initialComments={comments} />

            <section className="rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
              <div className="text-sm font-black text-[color:var(--ink-1)]">参与会沉淀成你的判断资产</div>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-[color:var(--ink-4)]">
                <div className="rounded-[var(--radius)] bg-[color:var(--bg-sunken)] p-3">1. 评价这个公开命例：同意、反例、补充时间点都可以。</div>
                <div className="rounded-[var(--radius)] bg-[color:var(--bg-sunken)] p-3">2. WorldYi 会结合上下文克制回应，不做绝对断语。</div>
                <div className="rounded-[var(--radius)] bg-[color:var(--bg-sunken)] p-3">3. 留言会带上主题标签，后续用于理解你的关注点和复盘路径。</div>
              </div>
            </section>

            <section className="rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
              <div className="text-sm font-black text-[color:var(--ink-1)]">读完这个追问，下一步</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink-4)]">
                不要照抄别人的结论。把你的对象、时间点、最担心的风险压成一句话，再做判断。
              </p>
              <div className="mt-4 grid gap-2">
                {item.reportHref && (
                  <Link
                    href={item.reportHref}
                    className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3 transition hover:border-[color:var(--brand)]"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--brand-strong)]">
                      <Layers3 className="h-4 w-4" />
                      查看关联匿名报告
                    </div>
                    <div className="mt-1 text-xs leading-5 text-[color:var(--ink-4)]">只展示结构、阶段和建议。</div>
                  </Link>
                )}
                <Link
                  href="/analyze"
                  className="group rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--paper)] p-3 transition hover:border-[color:var(--signal-strong)]"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--signal-strong)]">
                    <MessageSquareText className="h-4 w-4" />
                    生成我的判断
                  </div>
                  <div className="mt-1 text-xs leading-5 text-[color:var(--ink-4)]">输入你的出生时间地点，拆自己的阶段和动作。</div>
                </Link>
                {[
                  { href: '/knowledge', label: '看方法解释' },
                  { href: '/cases', label: '找相似案例' },
                  { href: '/tools', label: '用单项工具' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex h-9 items-center justify-between rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--bg-elevated)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </section>

            {relatedQuestions.length > 0 && (
              <section className="rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
                <h2 className="text-sm font-black text-[color:var(--ink-1)]">更多公开追问</h2>
                <div className="mt-3 grid gap-2">
                  {relatedQuestions.map((question) => (
                    <Link
                      key={question.id}
                      href={question.href}
                      className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3 transition hover:border-[color:var(--brand)]"
                    >
                      <div className="text-[11px] font-semibold text-[color:var(--ink-5)]">{question.contextLabel}</div>
                      <div className="mt-1 flex items-start justify-between gap-2 text-xs font-bold leading-5 text-[color:var(--ink-2)] group-hover:text-[color:var(--brand-strong)]">
                        {question.question}
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
