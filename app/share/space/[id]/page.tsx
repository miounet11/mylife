import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppPage } from '@/components/layout/app-page';
import { toolSessionOperations } from '@/lib/database';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ id: string }> };

type Article = {
  title?: string;
  summary?: string;
  sections?: Array<{ heading: string; body: string }>;
  tags?: string[];
  publishedAt?: string;
  metrics?: Record<string, number | string>;
  planSnapshotDataUrl?: string | null;
  profileLinked?: boolean;
};

function loadPublic(id: string) {
  const row = toolSessionOperations.getById(id) as {
    result?: { public?: boolean; article?: Article };
    meta?: { public?: boolean; sourceType?: string };
    createdAt?: string;
  } | null;
  const isPublic = row?.meta?.public || row?.result?.public;
  const article = row?.result?.article;
  if (!row || !isPublic || !article?.title) return null;
  return { row, article };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = loadPublic(id);
  if (!data) {
    return buildPageMetadata({
      title: '公开空间场报表',
      description: '用户授权的空间结构完整报表',
      path: `/share/space/${id}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: data.article.title || '空间场报表',
    description: data.article.summary || '结构观察完整报表',
    path: `/share/space/${id}`,
  });
}

export default async function PublicSpaceReportPage({ params }: Props) {
  const { id } = await params;
  const data = loadPublic(id);
  if (!data) notFound();
  const { row, article } = data;
  const m = article.metrics || {};

  return (
    <AppPage
      header={{
        ctaHref: '/tools/fengshui-space',
        ctaLabel: '打开空间场',
        compact: true,
      }}
    >
      <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-16">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          公开空间场完整报表 · 已脱敏
          {article.profileLinked ? ' · 含人宅合参摘要' : ''}
        </div>
        <h1 className="text-[26px] font-black tracking-tight text-[color:var(--ink-1)]">
          {article.title}
        </h1>
        {article.summary ? (
          <p className="text-[15px] leading-relaxed text-[color:var(--ink-3)]">
            {article.summary}
          </p>
        ) : null}

        {/* metrics strip */}
        {m && Object.keys(m).length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {m.peakEnergy != null ? (
              <Metric label="峰值" value={`${Math.round(Number(m.peakEnergy) * 100)}`} />
            ) : null}
            {m.avgEnergy != null ? (
              <Metric label="均值" value={`${Math.round(Number(m.avgEnergy) * 100)}`} />
            ) : null}
            {m.stagnationRatio != null ? (
              <Metric
                label="滞留"
                value={`${Math.round(Number(m.stagnationRatio) * 100)}%`}
              />
            ) : null}
            {m.areaSqm != null ? (
              <Metric label="面积" value={`${Number(m.areaSqm).toFixed(0)}㎡`} />
            ) : null}
          </div>
        ) : null}

        {article.planSnapshotDataUrl ? (
          <div className="overflow-hidden rounded-xl border border-[color:var(--hairline)] bg-[#eef2e8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.planSnapshotDataUrl}
              alt="户型示意"
              className="mx-auto max-h-[420px] w-auto object-contain"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 text-[11px] text-[color:var(--ink-5)]">
          {(article.tags || []).map((t) => (
            <span
              key={t}
              className="rounded-full border border-[color:var(--hairline)] px-2 py-0.5"
            >
              {t}
            </span>
          ))}
          <span>{article.publishedAt || row.createdAt || ''}</span>
        </div>

        <div className="space-y-5 border-t border-[color:var(--hairline)] pt-5">
          {(article.sections || []).map((sec) => (
            <section key={sec.heading}>
              <h2 className="text-[16px] font-bold text-[color:var(--ink-1)]">
                {sec.heading}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[color:var(--ink-2)]">
                {sec.body}
              </p>
            </section>
          ))}
        </div>

        <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface-2)] p-4 text-[13px] text-[color:var(--ink-3)]">
          想自己调户型、关联八字、一键 AI 美化？
          <Link
            href="/tools/fengshui-space"
            className="ml-1 font-semibold text-[color:var(--brand-strong)] underline"
          >
            打开空间场工作台
          </Link>
          {' · '}
          <Link
            href="/tools/naming"
            className="font-semibold text-[color:var(--brand-strong)] underline"
          >
            起名中心
          </Link>
        </div>
      </article>
    </AppPage>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--hairline)] bg-white/70 px-3 py-2">
      <div className="text-[10px] font-semibold text-[color:var(--ink-5)]">{label}</div>
      <div className="text-[18px] font-black text-[color:var(--ink-1)]">{value}</div>
    </div>
  );
}
