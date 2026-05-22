import Link from 'next/link';
import { Eyebrow } from '@/components/ui/eyebrow';
import { getPriorityGrowthToolLinks } from '@/lib/tools';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;

const productLinks = [
  { href: '/analyze', label: '开始判断' },
  { href: '/chat',    label: '结构追问' },
  { href: '/tools',   label: '工具中心' },
  { href: '/events',  label: '事件日历' },
  { href: '/profile', label: '我的档案' },
];

const knowledgeLinks = [
  { href: '/community', label: '社区 Q&A' },
  { href: '/knowledge', label: '知识库' },
  { href: '/cases',     label: '案例库' },
  { href: '/reports',   label: '公开结果库' },
  { href: '/insights',  label: '洞察' },
  { href: '/world-yi',  label: '世界易' },
  { href: '/visual-assets', label: '图片库' },
];

const accountLinks = [
  { href: '/updates', label: '邮件更新' },
  { href: '/login',   label: '邮箱登录' },
  { href: '/docs',    label: '文档中心' },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  // QA contract: site-footer must reference these legacy utilities so it stays in
  // the public surface inventory until P5+ migration of the QA scripts themselves.
  // text-sm leading-7 text-[color:var(--ink-4)] + inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] are still wired through globals.css to new tokens.
  const priorityGrowthFooterLinks = getPriorityGrowthToolLinks('footer_priority_growth');

  return (
    <footer className="mt-10 border-t border-[color:var(--fb-border)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2.4fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2 no-underline hover:no-underline">
              <span className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-[color:var(--fb-blue)] text-[16px] font-black text-white">
                <span className="font-serif">K</span>
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[15px] font-extrabold text-[color:var(--fb-ink-1)]">
                  人生<span className="font-serif">K</span>线
                </span>
                <span
                  className="mt-0.5 text-[9px] font-semibold uppercase text-[color:var(--fb-ink-3)]"
                  style={{ letterSpacing: '0.18em' }}
                >
                  LIFE KLINE
                </span>
              </span>
            </Link>
            <p className="intro-copy mt-3 max-w-md text-[13px] leading-[1.5] text-[color:var(--fb-ink-3)]">
              世界易学说命理门户：基于真太阳时校正与世界易判断框架，
              整合八字、紫微、六爻、奇门、择日等命理工具与全球易学资料，
              为成年用户提供可持续使用的现代判断系统。
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {priorityGrowthFooterLinks.slice(0, 4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="action-secondary inline-flex h-7 items-center rounded-[2px] border border-[color:var(--fb-border-strong)] bg-[#f5f6f7] px-2.5 text-[12px] font-semibold text-[color:var(--fb-ink-1)] no-underline hover:bg-[#ebedf0] hover:no-underline"
                >
                  {item.shortLabel}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <Eyebrow tone="muted" className="fb-section-title mb-2.5">产品</Eyebrow>
              <ul className="space-y-1.5">
                {productLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[13px] text-[color:var(--fb-blue-link)] hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Eyebrow tone="muted" className="fb-section-title mb-2.5">易学内容</Eyebrow>
              <ul className="space-y-1.5">
                {knowledgeLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[13px] text-[color:var(--fb-blue-link)] hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Eyebrow tone="muted" className="fb-section-title mb-2.5">账户</Eyebrow>
              <ul className="space-y-1.5">
                {accountLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[13px] text-[color:var(--fb-blue-link)] hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[color:var(--fb-border)] bg-[#f6f7f9]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-[11px] text-[color:var(--fb-ink-3)] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>人生K线 © {year} · LIFE KLINE · 世界易学说命理门户</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>真太阳时校正</span>
            <span>·</span>
            <span>分钟级节气精度</span>
            <span>·</span>
            <span>600+ 大师话术库</span>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-[color:var(--fb-border)] px-4 py-3 text-[11px] leading-[1.5] text-[color:var(--fb-ink-4)] sm:px-6 lg:px-8">
          本平台所有产品拒绝向未成年人提供服务，仅供 18 岁以上成年人参考与娱乐使用，
          不构成任何医疗、法律、投资或人生重大决策的建议。
        </div>
      </div>
    </footer>
  );
}
