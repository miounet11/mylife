import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import LifeFoundationHub from '@/components/profile/life-foundation-hub';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '人生数据底座',
  description:
    '把生辰八字、星座生肖、面相手相、生活问答与工具使用汇总成完整参数底座，让结构报告与对话有据可依。',
  path: '/profile/foundation',
  noIndex: true,
});

interface Props {
  searchParams: Promise<{ fortuneId?: string; wizard?: string }>;
}

export default async function LifeFoundationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const openWizard = sp.wizard === '1' || sp.wizard === 'true';

  return (
    <AppPage
      header={{ ctaHref: '/analyze', ctaLabel: '结构报告', compact: true }}
      showFooter={false}
      mainClassName="page-content py-6 pb-20 md:py-8 md:pb-24"
    >
      <div className="space-y-5 px-4 md:px-0">
        <FocusHero
          eyebrow="Profile · Foundation"
          title="人生数据底座"
          description="固定数值与重要参数越健全，结构报告、对话与工具越贴你的现实。按层补齐：生辰 → 星座 → 面相手相 → 问答 → 互动 → 工具。"
          actions={
            <>
              <Link
                href="/profile"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                返回档案
              </Link>
              <Link
                href="/profile/settings"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                资料设置
              </Link>
              <Link
                href="/tools/zodiac?source=foundation_hero"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                星座工具
              </Link>
            </>
          }
        />
        <LifeFoundationHub
          initialFortuneId={sp.fortuneId || ''}
          openWizard={openWizard}
        />
      </div>
    </AppPage>
  );
}
