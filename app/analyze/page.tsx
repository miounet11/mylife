export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, Clock3, MapPin, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

const FortuneForm = dynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

const highlights = [
  {
    title: '出生地会修正真太阳时',
    description: '决定时柱判断，不是装饰信息。',
    icon: MapPin,
  },
  {
    title: '填写时就能核对结果',
    description: '立刻看到是否跨时辰、是否跨日。',
    icon: Clock3,
  },
  {
    title: '提交后直接开始测算',
    description: '不走多层中间页，结果马上生成。',
    icon: CheckCircle2,
  },
];

const outcomes = [
  '四柱、五行、十神、格局',
  '大运与流年趋势判断',
  '事业、财运、婚恋、健康建议',
  '可继续深问的公开结果页',
];

export const metadata = {
  title: '开始您的命理分析 | 人生K线',
  description: '更轻、更清晰的输入流程，用更高信任感把用户顺利带进分析与结果页。',
};

export default function AnalyzePage() {
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/chat" ctaLabel="先问 AI" />

      <main className="page-frame py-6 pb-14 md:py-10 md:pb-20">
        <section className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-5 md:p-7">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              更快进入测算
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-[1.12fr_0.88fr] xl:items-end">
              <div>
                <h1 className="text-3xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
                  先把信息
                  <span className="font-serif text-[color:var(--accent-strong)]">填对</span>
                  ，再让系统开始真正测算。
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--muted)]">
                  这里只保留真正影响排盘结果的输入项。用户完成出生信息后，就能立即核对真太阳时修正，再直接进入结果页。
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {outcomes.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/75 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--accent)]" />
                    <span className="text-sm text-[color:var(--ink)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="soft-card rounded-[1.4rem] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="text-sm leading-6 text-[color:var(--muted)]">{item.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-panel rounded-[2rem] p-4 md:p-6">
            <Suspense fallback={<FormSkeleton />}>
              <FortuneForm />
            </Suspense>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="h-24 animate-pulse rounded-[1.5rem] bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-24 animate-pulse rounded-[1.5rem] bg-slate-200" />
        <div className="h-24 animate-pulse rounded-[1.5rem] bg-slate-200" />
      </div>
      <div className="h-48 animate-pulse rounded-[1.75rem] bg-slate-200" />
      <div className="h-16 animate-pulse rounded-full bg-slate-300" />
    </div>
  );
}
