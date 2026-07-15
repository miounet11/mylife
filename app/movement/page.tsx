import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import MarketingMovementPanel from '@/components/marketing-movement-panel';
import SiteLiveAtmosphere from '@/components/site-live-atmosphere';
import { getSystemCapabilityStats } from '@/lib/system-capability-stats';
import { buildPageMetadata } from '@/lib/seo';
import { MOVEMENT_TAGLINE } from '@/lib/marketing-movement';

export const metadata: Metadata = buildPageMetadata({
  title: '运动 · 别再买恐惧｜人生K线',
  description:
    '人生K线的传播立场：反恐吓、反宿命、结构可验证。开源可查，免费可测，金句可转发。',
  path: '/movement',
  keywords: ['人生K线', '开源', '反恐吓算命', '结构判断', MOVEMENT_TAGLINE],
});

export default function MovementPage() {
  const stats = getSystemCapabilityStats();

  return (
    <AppPage header={{ ctaHref: '/#analyze-workspace', ctaLabel: '免费测算' }}>
      <div className="page-frame space-y-5 py-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[color:var(--ink-4)]">
          <div>
            <Link href="/" className="font-medium text-[color:var(--ink-3)] hover:text-[color:var(--brand)] hover:no-underline">
              首页
            </Link>
            <span className="mx-1.5">/</span>
            <span className="font-semibold text-[color:var(--ink-2)]">运动与传播</span>
          </div>
          <Link
            href="/#analyze-workspace"
            className="font-semibold text-[color:var(--brand)] hover:no-underline"
          >
            直接生成报告 →
          </Link>
        </div>

        <SiteLiveAtmosphere initialStats={stats} compact />
        <MarketingMovementPanel />
      </div>
    </AppPage>
  );
}
