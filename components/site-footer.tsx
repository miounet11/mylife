import Link from 'next/link';

const footerLinks = [
  { href: '/login', label: '邮箱登录' },
  { href: '/knowledge', label: '知识库' },
  { href: '/knowledge/topics', label: '专题地图' },
  { href: '/insights', label: '洞察中心' },
  { href: '/cases', label: '案例库' },
  { href: '/updates', label: '邮件更新' },
  { href: '/analyze', label: '重新测算' },
  { href: '/chat', label: 'AI 咨询' },
  { href: '/events', label: '事件管理' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-[color:var(--surface)]/92">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-xl">
          <div className="text-lg font-semibold text-[color:var(--ink)]">人生K线</div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            用更清晰的命理数据、更顺滑的交互路径和更可信的结果表达，帮助用户完成一次真正可用的分析体验。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
