import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import HehunWorkspace from '@/components/hehun/hehun-workspace';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '合婚合盘',
  description: '双人日柱与用忌互补对照，支持从报告/档案一键预填。',
  path: '/hehun',
});

export default function HehunPage() {
  return (
    <AppPage header={{ ctaHref: '/dimensions/marriage', ctaLabel: '单盘婚恋', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="合婚"
          title="双盘对照"
          description="日主互动、夫妻宫、用忌互补。可从报告一键带入本人，或从档案选伴侣。"
          actions={
            <>
              <Link
                href="/dimensions/marriage"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                单盘谈婚论嫁
              </Link>
              <Link href="/history" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                报告历史
              </Link>
              <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                请老师
              </Link>
            </>
          }
        />
        <Suspense fallback={<div className="py-6 text-[13px] text-[color:var(--ink-5)]">加载中…</div>}>
          <HehunWorkspace />
        </Suspense>
      </div>
    </AppPage>
  );
}
