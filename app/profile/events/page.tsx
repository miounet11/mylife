import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';

const LifeEventsPageBody = dynamic(
  () => import('@/components/profile/life-events-form').then((mod) => mod.LifeEventsPageBody),
  {
    loading: () => (
      <div className="fb-card flex items-center justify-center gap-2 p-10 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在加载人生事件表单…
      </div>
    ),
  },
);

export const metadata: Metadata = {
  title: '人生事件｜长期档案',
  description: '记录换工作、结婚、搬家等真实人生节点，用于校准趋势解读与命中率。',
  alternates: { canonical: '/profile/events' },
};

export default function ProfileEventsPage() {
  return (
    <AppPage header={{ ctaHref: '/profile', ctaLabel: '我的档案' }}>
      <FocusHero
        eyebrow="人生事件"
        title="用真实经历校准趋势解读"
        description="记录换工作、结婚、搬家等关键节点，帮助系统记住你的处境，并在下次报告中据此调整事业、关系与健康线的权重。"
        actions={
          <>
            <Link href="/annual-review" className="fb-btn fb-btn-primary h-8 px-3 text-[12px] hover:no-underline">
              年度复盘
            </Link>
            <Link href="/predictions" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
              预测回访
            </Link>
            <Link href="/profile" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
              返回档案
            </Link>
          </>
        }
      />

      <LifeEventsPageBody />

      <section className="fb-card mt-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-bold text-[color:var(--ink-1)]">事件与预测联动</h2>
            <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
              人生事件会写入本地长期档案；预测到期后可在预测页反馈，共同提升命中率。
            </p>
          </div>
          <Link href="/predictions" className="fb-btn h-9 px-3 text-sm hover:no-underline">
            去预测验证
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </AppPage>
  );
}