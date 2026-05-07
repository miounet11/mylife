import Link from 'next/link';
import { BrandLockup } from '@/components/ui/brand-lockup';
import { Eyebrow } from '@/components/ui/eyebrow';
import { getPriorityGrowthToolLinks } from '@/lib/tools';

const productLinks = [
  { href: '/analyze', label: '开始判断' },
  { href: '/chat',    label: '结构追问' },
  { href: '/tools',   label: '工具中心' },
  { href: '/events',  label: '事件日历' },
  { href: '/profile', label: '我的档案' },
];

const knowledgeLinks = [
  { href: '/knowledge', label: '知识库' },
  { href: '/cases',     label: '案例库' },
  { href: '/insights',  label: '洞察' },
  { href: '/world-yi',  label: '世界易' },
  { href: '/visual-assets', label: '图片库' },
];

const accountLinks = [
  { href: '/updates', label: '邮件更新' },
  { href: '/login',   label: '邮箱登录' },
  { href: '/docs',    label: '文档中心' },
];

const priorityGrowthFooterLinks = getPriorityGrowthToolLinks('footer_priority_growth');

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* 顶层：brand 锚 + slogan + 主入口 */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          <div className="space-y-4">
            <BrandLockup size="lg" withSubtitle href={null} />
            <p className="max-w-md text-sm leading-6 text-[color:var(--ink-4)]">
              基于真太阳时校正与世界易判断框架，为决策型用户提供可持续使用的现代判断系统。
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {priorityGrowthFooterLinks.slice(0, 4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-2)] hover:border-[color:var(--brand)] hover:bg-[color:var(--bg-elevated)]"
                >
                  {item.shortLabel}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <Eyebrow tone="muted" className="mb-3">产品</Eyebrow>
              <ul className="space-y-2">
                {productLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Eyebrow tone="muted" className="mb-3">知识</Eyebrow>
              <ul className="space-y-2">
                {knowledgeLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Eyebrow tone="muted" className="mb-3">账户</Eyebrow>
              <ul className="space-y-2">
                {accountLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 底层：版权 + 信任声明 */}
        <div className="mt-10 flex flex-col gap-3 border-t border-[color:var(--hairline)] pt-6 text-xs text-[color:var(--ink-5)] md:flex-row md:items-center md:justify-between">
          <div>© <span className="num">{year}</span> 人生K线 · LIFE KLINE · 现代判断系统</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>真太阳时校正</span>
            <span className="text-[color:var(--ink-6)]">·</span>
            <span>分钟级节气精度</span>
            <span className="text-[color:var(--ink-6)]">·</span>
            <span>600+ 大师话术库</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
