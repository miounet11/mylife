import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import ZodiacLabApp from '@/components/tools/zodiac-lab-app';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '星座 · 生肖工具',
  description:
    '由出生日期推算太阳星座与生肖，可选填月亮/上升并写入人生数据底座，与八字结构报告交叉使用。',
  path: '/tools/zodiac',
});

export default function ZodiacToolPage() {
  return (
    <AppPage
      header={{ ctaHref: '/profile/foundation', ctaLabel: '数据底座', compact: true }}
      showFooter
      mainClassName="page-frame max-w-2xl py-6 pb-16 md:py-8"
    >
      <div className="space-y-5 px-4 md:px-0">
        <FocusHero
          eyebrow="Tools · Zodiac"
          title="星座 · 生肖"
          description="太阳星座与生肖由生日推导；月亮与上升可自填写入数据底座，与生辰八字、面相手相一并构成完整参数。"
          actions={
            <>
              <Link
                href="/profile/foundation"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                人生数据底座
              </Link>
              <Link
                href="/analyze?source=zodiac_hero"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                结构报告
              </Link>
              <Link
                href="/tools/physiognomy?source=zodiac"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                面相
              </Link>
            </>
          }
        />
        <Suspense
          fallback={
            <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-6 text-[13px] text-[color:var(--ink-5)]">
              加载中…
            </div>
          }
        >
          <ZodiacLabApp />
        </Suspense>
      </div>
    </AppPage>
  );
}
