import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, FileQuestion, Layers3, MessageSquareText } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { createBreadcrumbSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
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
        text: '这是用户在公开匿名结构判断场景下提出的问题。人生K线会结合命理结构、阶段节奏、现实环境和行动选择给出判断，具体结论请进入关联公开报告或发起你的个人测算。',
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
    description: item.question,
    path: item.href,
    type: 'article',
    keywords: ['八字问题', '命理追问', '结构判断', item.contextLabel, '人生K线公开追问'],
    publishedTime: item.createdAt,
    modifiedTime: item.createdAt,
    section: '公开追问',
    tags: [item.contextLabel, '匿名问题', '结构判断'],
    answerSummary: item.question,
    searchIntents: ['用户追问', '命理结构判断', '公开案例参考'],
  });
}

export default async function PublicQuestionPage({ params }: PageProps) {
  const { id } = await params;
  const item = getPublicQuestionFeedItem(id);

  if (!item) notFound();

  const relatedQuestions = listPublicQuestionFeedItems(8).filter((question) => question.id !== item.id).slice(0, 4);
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

        <article className="mt-5 max-w-3xl rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-7">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--bg-sunken)] px-2.5 py-1 text-xs font-bold text-[color:var(--ink-4)]">
            <FileQuestion className="h-3.5 w-3.5" />
            {item.contextLabel}
          </div>
          <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-[color:var(--ink-1)] md:text-3xl">
            {item.title}
          </h1>
          <p className="mt-4 text-base leading-8 text-[color:var(--ink-2)]">{item.question}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {item.reportHref && (
              <Link
                href={item.reportHref}
                className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 transition hover:border-[color:var(--brand)]"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--brand-strong)]">
                  <Layers3 className="h-4 w-4" />
                  查看关联匿名报告
                </div>
                <div className="mt-2 text-sm leading-6 text-[color:var(--ink-4)]">只展示结构、阶段和建议，不展示生日、出生时间、出生地。</div>
              </Link>
            )}
            <Link
              href="/analyze"
              className="group rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--paper)] p-4 transition hover:border-[color:var(--signal-strong)]"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--signal-strong)]">
                <MessageSquareText className="h-4 w-4" />
                生成我的判断
              </div>
              <div className="mt-2 text-sm leading-6 text-[color:var(--ink-4)]">输入出生时间和地点，得到你的结构、阶段和下一步行动。</div>
            </Link>
          </div>
        </article>

        {relatedQuestions.length > 0 && (
          <section className="mt-8 max-w-3xl">
            <h2 className="text-lg font-black text-[color:var(--ink-1)]">更多公开追问</h2>
            <div className="mt-3 grid gap-3">
              {relatedQuestions.map((question) => (
                <Link
                  key={question.id}
                  href={question.href}
                  className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:border-[color:var(--brand)]"
                >
                  <div className="text-[11px] font-semibold text-[color:var(--ink-5)]">{question.contextLabel}</div>
                  <div className="mt-1 flex items-start justify-between gap-3 text-sm font-bold leading-6 text-[color:var(--ink-2)] group-hover:text-[color:var(--brand-strong)]">
                    {question.question}
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
