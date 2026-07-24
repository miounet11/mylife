import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppPage } from '@/components/layout/app-page';
import { toolSessionOperations } from '@/lib/database';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const row = toolSessionOperations.getById(id) as {
    result?: { article?: { title?: string; summary?: string }; public?: boolean };
    meta?: { public?: boolean };
  } | null;
  const article = row?.result?.article;
  const isPublic = row?.meta?.public || row?.result?.public;
  if (!row || !isPublic || !article?.title) {
    return buildPageMetadata({
      title: '公开笔记',
      description: '用户授权的结构观察笔记',
      path: `/share/insight/${id}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: article.title,
    description: article.summary || '结构观察公开笔记',
    path: `/share/insight/${id}`,
  });
}

export default async function PublicInsightPage({ params }: Props) {
  const { id } = await params;
  const row = toolSessionOperations.getById(id) as {
    result?: {
      public?: boolean;
      article?: {
        title?: string;
        summary?: string;
        sections?: Array<{ heading: string; body: string }>;
        tags?: string[];
        publishedAt?: string;
      };
    };
    meta?: { public?: boolean; sourceType?: string };
    createdAt?: string;
  } | null;

  const isPublic = row?.meta?.public || row?.result?.public;
  const article = row?.result?.article;
  if (!row || !isPublic || !article?.title) {
    notFound();
  }

  return (
    <AppPage header={{ ctaHref: '/tools/fengshui-space', ctaLabel: '空间场工作台', compact: true }}>
      <article className="mx-auto max-w-2xl space-y-6 px-4 py-8 pb-16">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          公开结构笔记 · 已脱敏
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
          <span>{article.publishedAt || row.createdAt || ''}</span>
        </div>

        <div className="space-y-5 border-t border-[color:var(--hairline)] pt-5">
          {(article.sections || []).map((sec) => (
            <section key={sec.heading}>
              <h2 className="text-[16px] font-bold text-[color:var(--ink-1)]">{sec.heading}</h2>
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-[1.75] text-[color:var(--ink-2)]">
                {sec.body}
              </p>
            </section>
          ))}
        </div>

        <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4 text-[12px] text-[color:var(--ink-4)]">
          本文由用户授权公开，已去除联系方式与精确地址。内容为结构观察/教学示意，不构成吉凶断语。
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/tools/fengshui-space"
              className="rounded-lg bg-[color:var(--ink-1)] px-3 py-1.5 font-semibold text-white"
            >
              我也测算
            </Link>
            <Link
              href="/membership?source=public_insight"
              className="rounded-lg border border-[color:var(--hairline)] px-3 py-1.5"
            >
              会员权益
            </Link>
          </div>
        </div>
      </article>
    </AppPage>
  );
}
