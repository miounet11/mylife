import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import HistoryClient from '@/components/history/history-client';

export const metadata: Metadata = {
  title: '历史记录｜报告与工具结果',
  description: '查看本机会话的综合报告与单项工具运行结果，方便快速回看结论与建议。',
  robots: { index: false, follow: false },
};

export default function HistoryPage() {
  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '生成新报告', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="历史"
          title="报告与工具结果"
          description="未登录也可在本浏览器查看会话结果；登录后可跨设备归档。"
          actions={
            <>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                工具
              </Link>
              <Link href="/profile" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                我的档案
              </Link>
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                预测回访
              </Link>
            </>
          }
        />
        <HistoryClient />
      </div>
    </AppPage>
  );
}
