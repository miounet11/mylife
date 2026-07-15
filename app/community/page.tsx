import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import { COMMUNITY_CATEGORIES } from '@/lib/portal-nav';

export const metadata: Metadata = {
  title: '社区｜结构追问与术数讨论',
  description: '八字、紫微、六爻、世界易等术数结构讨论区，按板块浏览高意图问题。',
  alternates: { canonical: '/community' },
};

export default function CommunityPage() {
  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '开始判断', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="社区"
          title="用结构语言讨论"
          description="按术数板块浏览。可用工作台生成报告后，再回来对照。"
          actions={
            <>
              <Link href="/community/search" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                站内搜索
              </Link>
              <Link href="/chat" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                结构追问
              </Link>
              <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                请老师
              </Link>
            </>
          }
        />
        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">板块</h2>
          <EntryLinkGrid items={COMMUNITY_CATEGORIES} />
        </section>
        <p className="border-t border-[color:var(--hairline)] pt-4 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
          也可先从{' '}
          <Link href="/learn" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            学习专题
          </Link>{' '}
          或{' '}
          <Link href="/knowledge" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            知识库
          </Link>{' '}
          继续。
        </p>
      </div>
    </AppPage>
  );
}
