export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze-workspace';
import PublicSurfaceHero from '@/components/public-surface-hero';
import UpdatesStatusPanel from '@/components/updates-status-panel';
import { getAuthSession } from '@/lib/auth';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { worldYiRoadmapSummary } from '@/lib/world-yi';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export const metadata = {
  title: '开始判断 | 人生K线',
  description: '用世界易的判断框架录入出生信息，先看结构、阶段与环境，再进入你的个人结果页。',
  robots: {
    index: false,
    follow: false,
  },
};

const analyzePowerLinks = [
  { label: '单项工具中心', href: '/tools' },
  { label: '世界易总入口', href: '/world-yi' },
  { label: '十卷主书工程', href: '/world-yi/book' },
  { label: '人生六域入口', href: '/world-yi/domains' },
  { label: '全球华人路径', href: '/world-yi/global' },
  { label: '公开案例库', href: '/cases' },
  { label: '知识体系入口', href: '/knowledge' },
];

export default async function AnalyzePage() {
  const worldYiStats = getWorldYiPublicStats();
  const session = await getAuthSession();
  const initialAuthenticated = !!session.authenticated && !!session.user?.id;
  const initialSummary = initialAuthenticated && session.user?.id
    ? buildUpdatesSummary({
        userId: session.user.id,
        email: session.user.email,
      })
    : null;

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="analyze_page_viewed" page="/analyze" meta={{ surface: 'workspace' }} />
      <SiteHeader ctaHref="/cases" ctaLabel="查看案例" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              世界易分析入口
            </>
          )}
          title={(
            <>
              这里不是只做一次填写，
              <span className="font-serif text-[color:var(--accent-strong)]">而是开始重建你的判断。</span>
            </>
          )}
          description="世界易会先帮助你看结构，再看阶段，再结合环境落到动作。录入这些出生信息，不是为了得到一句宿命话，而是为了进入你的个人判断页。"
          hint="首次使用建议先完成本页分析，再决定是否进入工具中心，避免路径分散。"
          actions={[
            <Link key="jump-form" href="#analyze-workspace" className="action-primary action-main">
              立即开始填写
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>,
            <Link key="cases" href="/cases" className="action-secondary">先看案例</Link>,
            <Link key="tools" href="/tools" className="action-secondary">看工具中心</Link>,
          ]}
          highlights={[
            { title: '先看结构', body: '你不是乱，你是有结构。' },
            { title: '再看阶段', body: '很多卡住不是命差，而是所处阶段没看清。' },
            { title: '把环境带进来', body: '地点、关系、行业和生活压力都会改变推进成本。' },
            { title: '最后回到动作', body: '结果页最重要的，不是术语，而是现在先做什么。' },
          ]}
        />

        <section className="mb-8">
          <div className="relative overflow-hidden rounded-[2.2rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(244,237,226,0.92))] p-6 shadow-[0_22px_60px_rgba(34,33,30,0.08)] md:p-8">
            <div className="absolute -right-12 top-8 h-40 w-40 rounded-full bg-[rgba(178,149,93,0.14)] blur-3xl" />
            <div className="absolute left-0 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[rgba(201,125,58,0.12)] blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-5">
                <div className="section-label">世界易分析协议</div>
                <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-4xl">
                  这里提交的不是一张表，
                  <span className="font-serif text-[color:var(--accent-strong)]">而是你个人判断页的底层坐标。</span>
                </h2>
                <p className="intro-copy">
                  出生时间、地点、真太阳时、时区和场景类型，会一起决定后面结果页如何组织结构、阶段、环境和动作。世界易不是为了制造神秘感，而是为了降低误判。
                </p>
                <div className="action-guide">快捷入口</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: '当前公开总量', value: `${worldYiStats.publicContentCount} 篇` },
                    { label: '当前公开知识', value: `${worldYiStats.publicKnowledgeCount} 篇` },
                    { label: '当前公开案例', value: `${worldYiStats.publicCaseCount} 篇` },
                    { label: '环境洞察层', value: `${worldYiStats.publicInsightCount} 篇` },
                    { label: '世界易目标内容宇宙', value: `${worldYiRoadmapSummary.targetArticleCount} 篇` },
                    { label: '分析输出主顺序', value: '结构 -> 阶段 -> 环境 -> 动作' },
                    { label: '当前公开入口', value: `${worldYiStats.publicRouteCount} 个` },
                    { label: '创始叙事', value: `凯莉 · ${worldYiRoadmapSummary.version}` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.25rem] bg-white/82 p-4 shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                      <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {analyzePowerLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="action-secondary rounded-[1.35rem] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <UpdatesStatusPanel
          title="开始新判断前，先看已有进度"
          description="如果你已经有报告或升级任务，这里会先把当前状态给你，避免重复进入同一份结果。"
          initialAuthenticated={initialAuthenticated}
          initialSummary={initialSummary}
        />

        <div id="analyze-workspace">
          <AnalyzeWorkspace />
        </div>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <div className="section-label">单项工具矩阵</div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">综合判断建立底盘，工具中心负责把高频问题拆得更细。</h2>
              <p className="intro-copy mt-4">完成综合判断后，再进入单项工具做问题下钻。</p>
            </div>
            <div className="space-y-2">
              <div className="action-guide">快速操作</div>
              <div className="action-strip grid gap-3 md:grid-cols-2">
              {['事业与财富', '关系与家庭', '恢复与健康', '迁移与出国', '阶段窗口', '高频生活应用'].map((item) => (
                <Link key={item} href="/tools" className="action-secondary rounded-[1.25rem] p-4 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5">
                  {item}
                </Link>
              ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
