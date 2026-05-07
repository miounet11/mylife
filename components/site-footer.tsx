import Link from 'next/link';
import { getPriorityGrowthToolLinks } from '@/lib/tools';

const primaryFooterLinks = [
  { href: '/analyze', label: '开始判断' },
  { href: '/chat', label: '继续追问' },
  { href: '/events', label: '记录事件' },
];

const priorityGrowthFooterLinks = getPriorityGrowthToolLinks('footer_priority_growth');

const secondaryFooterLinks = [
  { href: '/tools', label: '工具中心' },
  { href: '/docs', label: 'Docs' },
  { href: '/knowledge', label: '知识库' },
  { href: '/cases', label: '案例库' },
  { href: '/updates', label: '邮件更新' },
  { href: '/profile', label: '我的档案' },
  { href: '/login', label: '邮箱登录' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-[color:var(--surface)]/92">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8">
        <div className="max-w-2xl space-y-4">
          <div className="section-label">下一步</div>
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-[color:var(--ink)]">判断入口</div>
          </div>
          <div className="flex flex-wrap gap-3">
            {primaryFooterLinks.map((item, index) => (
              <Link key={item.href} href={item.href} className={index === 0 ? 'action-primary' : 'action-secondary'}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="rounded-[1.25rem] bg-white/72 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">热门免费工具</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {priorityGrowthFooterLinks.map((item) => (
                <Link key={item.href} href={item.href} className="action-secondary min-h-0 px-3 py-2 text-xs">
                  {item.shortLabel === '2026 流年' ? '2026 流年免费测' : item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="soft-card rounded-[1.5rem] p-5">
          <div className="product-kicker">更多入口</div>
          <div className="mt-4 flex flex-wrap gap-3">
            {secondaryFooterLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="action-secondary min-h-0 px-4 py-2 text-[color:var(--muted)] hover:text-[color:var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
