import Link from 'next/link';
import { ArrowRight, Compass, Wrench } from 'lucide-react';
import { PrestigeIconRow } from '@/components/brand/prestige-banner';

/**
 * 首页后续探索矩阵 — 专业咨询路径索引与核心轻工具
 */

const PATHS = [
  {
    href: '/analyze?intent=career&source=home_explore_path',
    title: '事业节奏研判',
    desc: '升职、跳槽、创业窗口期与用神匹配',
    tag: '职场与定位',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
  },
  {
    href: '/analyze?intent=wealth&source=home_explore_path',
    title: '财富走势窗口',
    desc: '宜推或宜守阶段，规避盲目杠杆风险',
    tag: '资金与投资',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/60',
  },
  {
    href: '/hehun?source=home_explore_path',
    title: '合婚双盘对比',
    desc: '双方生辰对参：日主、夫妻宫与用忌互补',
    tag: '关系与婚恋',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/60',
  },
  {
    href: '/analyze?intent=yearly&source=home_explore_path',
    title: '年度流年节奏',
    desc: '今年能量高低、关键时机与行动次序',
    tag: '流年与岁运',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200/60',
  },
  {
    href: '/tools/fengshui-space?source=home_explore_path',
    title: '空间场与选址',
    desc: '户型气场、城市选址与人宅五行合参',
    tag: '环境与场域',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/60',
  },
] as const;

const TOOLS = [
  { href: '/tools/naming?source=home_explore', title: '起名工坊', subtitle: '喜用起名' },
  { href: '/almanac?source=home_explore', title: '今日黄历', subtitle: '择日宜忌' },
  { href: '/tools/daily-sign?source=home_explore', title: '今日一签', subtitle: '每日启示' },
  { href: '/knowledge?source=home_explore', title: '知识库', subtitle: '命理研究' },
  { href: '/dimensions?source=home_explore', title: '十维度', subtitle: '场景深挖' },
  { href: '/teachers?source=home_explore', title: '名师顾问', subtitle: '深度对谈' },
  { href: '/tools?source=home_explore', title: '全部工具', subtitle: '工具矩阵' },
] as const;

export function HomeExplore() {
  return (
    <section className="py-12 md:py-16" aria-label="继续探索">
      <div className="page-content-wide">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--hairline)] pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--brand)]/20 bg-[color:var(--brand-soft)] px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[color:var(--brand-strong)]">
              <Compass className="h-3.5 w-3.5" />
              PATHWAYS · 专项决策路径
            </span>
            <h2 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-[color:var(--ink-1)] md:text-[26px]">
              先定全局盘，再选一条具体方向
            </h2>
            <p className="mt-1 text-[13px] text-[color:var(--ink-4)]">
              围绕事业、财富、婚恋、年度与空间，提供针对性推演与行动建议
            </p>
          </div>
          <Link
            href="#analyze-workspace"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[color:var(--brand)] hover:text-[color:var(--brand-strong)] hover:underline"
          >
            <span>直接生成我的报告</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <PrestigeIconRow
          keys={['app', 'timing', 'seal']}
          className="mt-6 max-w-lg"
        />

        {/* 专项路径网格卡片 */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PATHS.map((p, index) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex flex-col justify-between rounded-2xl border border-[color:var(--hairline)] bg-white p-5 no-underline shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#182638]/30 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:no-underline"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${p.badgeClass}`}>
                    {p.tag}
                  </span>
                  <span className="font-mono text-[12px] font-semibold text-[color:var(--ink-5)]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-[17px] font-bold tracking-tight text-[color:var(--ink-1)] group-hover:text-[#182638]">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-[color:var(--ink-4)]">
                  {p.desc}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-[color:var(--brand)] transition group-hover:translate-x-0.5">
                <span>进入分析</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* 工具矩阵与知识底座 */}
        <div className="mt-10 rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-b from-white to-[#f8f9fa] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--hairline)] pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[color:var(--ink-3)]" />
              <span className="text-[14px] font-bold text-[color:var(--ink-1)]">
                常用工具与知识矩阵
              </span>
            </div>
            <Link
              href="/tools"
              className="text-[12px] font-medium text-[color:var(--brand)] hover:underline"
            >
              查看全部工具 →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col items-center justify-center rounded-xl border border-[color:var(--hairline)]/80 bg-white p-3 text-center transition hover:border-[#182638]/20 hover:bg-[#f8f9fa] hover:shadow-2xs"
              >
                <span className="text-[13px] font-bold text-[color:var(--ink-1)] group-hover:text-[color:var(--brand)]">
                  {t.title}
                </span>
                <span className="mt-0.5 text-[10px] text-[color:var(--ink-5)]">
                  {t.subtitle}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
