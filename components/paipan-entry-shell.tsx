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

      <main className={`page-frame ${compact ? 'py-6 pb-16 md:py-8 md:pb-20' : 'py-8 pb-16 md:py-12 md:pb-20'}`}>
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <ShieldCheck className="h-3 w-3" />
              快速填写
            </div>
            <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              填完必要信息，<span className="text-[color:var(--brand-strong)]">直接进入下一界面</span>
            </h1>
            <p className="text-sm leading-6 text-[color:var(--ink-3)]">
              录入区只保留真正影响判断的字段，重点优化填写流程本身。
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {supportCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="mt-3 text-base font-bold leading-snug text-[color:var(--ink-1)]">
                    {item.title}
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-[color:var(--ink-4)]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
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
    <div className="mx-auto max-w-[681px] space-y-3">
      <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
          <div className="h-10 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
          <div className="h-10 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
          <div className="h-10 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
          <div className="h-8 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
          <div className="h-11 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
        </div>
      </div>
      <div className="h-24 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]" />
    </div>
  );
}
