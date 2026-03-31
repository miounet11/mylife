import Link from 'next/link';

const footerLinks = [
  { href: '/login', label: '邮箱登录' },
  { href: '/world-yi', label: '世界易' },
  { href: '/world-yi/book', label: '主书工程' },
  { href: '/tools', label: '工具中心' },
  { href: '/knowledge', label: '知识库' },
  { href: '/knowledge/topics', label: '专题地图' },
  { href: '/insights', label: '洞察中心' },
  { href: '/cases', label: '案例库' },
  { href: '/updates', label: '邮件更新' },
  { href: '/analyze', label: '进入判断' },
  { href: '/chat', label: '结构追问' },
  { href: '/events', label: '事件管理' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-[color:var(--surface)]/92">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-xl">
          <div className="text-lg font-semibold text-[color:var(--ink)]">人生K线</div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            用结构、阶段、环境、动作四步，帮你更快得到可执行判断。
          </p>
          <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
            首页、工具、案例、知识和追问入口已打通，可直接进入下一步。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {footerLinks.map((item) => (
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
    </footer>
  );
}
