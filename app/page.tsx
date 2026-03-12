export const fetchCache = 'force-no-store';
export const revalidate = 0;

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Compass,
  LineChart,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import NewsletterSignup from '@/components/newsletter-signup';
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
    icon: LineChart,
  },
  {
    title: '最后给出行动建议',
    description: '不是一句吉凶，而是明确告诉你什么时候适合推进、等待、复盘。',
    icon: CalendarClock,
  },
];

const scenarioCards = [
  '命局结构总览',
  '当前阶段判断',
  '现实问题建议',
  '后续继续追问',
];

const trustItems = [
  {
    title: '为什么结果更可靠',
    description: '出生地点会参与真太阳时修正，不只按钟表时间硬排时柱。',
  },
  {
    title: '为什么普通人也能看懂',
    description: '结果按结构、趋势、建议三层输出，不要求你先懂命理术语。',
  },
  {
    title: '为什么更适合第一次尝试',
    description: '报告默认仅自己可见，确认有价值后再决定是否生成分享页。',
  },
];

const quickEntryItems = [
  '记不清精确出生时间，也可以先用大致时段开始。',
  '先拿到预分析结构，再决定是否补全地点与分钟级时间。',
  '适合第一次尝试、还不确定要不要完整投入的人。',
];

export const metadata = {
  title: '人生K线 | 看清命局结构、当前阶段和下一步行动建议',
  description: '基于真太阳时修正的命理分析产品，用结构、趋势、建议三层输出，帮助用户看清当下阶段与下一步动作。',
  keywords: ['八字', '命理', 'AI 命理', '真太阳时', '人生决策', '事业分析'],
};

export default function HomePage() {
  const featuredArticles = getFeaturedKnowledgeArticles(2);
  const featuredCases = getFeaturedCaseStudies(2);
  const featuredInsights = getFeaturedEntityInsights(3);

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="#analysis-form" ctaLabel="立即测算" />

      <main>
        <section className="page-frame py-10 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
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
                  不是一句吉凶，也不是玄学安慰。我们用真太阳时修正、结构化解释和可执行建议，帮你判断现在该怎么看、怎么做。
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

            <div className="glass-panel relative overflow-hidden rounded-[2rem] p-6 md:p-8">
              <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-[color:var(--accent-soft)] blur-2xl" />
              <div className="absolute -bottom-6 left-10 h-24 w-24 rounded-full bg-[rgba(201,125,58,0.18)] blur-2xl" />

              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--muted)]">你会拿到什么</div>
                    <div className="mt-1 text-2xl font-bold text-[color:var(--ink)]">一份能看懂、能继续用的命理报告</div>
                  </div>
                  <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    3 分钟内完成
                  </div>
                </div>

                <div className="space-y-4">
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

                <div className="grid gap-3 sm:grid-cols-2">
                  {scenarioCards.map((card) => (
                    <div
                      key={card}
                      className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm font-medium text-[color:var(--ink)]"
                    >
                      <div className="flex items-center justify-between">
                        <span>{card}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--muted)]">
                          结果页解锁
                        </span>
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
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1fr]">
            <div className="space-y-5">
              <div className="section-label">
                <ShieldCheck className="h-3.5 w-3.5" />
                先体验，再补全
              </div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                不确定出生时间，
                <span className="font-serif text-[color:var(--warm)]">也可以先开始</span>
              </h2>
              <p className="text-base leading-8 text-[color:var(--muted)]">
                先拿到一个足够有用的结构判断，再逐步补全地点和更精确的时间。报告默认私密，确认有价值后再决定是否分享。
              </p>

              <div className="space-y-3">
                {quickEntryItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[color:var(--accent)]" />
                    <span className="text-sm leading-6 text-[color:var(--ink)]">{item}</span>
                  </div>
                ))}
              </div>

              <div className="product-subtle p-5">
                <div className="product-kicker">为什么值得信</div>
                <div className="mt-3 space-y-3">
                  {trustItems.map((item) => (
                    <div key={item.title} className="rounded-[1.2rem] bg-white/80 px-4 py-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-5 md:p-8">
              <FortuneForm />
            </div>
          </div>
        </section>

        <section className="page-frame py-6 pb-16 md:py-10 md:pb-20">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Bot,
                title: '结果后继续咨询',
                description: '报告不是终点，AI 咨询会承接用户继续追问，把一次点击扩展成持续使用。',
              },
              {
                icon: Star,
                title: '关键事件持续管理',
                description: '把重要节点保存到事件日历，让用户回访和复用，而不是看完就流失。',
              },
              {
                icon: ShieldCheck,
                title: '统一视觉和交互逻辑',
                description: '每个页面都用同一套结构和反馈，减少跳转时的认知断层。',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="soft-card rounded-[1.75rem] p-6">
                  <Icon className="h-5 w-5 text-[color:var(--accent-strong)]" />
                  <div className="mt-4 text-lg font-bold text-[color:var(--ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="page-frame py-6 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="space-y-5">
              <div className="section-label">
                <BookOpen className="h-3.5 w-3.5" />
                先看真实案例
              </div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                如果你还没准备立刻填写，
                <span className="font-serif text-[color:var(--accent-strong)]">先看别人如何使用这份报告。</span>
              </h2>
              <p className="text-base leading-8 text-[color:var(--muted)]">
                真实案例、知识文章和洞察页会先帮你建立判断，再决定是否进入完整测算。这比一上来就要求你投入输入成本更友好。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredArticles.map((article) => (
                <Link key={article.slug} href={`/knowledge/${article.slug}`} className="soft-card rounded-[1.75rem] p-5 transition hover:-translate-y-0.5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{article.category}</div>
                  <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{article.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{article.excerpt}</p>
                </Link>
              ))}
              {featuredCases.map((item) => (
                <Link key={item.slug} href={`/cases/${item.slug}`} className="glass-panel rounded-[1.75rem] p-5 transition hover:-translate-y-0.5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
                  <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="page-frame py-6 pb-16 md:py-10 md:pb-20">
          <NewsletterSignup
            source="home_page"
            title="订阅高价值更新"
            description="适合希望长期跟踪命理知识、公开案例、结果页优化和新功能的人。"
          />
        </section>

        <section className="page-frame py-6 pb-16 md:py-10 md:pb-20">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="space-y-5">
              <div className="section-label">
                <Compass className="h-3.5 w-3.5" />
                按场景继续探索
              </div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                如果你关心的是城市、行业和环境，
                <span className="font-serif text-[color:var(--accent-strong)]">可以先从洞察页进入。</span>
              </h2>
              <p className="text-base leading-8 text-[color:var(--muted)]">
                这类页面更适合已经有明确问题的人，比如换城市、换行业、换合作环境之前，先看对应主题的节奏与案例。
              </p>
              <Link href="/insights" className="action-secondary">
                进入洞察中心
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featuredInsights.map((item) => (
                <Link
                  key={item.slug}
                  href={`/insights/${item.type}/${item.slug}`}
                  className="soft-card rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
                >
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{getEntityTypeLabel(item.type)}</div>
                  <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
      <div className="h-28 animate-pulse rounded-[1.5rem] bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
      </div>
      <div className="h-40 animate-pulse rounded-[1.5rem] bg-slate-200" />
      <div className="h-14 animate-pulse rounded-full bg-slate-300" />
    </div>
  );
}
