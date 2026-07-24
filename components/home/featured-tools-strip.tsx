import Link from 'next/link';

/**
 * 首页重点能力曝光：起名 / 空间场 / 面相手相
 */
const FEATURES = [
  {
    href: '/tools/naming',
    badge: 'NEW',
    title: '起名工坊',
    desc: '生辰用神 · 康熙笔画 · 个人/公司/产品',
    cta: '去起名',
  },
  {
    href: '/tools/fengshui-space',
    badge: 'PRO',
    title: '空间场',
    desc: 'CAD 户型 · AI 美化 · 完整报表 · 人宅合参',
    cta: '打开工作台',
  },
  {
    href: '/tools/physiognomy',
    badge: 'NEW',
    title: '面相观察',
    desc: '上传面部照片 · 可选生辰 · 私有存图',
    cta: '上传面相',
  },
  {
    href: '/tools/palmistry',
    badge: 'NEW',
    title: '手相观察',
    desc: '上传掌纹照片 · 结构分 · 可授权线图',
    cta: '上传手相',
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
              className="group rounded-xl border border-[color:var(--hairline)] bg-white px-3 py-3 no-underline shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
                  {f.badge}
                </span>
                <span className="text-[14px] font-black text-[color:var(--ink-1)] group-hover:text-indigo-700">
                  {f.title}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-[color:var(--ink-3)]">{f.desc}</p>
              <div className="mt-2 text-[11px] font-semibold text-indigo-600">{f.cta} →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
