/**
 * Dynamic tool route. Production may replace with full ToolRunner;
 * local + shared SEO/GEO pack still apply when slug is registered.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppPage } from '@/components/layout/app-page';
import { ToolJsonLd, ToolSeoGeoSection } from '@/components/tools/tool-seo-geo-section';
import {
  buildToolPageMetadata,
  getToolSeoGeoPack,
} from '@/lib/tools/tool-seo-geo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Always returns a pack (hand-authored or quality fallback).
  return buildToolPageMetadata(slug);
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();
  const pack = getToolSeoGeoPack(slug);

  return (
    <AppPage header={{ ctaHref: '/tools', ctaLabel: '工具中心', compact: true }}>
      {pack ? <ToolJsonLd pack={pack} /> : null}
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <header className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            工具
          </p>
          <h1 className="text-[22px] font-bold tracking-tight text-[color:var(--ink-1)]">
            {pack?.name || slug}
          </h1>
          <p className="text-[13px] leading-relaxed text-[color:var(--ink-4)]">
            {pack?.answerSummary ||
              '本路径为工具详情。可先阅读说明与常见问题，需要完整命盘时进入排盘。'}
          </p>
          <div className="flex flex-wrap gap-3 text-[13px]">
            <Link href="/tools" className="underline-offset-2 hover:underline">
              全部工具
            </Link>
            <Link href="/analyze" className="underline-offset-2 hover:underline">
              完整报告
            </Link>
          </div>
        </header>

        {pack ? (
          <ToolSeoGeoSection pack={pack} />
        ) : (
          <p className="rounded-lg border border-[color:var(--hairline)] px-3 py-4 text-[12px] text-[color:var(--ink-5)]">
            工具内容加载中…
          </p>
        )}
      </div>
    </AppPage>
  );
}
