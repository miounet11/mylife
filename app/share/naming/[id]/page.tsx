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
  if (!row || !(row.meta?.public || row.result?.public) || !article?.title) {
    return buildPageMetadata({
      title: '公开起名短名单',
      description: '用户授权的起名候选短名单',
      path: `/share/naming/${id}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: article.title,
    description: article.summary || '起名候选短名单',
    path: `/share/naming/${id}`,
  });
}

export default async function PublicNamingPage({ params }: Props) {
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
    meta?: { public?: boolean };
    createdAt?: string;
  } | null;

  const article = row?.result?.article;
  if (!row || !(row.meta?.public || row.result?.public) || !article?.title) {
    notFound();
  }

  return (
    <AppPage header={{ ctaHref: '/tools/naming', ctaLabel: '起名中心', compact: true }}>
      <article className="mx-auto max-w-2xl space-y-6 px-4 py-8 pb-16">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          公开起名短名单 · 已脱敏
        </div>
        <h1 className="text-[26px] font-black tracking-tight">{article.title}</h1>
        {article.summary ? (
          <p className="text-[15px] text-[color:var(--ink-3)]">{article.summary}</p>
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
              <h2 className="text-[16px] font-bold">{sec.heading}</h2>
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[color:var(--ink-2)]">
                {sec.body}
              </p>
            </section>
          ))}
        </div>
        <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface-2)] p-4 text-[13px]">
          <Link href="/tools/naming" className="font-semibold text-[color:var(--brand-strong)] underline">
            打开起名中心
          </Link>
          {' · '}
          <Link href="/tools/fengshui-space" className="font-semibold underline">
            空间场
          </Link>
        </div>
      </article>
    </AppPage>
  );
}
