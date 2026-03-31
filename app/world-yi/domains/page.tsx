import Link from 'next/link';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';

export const metadata = {
  title: '世界易人生六域 | 人生K线',
  description: '世界易的人生六域入口，围绕事业、财富、关系、健康、家庭、迁移建立可持续扩写的主问题路径。',
};

export const dynamic = 'force-dynamic';

const domains = [
  {
    title: '事业',
    description: '先看推进方式、角色密度和承压结构，而不是只盯职业名称。',
    href: '/knowledge/world-yi-career-role-fit',
    hubHref: '/world-yi/domains/career',
  },
  {
    title: '财富',
    description: '先看进入方式、保留能力和扩张节奏，而不是只看收入数字。',
    href: '/knowledge/world-yi-wealth-rhythm',
    hubHref: '/world-yi/domains/wealth',
  },
  {
    title: '关系',
    description: '先看节奏、边界和消耗结构，而不是只问合不合。',
    href: '/knowledge/world-yi-relationship-order',
    hubHref: '/world-yi/domains/relationship',
  },
  {
    title: '健康',
    description: '先看恢复窗口、环境密度和长期透支，而不是只在崩溃时才回头。',
    href: '/knowledge/world-yi-health-recovery-order',
    hubHref: '/world-yi/domains/health',
  },
  {
    title: '家庭',
    description: '先看责任排序、代际压力和恢复位，而不是只靠最能扛的人继续硬扛。',
    href: '/knowledge/world-yi-family-generational-order',
    hubHref: '/world-yi/domains/family',
  },
  {
    title: '迁移',
    description: '先看阶段、身份成本和环境匹配，而不是把地图当答案。',
    href: '/knowledge/world-yi-migration-stage-logic',
    hubHref: '/world-yi/domains/migration',
  },
];

export default function WorldYiDomainsPage() {
  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/world-yi/domains"
        meta={{ surfaceKey: 'world_yi_domains_page', contentType: 'knowledge', series: 'world-yi-domains' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Compass className="h-3.5 w-3.5" />
              世界易人生六域
            </>
          )}
          title={(
            <>
              用户真正反复遇到的，
              <span className="font-serif text-[color:var(--accent-strong)]">其实就是这六类主问题。</span>
            </>
          )}
          description="世界易把职业、财富、关系、健康、家庭和迁移看作六条长期主线。每一条都必须回到结构、阶段、环境、动作和风险，而不是只给一个标签。"
          hint="第一次进入建议先选一个与你当前问题最接近的分科，不要六域同时浏览。"
          actions={[
            { href: '/world-yi', label: '回到世界易总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/matrix', label: '看执行矩阵' },
            { href: '/world-yi/applications', label: '看生活应用' },
          ]}
          highlights={[
            { body: '六域不是六篇文章，而是长期主问题地图。' },
            { body: '每一域都必须能承接真实用户焦虑。' },
            { body: '每一域都要有知识、案例和结果页语言。' },
            { body: '这六域会持续成为 Batch 02 的扩写中轴。' },
          ]}
        />

        <section className="mt-10">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            六域入口
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {domains.map((item) => (
              <ContentCardLink
                key={item.href}
                href={item.href}
                page="/world-yi/domains"
                meta={{
                  surfaceKey: 'world_yi_domains_page',
                  targetSurfaceKey: item.href.replace('/knowledge/', 'knowledge_article:'),
                  contentType: 'knowledge',
                  series: 'world-yi-domains',
                }}
                className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <h2 className="text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
                <p className="intro-copy mt-3">{item.description}</p>
                <div className="action-guide mt-5">快速操作</div>
                <div className="action-strip mt-2 flex flex-wrap gap-3 text-sm font-semibold">
                  <span className="inline-flex items-center gap-2">
                    进入知识主线
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <Link href={item.hubHref} className="action-secondary">进入分科页</Link>
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                生活应用层
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">六域之外，世界易也开始承接起名、寻物、择时和家宅这些高频现实问题</h2>
              <p className="intro-copy mt-4">
                这些主题不会再以零散技巧存在，而会作为世界易应用层被重新翻译。它们都要回到结构、环境、阶段和可验证动作。
              </p>
              <Link href="/world-yi/applications" className="action-secondary mt-5">
                进入生活应用入口
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {['起名系统', '寻物复原', '择时窗口', '家宅恢复'].map((item) => (
                <div key={item} className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-semibold text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
