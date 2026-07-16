import Link from 'next/link';
import {
  OFFICIAL_GITHUB_LABEL,
  OFFICIAL_GITHUB_URL,
  OFFICIAL_TELEGRAM_HANDLE,
  OFFICIAL_TELEGRAM_URL,
} from '@/lib/site-social';
import { cn } from '@/lib/utils';

type RailLink = {
  href: string;
  label: string;
};

const primaryLinks: RailLink[] = [
  { href: '/', label: '首页' },
  { href: '/analyze', label: '开始排盘' },
  { href: '/tools/timing-yearly-window', label: '填生日测' },
  { href: '/teachers', label: '请老师' },
  { href: '/dimensions', label: '十维度' },
  { href: '/predictions', label: '预测回访' },
  { href: '/events', label: '事件日历' },
  { href: '/hehun', label: '合婚' },
  { href: '/chat', label: '对话' },
  { href: '/profile', label: '资料' },
  { href: '/docs', label: '说明' },
];

const exploreLinks: RailLink[] = [
  { href: '/tools', label: '工具' },
  { href: '/knowledge', label: '知识库' },
  { href: '/cases', label: '案例' },
  { href: '/learn', label: '专题' },
  { href: '/membership', label: '会员' },
  { href: '/world-yi', label: '世界易' },
];

function RailSectionTitle({ children }: { children: string }) {
  return (
    <div className="px-3 pb-1.5 pt-3 text-[11px] font-medium tracking-[0.04em] text-[color:var(--ink-5)]">
      {children}
    </div>
  );
}

function RailLinkItem({
  item,
  active,
  muted,
}: {
  item: RailLink;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        'block rounded-[var(--radius)] px-2.5 py-1.5 text-[13px] no-underline transition hover:no-underline',
        active
          ? 'bg-[color:var(--bg-sunken)] font-medium text-[color:var(--ink-1)]'
          : muted
            ? 'font-normal text-[color:var(--ink-4)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-2)]'
            : 'font-normal text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]',
      )}
    >
      {item.label}
    </Link>
  );
}

export function PortalRailLeft({ activePath = '/analyze' }: { activePath?: string }) {
  return (
    <nav className="overflow-hidden border-y border-[color:var(--hairline)]" aria-label="门户导航">
      <RailSectionTitle>导航</RailSectionTitle>
      <ul className="space-y-0.5 px-2 pb-2">
        {primaryLinks.map((item) => {
          const active =
            activePath === item.href ||
            (item.href !== '/' && (activePath || '').startsWith(`${item.href}/`));
          return (
            <li key={item.href}>
              <RailLinkItem item={item} active={active} />
            </li>
          );
        })}
      </ul>
      <div className="mx-2 border-t border-[color:var(--hairline)]" />
      <RailSectionTitle>更多</RailSectionTitle>
      <ul className="space-y-0.5 px-2 pb-3">
        {exploreLinks.map((item) => (
          <li key={item.href}>
            <RailLinkItem item={item} muted />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PortalRailRight() {
  return (
    <div className="space-y-4">
      <section className="border-y border-[color:var(--hairline)] py-3">
        <div className="text-[11px] font-medium tracking-[0.04em] text-[color:var(--ink-5)]">常用</div>
        <ul className="mt-2 space-y-0.5">
          {[
            { href: '/tools/timing-yearly-window', label: '填生日·年度窗口' },
            { href: '/dimensions/fortune-rhythm', label: '运势节奏' },
            { href: '/dimensions/career-industry', label: '工作行业' },
            { href: '/tools/daily-sign', label: '今日一签' },
            { href: '/hehun', label: '合婚双盘' },
            { href: '/cases', label: '案例' },
            { href: '/knowledge', label: '知识库' },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-[var(--radius)] px-2 py-1.5 text-[13px] text-[color:var(--ink-2)] no-underline hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)] hover:no-underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-[color:var(--hairline)] py-3">
        <div className="text-[11px] font-medium tracking-[0.04em] text-[color:var(--ink-5)]">说明</div>
        <ul className="mt-2 space-y-0.5">
          {[
            { href: '/docs/birth-info', label: '出生信息怎么填' },
            { href: '/docs/true-solar-time', label: '真太阳时' },
            { href: '/docs/read-first-report', label: '如何读报告' },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-[var(--radius)] px-2 py-1.5 text-[12px] text-[color:var(--ink-4)] no-underline hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-2)] hover:no-underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-1 py-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[color:var(--ink-5)]">
          <a
            href={OFFICIAL_TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[color:var(--ink-3)] hover:no-underline"
          >
            {OFFICIAL_TELEGRAM_HANDLE}
          </a>
          <a
            href={OFFICIAL_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[color:var(--ink-3)] hover:no-underline"
          >
            {OFFICIAL_GITHUB_LABEL}
          </a>
        </div>
      </section>
    </div>
  );
}
