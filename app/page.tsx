export const fetchCache = 'force-no-store';
export const revalidate = 0;

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, CalendarClock, Compass, ShieldCheck, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
  getFeaturedCaseStudies,
  getFeaturedEntityInsights,
  getFeaturedKnowledgeArticles,
} from '@/lib/content-store';
import { getEntityTypeLabel } from '@/lib/content';

const FortuneForm = dynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

export const metadata = {
  title: '人生K线 | 看清命局结构、当前阶段和下一步行动建议',
  description: '基于真太阳时修正的命理分析产品，用结构、趋势、建议三层输出，帮助用户看清当下阶段与下一步动作。',
  keywords: ['八字', '命理', 'AI 命理', '真太阳时', '人生决策', '事业分析'],
};

const proofItems = [
  { label: '更准确', value: '真太阳时修正' },
  { label: '更易懂', value: '结构 + 趋势 + 建议' },
  { label: '更安心', value: '默认私密，可选分享' },
];

const journeySteps = [
  {
    title: '先看命局结构',
    description: '先交代五行、格局和日主状态，让用户知道自己到底是什么结构。',
    icon: Compass,
  },
  {
    title: '再看当前阶段',
    description: '把大运、流年和最近节奏解释清楚，回答为什么这段时间会这样。',
    icon: CalendarClock,
  },
  {
    title: '最后给出行动建议',
    description: '不是一句吉凶，而是明确告诉你什么时候适合推进、等待、复盘。',
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  const featuredArticles = getFeaturedKnowledgeArticles(2);
  const featuredCases = getFeaturedCaseStudies(2);
  const featuredInsights = getFeaturedEntityInsights(3);

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="#analysis-form" ctaLabel="立即测算" />

      <main>
        <section className="page-frame py-10 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-8">
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                更快理解价值，更快进入分析
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-black leading-tight text-[color:var(--ink)] md:text-6xl">
                  看清你的命局结构、
                  <span className="font-serif text-[color:var(--accent-strong)]">当前阶段</span>
                  和下一步行动建议。
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
                  先了解这份分析能帮你看清什么，再用最少的信息完成填写，直接进入结果页。
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="#analysis-form" className="action-primary">
                  立即开始分析
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/cases" className="action-secondary">
                  先看报告样例
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {proofItems.map((item) => (
                  <div key={item.label} className="hero-stat">
                    <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6 md:p-8">
              <div className="space-y-5">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">你会拿到什么</div>
                  <div className="mt-1 text-2xl font-bold text-[color:var(--ink)]">一份能看懂、能继续用的命理报告</div>
                </div>

                <div className="space-y-3">
                  {[
                    ['01', '结构结论', '先告诉你命局重点、五行强弱和当前真正的主轴问题。'],
                    ['02', '阶段判断', '解释最近为什么卡住、该冲还是等、什么时候容易转折。'],
                    ['03', '行动建议', '把事业、关系、财富等建议写成人话，不堆术语。'],
                  ].map(([index, title, description]) => (
                    <div key={index} className="soft-card rounded-[1.5rem] p-5">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-bold text-[color:var(--accent-strong)]">
                          {index}
                        </div>
                        <div>
                          <div className="text-base font-semibold text-[color:var(--ink)]">{title}</div>
                          <div className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-frame py-6 md:py-10">
          <div className="grid gap-5 md:grid-cols-3">
            {journeySteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="soft-card rounded-[1.75rem] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-[color:var(--ink)]">{step.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="page-frame py-10 md:py-16" id="analysis-form">
          <div className="mx-auto max-w-5xl space-y-5">
            <div className="text-center">
              <div className="section-label">
                <ShieldCheck className="h-3.5 w-3.5" />
                快速填写
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-5xl">填完必要信息，直接进入结果页</h2>
              <p className="mt-3 text-base leading-8 text-[color:var(--muted)]">
                只保留真正影响排盘的字段，尽量少打断、少解释、少来回切换。
              </p>
            </div>

            <FortuneForm />
          </div>
        </section>

        <section className="page-frame py-6 pb-16 md:py-10 md:pb-20">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-5">
              <div className="section-label">继续了解</div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                看几个真实案例和常见问题，
                <span className="font-serif text-[color:var(--accent-strong)]">再开始也不晚。</span>
              </h2>
              <p className="text-base leading-8 text-[color:var(--muted)]">
                如果你想先确认这份分析适不适合自己，可以先看看案例、知识说明和不同场景的解读方式。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredCases.map((item) => (
                <Link key={item.slug} href={`/cases/${item.slug}`} className="soft-card rounded-[1.75rem] p-5 transition hover:-translate-y-0.5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
                  <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</p>
                </Link>
              ))}

              {featuredArticles.map((item) => (
                <Link key={item.slug} href={`/knowledge/${item.slug}`} className="soft-card rounded-[1.75rem] p-5 transition hover:-translate-y-0.5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.category}</div>
                  <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredInsights.map((item) => (
              <Link
                key={`${item.type}-${item.slug}`}
                href={`/insights/${item.type}/${item.slug}`}
                className="glass-panel rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{getEntityTypeLabel(item.type)}</div>
                <div className="mt-3 text-lg font-bold text-[color:var(--ink)]">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl rounded-[2.25rem] bg-white/80 p-6 shadow-[0_20px_48px_rgba(23,32,51,0.08)]">
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-14 animate-pulse rounded-full bg-slate-300" />
      </div>
    </div>
  );
}
