import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import DimensionsShowcase from '@/components/dimensions/dimensions-showcase';
import JourneyStrip from '@/components/content/journey-strip';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import ToolEntryLink from '@/components/tools/tool-entry-link';
import ToolsHubBirthForm from '@/components/tools/tools-hub-birth-form';
import { TOOL_ENTRIES } from '@/lib/portal-nav';
import { TOOL_CATEGORY_META, type ToolCategoryKey } from '@/lib/portal-tools';
import { buildPageMetadata } from '@/lib/seo';
import { buildTeacherChatHref } from '@/lib/teachers';

const CONSULTANT_LINKS = [
  { teacherId: 'career' as const, label: '事业' },
  { teacherId: 'timing' as const, label: '时机' },
  { teacherId: 'wealth' as const, label: '财务' },
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: '工具中心｜流年窗口、今日一签与十维度入口',
  description:
    '高意图免费命理工具：2026 流年主窗口、今日一签、手相观察；并与十维度深度研判、完整八字报告、预测回访互通，适合快速验证与深度判断衔接。',
  path: '/tools',
  keywords: ['八字工具', '流年窗口', '今日一签', '手相观察', '十维度', '免费命理测试'],
});

const CATEGORY_KEYS = Object.keys(TOOL_CATEGORY_META) as ToolCategoryKey[];

const BIRTH_QUICK = [
  {
    href: '/tools/timing-yearly-window',
    title: '年度主窗口',
    desc: '看今年推进与防守节奏 · 填生日即可',
    primary: true,
  },
  {
    href: '/tools/daily-sign',
    title: '今日一签',
    desc: '短周期节奏参考',
  },
  {
    href: '/tools/career-role-fit',
    title: '岗位匹配',
    desc: '事业方向与阶段动作',
  },
  {
    href: '/hehun',
    title: '合婚双盘',
    desc: '双方生日对盘，无需完整报告',
  },
] as const;

export default function ToolsPage() {
  return (
    <AppPage header={{ ctaHref: '/tools/timing-yearly-window', ctaLabel: '填生日测', compact: true }}>
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page="/tools"
        meta={{ surfaceKey: 'tools', funnel: 'tools_hub' }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="工具"
          title="填生日即可测"
          description="不用先出完整报告。选一个问题，填出生信息，引擎即时给主题判断；需要时再升级完整报告与老师追问。"
          actions={
            <>
              <ToolEntryLink
                href="/tools/timing-yearly-window"
                source="tools_hub_hero"
                title="年度主窗口"
                className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
              >
                先测年度主窗口
              </ToolEntryLink>
              <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                十维度
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                完整报告
              </Link>
              <Link href="/hehun" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                合婚
              </Link>
            </>
          }
        />

        <JourneyStrip active="tools" />

        <PageIllustrationStrip
          surface="tools/hub"
          title="工具怎么用"
          compact
          limit={1}
        />

        <ToolsHubBirthForm />

        {/* 转化主路径 */}
        <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">三步走通</h2>
              <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
                1）填生日跑单项 → 2）看日主/用神与窗口 → 3）需要时生成完整报告并追问
              </p>
            </div>
            <ToolEntryLink
              href="/tools/timing-yearly-window"
              source="tools_hub_primary_cta"
              title="年度主窗口"
              className="inline-flex h-10 min-h-[var(--control-h)] shrink-0 items-center justify-center rounded-[var(--radius)] bg-[color:var(--ink-1)] px-4 text-[13px] font-medium text-white no-underline hover:bg-black hover:no-underline"
            >
              开始：年度主窗口
            </ToolEntryLink>
          </div>

          <ul className="mt-4 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {BIRTH_QUICK.map((item) => (
              <li key={item.href}>
                <ToolEntryLink
                  href={item.href}
                  title={item.title}
                  description={item.desc}
                  source="tools_hub_birth_quick"
                  titleClassName={
                    'primary' in item && item.primary
                      ? 'text-[14px] font-semibold text-[color:var(--ink-1)]'
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        </section>

        <DimensionsShowcase
          title="场景研判"
          description="运势、工作、投资等高频问题。"
          limit={6}
          source="tools_hub"
          compact
        />

        <section className="space-y-2">
          <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">问老师</h2>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            {CONSULTANT_LINKS.map((item) => (
              <Link
                key={item.teacherId}
                href={buildTeacherChatHref({
                  teacherId: item.teacherId,
                  source: 'tools_hub_consultant',
                })}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/teachers"
              className="text-[12px] text-[color:var(--ink-5)] underline-offset-2 hover:text-[color:var(--ink-3)] hover:underline"
            >
              全部
            </Link>
          </nav>
        </section>

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">推荐工具</h2>
          <EntryLinkGrid items={TOOL_ENTRIES} />
        </section>

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">按主题</h2>
          <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {CATEGORY_KEYS.map((key) => {
              const meta = TOOL_CATEGORY_META[key];
              return (
                <li key={key}>
                  <Link
                    href={`/tools/category/${key}?source=tools_hub_category`}
                    className="group flex flex-col gap-0.5 py-2.5 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <span className="text-[13px] font-medium text-[color:var(--ink-1)] group-hover:underline">
                      {meta.title}
                    </span>
                    <span className="min-w-0 text-[12px] text-[color:var(--ink-5)] sm:max-w-[55%] sm:truncate sm:text-right">
                      {meta.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          工具结论锚定引擎真值（日主/用神/大运）。需要细拆时，再到完整报告或请老师。
        </p>
      </div>
    </AppPage>
  );
}
