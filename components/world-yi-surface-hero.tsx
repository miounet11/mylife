import Link from 'next/link';
import type { ReactNode } from 'react';

type HeroAction = {
  href: string;
  label: string;
  primary?: boolean;
  icon?: ReactNode;
};

type WorldYiSurfaceHeroProps = {
  label: ReactNode;
  title: ReactNode;
  description: string;
  hint: string;
  actionLabel?: string;
  actions: HeroAction[];
  highlights: Array<{
    title?: string;
    body: string;
  }>;
  highlightsColumns?: string;
};

// 决策台风 hero — World Yi 系统总入口及子页
export default function WorldYiSurfaceHero({
  label,
  title,
  description,
  hint,
  actionLabel = '快速操作',
  actions,
  highlights,
  highlightsColumns = 'md:grid-cols-2',
}: WorldYiSurfaceHeroProps) {
  const [primaryAction, ...secondaryActions] = actions;
  const hasHighlights = highlights && highlights.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] p-5 md:p-7">
      {/* 装饰：极淡的 K 线刻度 */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
        viewBox="0 0 600 200"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="100" x2="600" y2="100" stroke="var(--hairline)" strokeDasharray="3 4" />
        {[60, 130, 200, 270, 340, 410, 480, 550].map((x, i) => {
          const heights = [50, 70, 95, 130, 80, 145, 110, 105];
          const ys = [75, 65, 52, 35, 60, 27, 45, 47];
          return (
            <rect
              key={x}
              x={x}
              y={ys[i]}
              width="4"
              height={heights[i]}
              fill="var(--brand-soft)"
              opacity="0.6"
            />
          );
        })}
        <path d="M 540 80 L 552 92 L 540 104 L 528 92 Z" fill="var(--signal)" opacity="0.55" />
      </svg>

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            {label}
          </div>
          <h1 className="text-2xl font-black leading-[1.1] tracking-tight text-[color:var(--ink-1)] md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-xl text-sm leading-6 text-[color:var(--ink-3)]">{description}</p>
          ) : null}
          {hint ? (
            <p className="max-w-xl text-xs leading-5 text-[color:var(--ink-5)]">{hint}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
              >
                {primaryAction.label}
                {primaryAction.icon}
              </Link>
            ) : null}
            {secondaryActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
              >
                {action.label}
                {action.icon}
              </Link>
            ))}
          </div>
        </div>

        {hasHighlights ? (
          <div className={`grid gap-3 ${highlightsColumns}`}>
            {highlights.map((item, index) => (
              <div
                key={`${item.title || ''}-${item.body}`}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4"
              >
                <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                  WORLD YI SIGNAL {String(index + 1).padStart(2, '0')}
                </div>
                {item.title ? (
                  <div className="mt-2 text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                    {item.title}
                  </div>
                ) : null}
                <p className="mt-2 text-xs leading-5 text-[color:var(--ink-3)]">{item.body}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
