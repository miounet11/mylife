import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppPage } from '@/components/layout/app-page';
import AnalyticsPageView from '@/components/analytics-page-view';
import { toolSessionOperations } from '@/lib/database';
import {
  buildPublicArticleFromToolSession,
  type PublicToolArticle,
} from '@/lib/public-tool-cases';
import { buildPageMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/seo';

type Props = { params: Promise<{ id: string }> };

function readPublicArticle(id: string): {
  article: PublicToolArticle;
  createdAt?: string;
  toolSlug: string;
} | null {
  const row = toolSessionOperations.getById(id) as {
    id: string;
    toolSlug?: string;
    tool_slug?: string;
    status?: string;
    result?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    createdAt?: string;
    created_at?: string;
  } | null;
  if (!row) return null;
  const meta = (row.meta || {}) as Record<string, unknown>;
  const result = (row.result || {}) as Record<string, unknown>;
  if (!(meta.public === true || result.public === true || meta.public === 1 || result.public === 1)) {
    return null;
  }
  const article =
    (result.article as PublicToolArticle | undefined)
    || buildPublicArticleFromToolSession({
      id: row.id,
      toolSlug: row.toolSlug || row.tool_slug,
      status: row.status || 'completed',
      result,
      meta,
      createdAt: row.createdAt || row.created_at,
    });
  if (!article?.title || !article.sections?.length) return null;
  return {
    article,
    createdAt: row.createdAt || row.created_at,
    toolSlug: row.toolSlug || row.tool_slug || article.toolSlug || 'tool',
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const packed = readPublicArticle(id);
  if (!packed) {
    return buildPageMetadata({
      title: '公开工具案例',
      description: '脱敏后的工具测算结构案例',
      path: `/share/tool/${id}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: packed.article.title,
    description: packed.article.summary || packed.article.title,
    path: `/share/tool/${id}`,
    noIndex: false,
    type: 'article',
    keywords: [
      ...(packed.article.tags || []),
      '工具测算',
      '匿名案例',
      '人生K线',
      packed.article.toolLabel,
    ].filter(Boolean),
  });
}

export default async function PublicToolCasePage({ params }: Props) {
  const { id } = await params;
  const packed = readPublicArticle(id);
  if (!packed) notFound();
  const { article, createdAt, toolSlug } = packed;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    url: `${SITE_URL}/share/tool/${id}`,
    datePublished: article.publishedAt || createdAt,
    inLanguage: 'zh-CN',
    isAccessibleForFree: true,
    author: { '@type': 'Organization', name: 'Life K-Line 命运K线', url: SITE_URL },
    about: article.tags,
  };

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '生成我的测算', compact: true }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnalyticsPageView
        eventName="public_tool_case_viewed"
        page={`/share/tool/${id}`}
        meta={{ toolSlug, sessionId: id }}
      />
      <article className="mx-auto max-w-2xl space-y-6 px-4 py-8 pb-16">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          公开工具案例 · 已脱敏 · 持续更新
        </div>
        <h1 className="text-[26px] font-black tracking-tight text-[color:var(--ink-1)]">
          {article.title}
        </h1>
        {article.summary ? (
          <p className="text-[15px] leading-relaxed text-[color:var(--ink-3)]">{article.summary}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 text-[11px] text-[color:var(--ink-5)]">
          {(article.tags || []).map((t) => (
            <span key={t} className="rounded-full border border-[color:var(--hairline)] px-2 py-0.5">
              {t}
            </span>
          ))}
          <span>{article.publishedAt?.slice(0, 10) || createdAt?.slice(0, 10) || ''}</span>
        </div>

        <div className="space-y-5 border-t border-[color:var(--hairline)] pt-5">
          {(article.sections || []).map((sec) => (
            <section key={sec.heading}>
              <h2 className="text-[16px] font-bold text-[color:var(--ink-1)]">{sec.heading}</h2>
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[color:var(--ink-2)]">
                {sec.body}
              </p>
            </section>
          ))}
        </div>

        <div className="rounded-[12px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4">
          <p className="text-[13px] font-semibold text-[color:var(--ink-1)]">用同一方法生成你的判断</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            公开案例只展示结构读法。输入出生信息，可得到你自己的主报告与工具下钻结果。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/analyze" className="fb-btn fb-btn-primary h-9 px-4 text-[13px] hover:no-underline">
              生成我的测算
            </Link>
            <Link
              href={`/tools/${encodeURIComponent(toolSlug)}`}
              className="fb-btn h-9 px-4 text-[13px] hover:no-underline"
            >
              打开同款工具
            </Link>
            <Link href="/reports" className="fb-btn h-9 px-4 text-[13px] hover:no-underline">
              更多公开内容
            </Link>
          </div>
        </div>
      </article>
    </AppPage>
  );
}
