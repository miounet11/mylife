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
  const pack = getToolSeoGeoPack(slug);
  if (pack) return buildToolPageMetadata(slug);
  return createPublicContentMetadata({
    title: `${slug} | 人生K线工具`,
    description: '单项工具页。结构判断入口，支持分享与完整报告衔接。',
    path: `/tools/${slug}`,
    type: 'website',
  });
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
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
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
            尚未注册 SEO/GEO 内容包。请在 <code className="text-[11px]">lib/tools/tool-seo-geo.ts</code>{' '}
            为 slug「{slug}」补充 answerSummary、FAQ、意图词与分享文案。
          </p>
        )}
      </div>
    </AppPage>
  );
}
