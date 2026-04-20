import Link from 'next/link';

const primaryFooterLinks = [
  { href: '/analyze', label: '开始判断' },
  { href: '/chat', label: '继续追问' },
  { href: '/events', label: '记录事件' },
];

const secondaryFooterLinks = [
  { href: '/tools', label: '工具中心' },
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
            <p className="hero-description intro-copy text-sm">
              如果你已经看过案例、知识或工具，下一步就是把出生信息补齐，直接进入个人判断结果页。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {primaryFooterLinks.map((item, index) => (
              <Link key={item.href} href={item.href} className={index === 0 ? 'action-primary' : 'action-secondary'}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="soft-card rounded-[1.5rem] p-5">
          <div className="product-kicker">更多入口</div>
          <div className="intro-copy mt-3">除了判断入口，还可以继续去工具、知识、案例和更新中心补全世界易路径。</div>
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
