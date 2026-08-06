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
  assertToolGeoReady,
  buildToolPageMetadata,
  getToolSeoGeoPack,
} from '@/lib/tools/tool-seo-geo';
import { createPublicContentMetadata } from '@/lib/public-content-seo';

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
              '本路径为工具详情。若生产环境有完整交互运行器，将在此挂载；SEO/GEO 与分享层始终可用。'}
          </p>
          <div className="flex flex-wrap gap-3 text-[13px]">
            <Link href="/tools" className="underline-offset-2 hover:underline">
              全部工具
            </Link>
            <Link href="/analyze" className="underline-offset-2 hover:underline">
              完整报告
            </Link>
            {pack ? (
              <span className="text-[11px] text-[color:var(--ink-5)]">
                GEO {assertToolGeoReady(slug) ? '就绪' : '待补'}
              </span>
            ) : null}
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
