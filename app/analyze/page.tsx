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
    title: '地点会修正真太阳时',
    description: '直接影响时柱，不是补充信息。',
    icon: MapPin,
  },
  {
    title: '填写时立刻校正',
    description: '马上看到是否跨时辰、跨日。',
    icon: Clock3,
  },
  {
    title: '完成后直接生成报告',
    description: '不再经过多余说明页。',
    icon: CheckCircle2,
  },
];

const outcomes = [
  '4 个关键字段',
  '实时真太阳时预览',
  '默认公开的结果页',
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
          <div className="product-panel-strong p-5 md:p-7">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              Analysis Flow
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
              <div className="space-y-5">
                <div>
                  <h1 className="max-w-4xl text-3xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
                    把真正影响排盘的字段
                    <span className="font-serif text-[color:var(--accent-strong)]">一次填准</span>
                    ，系统再开始测算。
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--muted)]">
                    首页只保留核心输入。出生地、日期、时间填写完成后，用户会先看到真太阳时修正，再直接进入结果页。
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {outcomes.map((item) => (
                    <span key={item} className="product-chip">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="product-subtle p-4">
                <div className="product-kicker">填写原则</div>
                <div className="mt-3 space-y-3">
                  {highlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[color:var(--accent-strong)] shadow-[0_8px_18px_rgba(23,32,51,0.06)]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                          <div className="text-sm leading-6 text-[color:var(--muted)]">{item.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="product-panel-strong p-4 md:p-6">
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
