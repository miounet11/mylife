'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { CalendarClock, Compass, ShieldCheck, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

const FortuneForm = dynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

interface PaipanEntryShellProps {
  compact?: boolean;
}

const supportCards = [
  {
    title: '录入更快',
    description: '保留必要字段，减少解释打断，让用户尽快进入结果页。',
    icon: Sparkles,
  },
  {
    title: '时间更准',
    description: '支持真太阳时、夏令时、早晚子时这些会影响结构判断的关键逻辑。',
    icon: CalendarClock,
  },
  {
    title: '结果可延续',
    description: '完成分析后还能继续进入结果、咨询、事件和档案体系。',
    icon: Compass,
  },
];

export default function PaipanEntryShell({ compact = false }: PaipanEntryShellProps) {
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/cases" ctaLabel="查看案例" />

      <main className={`page-frame ${compact ? 'py-8 pb-16 md:py-12 md:pb-20' : 'py-10 pb-16 md:py-16 md:pb-20'}`}>
        <section className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr]">
          <div className="space-y-5">
            <div className="section-label">
              <ShieldCheck className="h-3.5 w-3.5" />
              快速填写
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              填完必要信息，
              <span className="font-serif text-[color:var(--accent-strong)]">直接进入下一界面。</span>
            </h1>
            <p className="intro-copy">录入区只保留真正影响判断的字段，重点优化填写流程本身。</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {supportCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="soft-card rounded-[1.5rem] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="mt-4 text-lg font-bold text-[color:var(--ink)]">{item.title}</div>
                  <p className="intro-copy mt-2">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <Suspense fallback={<FormSkeleton />}>
            <FortuneForm />
          </Suspense>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-[681px] space-y-4">
      <div className="glass-panel rounded-[2rem] p-6 md:p-8">
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded-2xl bg-white/70" />
          <div className="h-10 animate-pulse rounded-2xl bg-white/70" />
          <div className="h-10 animate-pulse rounded-2xl bg-white/70" />
          <div className="h-10 animate-pulse rounded-2xl bg-white/70" />
          <div className="h-8 animate-pulse rounded-2xl bg-white/70" />
          <div className="h-14 animate-pulse rounded-full bg-white/80" />
        </div>
      </div>
      <div className="glass-panel h-[120px] rounded-[2rem]" />
    </div>
  );
}
