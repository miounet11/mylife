import Link from 'next/link';

/**
 * 首页重点能力：事业（主意图）/ 合婚（7d 高热工具）优先，其余能力次之。
 * 视觉对齐 Astro.com：主 CTA 品牌蓝，次卡白底 hairline。
 */
const PRIMARY_CTAS = [
  {
    href: '/analyze?intent=career&source=home_primary_cta',
    badge: '主路径',
    title: '事业节奏研判',
    desc: '用神与阶段窗口 · 先看升职/跳槽/创业时机',
    cta: '看事业',
    primary: true,
  },
  {
    href: '/hehun?source=home_primary_cta',
    badge: '热门',
    title: '合婚双盘',
    desc: '关系边界 · 节奏匹配 · 可经营档位',
    cta: '看合婚',
    primary: false,
  },
] as const;

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
    href: '/almanac?source=home_featured_strip',
    badge: 'DAILY',
    title: '今日黄历',
    desc: '通书宜忌 · 时辰 · 个人日运匹配',
    cta: '看今天',
  },
  {
    href: '/tools/daily-sign?source=home_featured_strip',
    badge: 'SIGN',
    title: '今日一签',
    desc: '推进 / 观察 / 收敛 · 一条今日动作',
    cta: '抽一签',
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
      className="border-b border-[color:var(--hairline)] bg-[color:var(--paper)] py-4"
      aria-label="重点工具"
    >
      <div className="page-content-wide">
        <div className="grid gap-2 sm:grid-cols-2">
          {PRIMARY_CTAS.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={
                f.primary
                  ? 'group rounded-xl border border-[color:var(--brand)] bg-[color:var(--brand)] px-4 py-4 text-white no-underline shadow-card transition hover:bg-[color:var(--brand-strong)] hover:no-underline'
                  : 'group rounded-xl border border-[color:var(--hairline)] bg-white px-4 py-4 no-underline shadow-card transition hover:border-[color:var(--brand)] hover:no-underline'
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    f.primary
                      ? 'rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white'
                      : 'rounded bg-[color:var(--brand-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--brand)]'
                  }
                >
                  {f.badge}
                </span>
                <span
                  className={
                    f.primary
                      ? 'text-[15px] font-semibold text-white'
                      : 'text-[15px] font-semibold text-[color:var(--ink-1)]'
                  }
                >
                  {f.title}
                </span>
              </div>
              <p
                className={
                  f.primary
                    ? 'mt-1.5 text-[12px] leading-snug text-white/85'
                    : 'mt-1.5 text-[12px] leading-snug text-[color:var(--ink-3)]'
                }
              >
                {f.desc}
              </p>
              <div
                className={
                  f.primary
                    ? 'mt-3 text-[12px] font-semibold text-white'
                    : 'mt-3 text-[12px] font-semibold text-[color:var(--brand)]'
                }
              >
                {f.cta} →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-2">
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-xl border border-[color:var(--hairline)] bg-white px-3 py-3 no-underline shadow-card transition hover:border-[color:var(--brand)] hover:no-underline"
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
              <div className="mt-2 text-[11px] font-semibold text-[color:var(--brand)]">{f.cta} →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
