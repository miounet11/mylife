import Link from 'next/link';
import { Compass, FileBarChart2, Newspaper, Sparkles, BookOpenText, Layers3, Globe2 } from 'lucide-react';

// v5-D60 FB 风左 rail：sticky 锚导航 + 最近报告 + 我的档案入口
// 仅在桌面 xl+ 显示。移动端隐藏（通过外层 className 控制）。

type LeftRailReport = {
  id: string;
  name: string;
  relation?: string;
  relationLabel?: string;
};

const NAV_LINKS: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: '#analysis-form', label: '开始排盘', icon: Sparkles },
  { href: '#today-strip', label: '今日一签', icon: Compass },
  { href: '#sample-faq', label: '示例 / FAQ', icon: Newspaper },
  { href: '#priority-tools', label: '高意图工具', icon: Layers3 },
  { href: '#content-trio', label: '知识 / 案例 / 系统', icon: BookOpenText },
];

const PORTAL_LINKS: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: '/world-yi', label: '世界易学说', icon: Globe2 },
  { href: '/tools', label: '全部工具', icon: Layers3 },
  { href: '/knowledge', label: '知识库', icon: BookOpenText },
  { href: '/cases', label: '案例', icon: FileBarChart2 },
  { href: '/reports', label: '公开报告', icon: Newspaper },
];

export default function HomeLeftRail({
  reports,
  hasPersonalHistory,
}: {
  reports: LeftRailReport[];
  hasPersonalHistory: boolean;
}) {
  const recent = reports.slice(0, 5);

  return (
    <aside className="hidden xl:block w-[240px] shrink-0">
      <div className="sticky-top-header flex flex-col gap-2">
        {/* 门户导航卡 */}
        <nav
          aria-label="首页导航"
          className="fb-card overflow-hidden"
        >
          <div className="border-b border-[color:var(--fb-border)] px-3 py-2">
            <div className="fb-section-title">门户导航</div>
          </div>
          <ul className="flex flex-col py-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold text-[color:var(--fb-blue-link)] hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 进入产品 */}
        <nav
          aria-label="产品入口"
          className="fb-card overflow-hidden"
        >
          <div className="border-b border-[color:var(--fb-border)] px-3 py-2">
            <div className="fb-section-title">门户区块</div>
          </div>
          <ul className="flex flex-col py-1">
            {PORTAL_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold text-[color:var(--fb-blue-link)] hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 我的档案 / 最近报告 */}
        {hasPersonalHistory && recent.length > 0 ? (
          <div className="fb-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[color:var(--fb-border)] px-3 py-2">
              <div className="fb-section-title">最近档案</div>
              <Link
                href="/history"
                className="text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
              >
                全部
              </Link>
            </div>
            <ul className="flex flex-col py-1">
              {recent.map((r) => {
                const isSelf = !r.relation || r.relation === 'self';
                const tag = r.relationLabel || (isSelf ? '本人' : r.relation || '档案');
                return (
                  <li key={r.id}>
                    <Link
                      href={`/result/${r.id}`}
                      title={r.name || tag}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] text-xs font-bold ${
                          isSelf
                            ? 'bg-[color:var(--fb-blue)] text-white'
                            : 'bg-[color:var(--fb-action-bg)] text-[color:var(--fb-ink-2)]'
                        }`}
                      >
                        {(r.name || tag || '?').slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[color:var(--fb-ink-1)]">
                        {r.name || tag}
                      </span>
                      <span className="shrink-0 text-xs text-[color:var(--fb-ink-3)]">{tag}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="fb-card px-3 py-3">
            <div className="fb-section-title mb-1">还没有档案</div>
            <p className="text-[12px] leading-[1.5] text-[color:var(--fb-ink-3)]">
              填一次出生信息即可生成你的第一份命理档案，未来还能给关心的人也建一份。
            </p>
            <Link
              href="#analysis-form"
              className="mt-2 inline-flex h-7 items-center rounded-[2px] border border-[color:var(--fb-blue-strong)] bg-[color:var(--fb-blue)] px-2.5 text-[12px] font-semibold text-white no-underline hover:bg-[color:var(--fb-blue-strong)] hover:no-underline"
            >
              立即排盘
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
