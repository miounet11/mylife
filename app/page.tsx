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
  { label: '真太阳时修正', value: '经纬度 + 均时差' },
  { label: '结果交付速度', value: '3 分钟内出报告' },
  { label: '结果页形态', value: '公开可浏览 / 可分享' },
];

const journeySteps = [
  {
    title: '先理解你是谁',
    description: '先给出命局结构、格局、五行强弱，让用户知道系统在算什么。',
    icon: Compass,
  },
  {
    title: '再解释当下为何发生',
    description: '把当前大运、流年与关键事件的因果逻辑解释清楚，降低神秘感。',
    icon: LineChart,
  },
  {
    title: '最后给出可执行建议',
    description: '不是泛泛而谈，而是明确说清什么时候适合推进、规避和复盘。',
    icon: CalendarClock,
  },
];

const scenarioCards = [
  '命盘结构',
  '五行强弱',
  '阶段趋势',
  '行动建议',
];

export const metadata = {
  title: '人生K线 | 公开可分享的命理分析结果页',
  description: '首页专注获客，结果页专注公开传播与承接转化。用户输入信息后，可获得可浏览、可分享的结构化命理报告。',
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
                  首页负责吸引进入，
                  <span className="font-serif text-[color:var(--accent-strong)]">结果页负责公开传播与转化。</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
                  我们把关键结构、趋势结论和细节建议留在结果页展开。首页只展示价值、可信度和入口，避免在首屏提前透出太多核心内容。
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="#analysis-form" className="action-primary">
                  开始生成专属报告
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/chat" className="action-secondary">
                  先体验 AI 咨询
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
                    <div className="text-sm font-semibold text-[color:var(--muted)]">报告预览</div>
                    <div className="mt-1 text-2xl font-bold text-[color:var(--ink)]">关键内容在结果页解锁</div>
                  </div>
                  <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    Hidden on Home
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    ['01', '命盘结构', '首页只展示框架，不直接展开具体柱象与命局判断'],
                    ['02', '趋势结论', '阶段波动和关键时间窗口在结果页完整呈现'],
                    ['03', '行动建议', '事业、关系、财富等细节建议集中放到可分享报告页'],
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
                低阻力转化入口
              </div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                把第一次输入，做成
                <span className="font-serif text-[color:var(--warm)]">一场有反馈的对话</span>
              </h2>
              <p className="text-base leading-8 text-[color:var(--muted)]">
                首页只负责把用户顺利带入分析，不提前展开完整命理结论。详细结构将在生成后的公开结果页中呈现。
              </p>

              <div className="space-y-3">
                {[
                  '即时显示真太阳时修正结果，建立专业信任。',
                  '用完成度、提示文案和风险说明降低填写焦虑。',
                  '提交后展示分析进度，不再让用户在空白页等待。',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[color:var(--accent)]" />
                    <span className="text-sm leading-6 text-[color:var(--ink)]">{item}</span>
                  </div>
                ))}
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
                内容资产层
              </div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                一个长期稳定的站点，
                <span className="font-serif text-[color:var(--accent-strong)]">不能只有工具，还要有内容。</span>
              </h2>
              <p className="text-base leading-8 text-[color:var(--muted)]">
                我们开始把知识文章、公开案例和结果页串成同一条内容链，让搜索、传播、转化和复访形成闭环。
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
                SEO 实体入口
              </div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                除了知识和案例，
                <span className="font-serif text-[color:var(--accent-strong)]">我们还要做行业、城市、组织节奏页。</span>
              </h2>
              <p className="text-base leading-8 text-[color:var(--muted)]">
                这类页面承接更具体的搜索意图，也能把结果页里出现的职业、城市和环境话题扩展成长期内容资产。
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
