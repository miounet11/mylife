import Link from 'next/link';

/**
 * Homepage secondary discovery — after the birth form.
 * Primary paths first, then a compact tool grid (not competing with the form).
 */

const PATHS = [
  {
    href: '/analyze?intent=career&source=home_explore_path',
    badge: '主路径',
    title: '事业节奏',
    desc: '升职 / 跳槽 / 创业窗口',
    cta: '去测算',
    primary: true,
  },
  {
    href: '/hehun?source=home_explore_path',
    badge: '热门',
    title: '合婚双盘',
    desc: '关系边界与节奏匹配',
    cta: '看合婚',
    primary: false,
  },
  {
    href: '/analyze?intent=wealth&source=home_explore_path',
    badge: '财运',
    title: '财富窗口',
    desc: '宜推 / 宜守与阶段',
    cta: '看财富',
    primary: false,
  },
  {
    href: '/analyze?intent=yearly&source=home_explore_path',
    badge: '流年',
    title: '年度节奏',
    desc: '今年高低与行动序',
    cta: '看流年',
    primary: false,
  },
] as const;

const TOOLS = [
  {
    href: '/almanac?source=home_explore',
    title: '今日黄历',
    desc: '通书宜忌 · 个人日运',
  },
  {
    href: '/astro?source=home_explore',
    title: '星座百科',
    desc: '十二星座 · 上升',
  },
  {
    href: '/tools/naming?source=home_explore',
    title: '起名工坊',
    desc: '用神 · 笔画',
  },
  {
    href: '/tools/daily-sign?source=home_explore',
    title: '今日一签',
    desc: '推进 / 观察 / 收敛',
  },
  {
    href: '/knowledge?source=home_explore',
    title: '知识库',
    desc: '读完可一键测算',
  },
  {
    href: '/dimensions?source=home_explore',
    title: '十维度',
    desc: '场景深拆',
  },
] as const;

export function HomeExplore() {
  return (
    <section className="border-t border-[color:var(--hairline)] bg-[color:var(--paper)] py-8 md:py-10" aria-label="继续探索">
      <div className="page-content-wide space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-5)]">
              路径
            </p>
            <h2 className="mt-1 text-[18px] font-bold tracking-tight text-[color:var(--ink-1)]">
              你现在最关心哪件事
            </h2>
          </div>
          <Link
            href="#analyze-workspace"
            className="text-[13px] font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            回到排盘表单 ↑
          </Link>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PATHS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={
                p.primary
                  ? 'group rounded-[12px] border border-[color:var(--ink-1)] bg-[color:var(--ink-1)] px-4 py-4 text-white no-underline transition hover:opacity-95 hover:no-underline'
                  : 'group rounded-[12px] border border-[color:var(--hairline)] bg-white px-4 py-4 no-underline transition hover:border-[color:var(--ink-1)] hover:no-underline'
              }
            >
              <span
                className={
                  p.primary
                    ? 'text-[10px] font-bold uppercase tracking-wide text-white/70'
                    : 'text-[10px] font-bold uppercase tracking-wide text-[color:var(--ink-5)]'
                }
              >
                {p.badge}
              </span>
              <div
                className={
                  p.primary
                    ? 'mt-1 text-[15px] font-semibold text-white'
                    : 'mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]'
                }
              >
                {p.title}
              </div>
              <p
                className={
                  p.primary
                    ? 'mt-1 text-[12px] leading-snug text-white/80'
                    : 'mt-1 text-[12px] leading-snug text-[color:var(--ink-4)]'
                }
              >
                {p.desc}
              </p>
              <div
                className={
                  p.primary
                    ? 'mt-3 text-[12px] font-semibold text-white'
                    : 'mt-3 text-[12px] font-semibold text-[color:var(--ink-2)]'
                }
              >
                {p.cta} →
              </div>
            </Link>
          ))}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">常用入口</h3>
            <Link
              href="/tools?source=home_explore"
              className="text-[12px] text-[color:var(--ink-4)] underline-offset-2 hover:underline"
            >
              全部工具
            </Link>
          </div>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex items-center justify-between gap-2 rounded-[10px] border border-[color:var(--hairline)] bg-white px-3 py-2.5 no-underline transition hover:border-[color:var(--ink-1)] hover:no-underline"
              >
                <span>
                  <span className="block text-[13px] font-semibold text-[color:var(--ink-1)]">
                    {t.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[color:var(--ink-5)]">{t.desc}</span>
                </span>
                <span className="shrink-0 text-[12px] text-[color:var(--ink-4)]">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-dashed border-[color:var(--hairline-strong)] bg-[color:var(--bg-sunken)]/40 px-4 py-3">
          <p className="text-[12px] leading-relaxed text-[color:var(--ink-3)]">
            <span className="font-semibold text-[color:var(--ink-1)]">报告可分享</span>
            ：生成后一键出图，扫码即可让朋友免费测一份
          </p>
          <Link
            href="/go/share"
            className="shrink-0 text-[12px] font-semibold text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            分享落地页 →
          </Link>
        </div>
      </div>
    </section>
  );
}
