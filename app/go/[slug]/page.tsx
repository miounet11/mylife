import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import { AppPage } from '@/components/layout/app-page';
import {
  buildCampaignAnalyzeHref,
  getCampaignLanding,
  listCampaignSlugs,
} from '@/lib/campaign-landings';
import { buildPageMetadata } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ ref?: string; from?: string; utm_source?: string }>;
}

export function generateStaticParams() {
  return listCampaignSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getCampaignLanding(slug);
  if (!campaign) return { title: '人生K线' };
  return buildPageMetadata({
    title: `${campaign.title}｜人生K线`,
    description: campaign.description,
    path: `/go/${campaign.slug}`,
  });
}

/**
 * Short campaign URLs for ads / WeChat / 小红书 / QR:
 *   https://www.life-kline.com/go/xhs
 *   https://www.life-kline.com/go/share
 */
export default async function CampaignGoPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const campaign = getCampaignLanding(slug);
  if (!campaign) notFound();

  let analyzeHref = buildCampaignAnalyzeHref(campaign);
  // Forward viral ref / from into analyze for deeper attribution
  try {
    const u = new URL(analyzeHref, 'https://www.life-kline.com');
    if (sp.ref) u.searchParams.set('ref', sp.ref.slice(0, 48));
    if (sp.from) u.searchParams.set('from', sp.from.slice(0, 80));
    if (sp.utm_source) u.searchParams.set('utm_source', sp.utm_source.slice(0, 40));
    analyzeHref = `${u.pathname}?${u.searchParams.toString()}`;
  } catch {
    /* keep default */
  }

  return (
    <AppPage
      header={{ ctaHref: analyzeHref, ctaLabel: campaign.cta, compact: true }}
      showFooter={false}
    >
      <AnalyticsPageView
        eventName="campaign_landing_viewed"
        page={`/go/${campaign.slug}`}
        meta={{
          campaign: campaign.slug,
          source: campaign.source,
          intent: campaign.intent || null,
        }}
      />
      <main className="mx-auto max-w-lg space-y-5 px-4 py-8 pb-20 md:py-12">
        <div>
          {campaign.badge ? (
            <span className="inline-flex rounded-full border border-[color:var(--brand)]/25 bg-[color:var(--brand-soft)]/50 px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--brand-strong)]">
              {campaign.badge}
            </span>
          ) : null}
          <h1 className="mt-3 text-[22px] font-bold leading-snug tracking-tight text-[color:var(--ink-1)] md:text-[26px]">
            {campaign.title}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--ink-3)]">
            {campaign.description}
          </p>
        </div>

        <ul className="grid gap-2 text-[13px] text-[color:var(--ink-2)] sm:grid-cols-3">
          {['免费结构报告', '人生K线', '可执行下一步'].map((item) => (
            <li
              key={item}
              className="rounded-[10px] border border-[color:var(--hairline)] bg-white px-3 py-2 text-center font-medium"
            >
              {item}
            </li>
          ))}
        </ul>

        <Link
          href={analyzeHref}
          className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[color:var(--ink-1)] text-[15px] font-semibold text-white no-underline hover:no-underline"
        >
          {campaign.cta}
        </Link>

        <LightBirthBridge
          source={campaign.source}
          page={`/go/${campaign.slug}`}
          intent={campaign.intent || 'career'}
          title="或直接填生辰开测"
          description="出生日期即可；时辰未知也能出结构（会标注可信度）。"
        />

        <p className="text-center text-[11px] text-[color:var(--ink-5)]">
          结构与节奏参考，不替代专业医疗 / 法律 / 投资意见 · life-kline.com
        </p>
      </main>
    </AppPage>
  );
}
