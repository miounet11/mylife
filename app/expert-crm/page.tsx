import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import ExpertCrmDesk from '@/components/report-expert/expert-crm-desk';

export const metadata: Metadata = {
  title: '专业 CRM · 客户回访',
  description: '从业者本机客户脚本与待回访队列：面谈要点、行动承诺、回访日与话术草稿。',
  robots: { index: false, follow: false },
};

export default function ExpertCrmPage() {
  return (
    <AppPage header={{ ctaHref: '/history', ctaLabel: '报告历史', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="专业"
          title="客户脚本 · 待回访"
          description="轻量 CRM：面谈记录、逾期与即将回访。数据仅存本机。"
          actions={
            <>
              <Link href="/history" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                报告历史
              </Link>
              <Link href="/hehun" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                合婚双盘
              </Link>
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                预测回访
              </Link>
            </>
          }
        />
        <ExpertCrmDesk />
      </div>
    </AppPage>
  );
}
