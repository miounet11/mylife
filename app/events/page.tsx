import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import EventsHub from '@/components/events/events-hub';
import { FocusHero } from '@/components/layout/focus-hero';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '事件日历',
  description: '记录人生关键节点，校准报告与预测回访。',
  path: '/events',
});

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ reportId?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AppPage header={{ ctaHref: '/predictions', ctaLabel: '预测回访', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="验证"
          title="事件日历"
          description="记录跳槽、搬家、关系等节点，与报告和预测回访对照。"
          actions={
            <>
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                预测回访
              </Link>
              <Link href="/profile/events" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                人生事件档案
              </Link>
              <Link href="/history" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                报告历史
              </Link>
            </>
          }
        />
        <EventsHub reportId={sp.reportId} />
      </div>
    </AppPage>
  );
}
