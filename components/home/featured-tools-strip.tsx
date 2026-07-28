import Link from 'next/link';

/**
 * 首页重点能力曝光：起名 / 空间场 / 面相手相
 */
const FEATURES = [
  {
    href: '/analyze?source=home_featured_strip',
    badge: 'CORE',
    title: '结构报告',
    desc: '生辰排盘 · 人生K线 · 可验证行动',
    cta: '去排盘',
  },
  {
    href: '/profile/foundation?source=home_featured_strip',
    badge: 'BASE',
    title: '数据底座',
    desc: '八字 · 星座 · 相学 · 问答 · 工具一盘棋',
    cta: '完善参数',
  },
  {
    href: '/tools/naming?source=home_featured_strip',
    badge: 'NEW',
    title: '起名工坊',
    desc: '生辰用神 · 康熙笔画 · 个人/公司/产品',
    cta: '去起名',
  },
  {
    href: '/tools/physiognomy?source=home_featured_strip',
    badge: 'NEW',
    title: '面相 · 手相',
    desc: '先物理结构 · 再命理交叉',
    cta: '上传观察',
  },
] as const;

export function FeaturedToolsStrip() {
  return (
    <section
      className="border-b border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-4 sm:px-4"
      aria-label="重点工具"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-bold tracking-tight text-[color:var(--ink-1)]">
            重点能力
          </h2>
          <Link
            href="/tools"
            className="text-[11px] font-semibold text-[color:var(--ink-3)] underline-offset-2 hover:underline"
          >
            全部工具
          </Link>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-xl border border-[color:var(--hairline)] bg-white px-3 py-3 no-underline shadow-sm transition hover:border-[color:var(--ink-4)] hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-[color:var(--bg-sunken)] px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--ink-3)]">
                  {f.badge}
                </span>
                <span className="text-[14px] font-semibold text-[color:var(--ink-1)]">
                  {f.title}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-[color:var(--ink-3)]">{f.desc}</p>
              <div className="mt-2 text-[11px] font-semibold text-[color:var(--ink-2)]">{f.cta} →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
