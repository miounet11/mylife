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

export default function WorldYiSurfaceHero({
  label,
  title,
  description: _description,
  hint: _hint,
  actionLabel = '快速操作',
  actions,
  highlights,
  highlightsColumns = 'md:grid-cols-2',
}: WorldYiSurfaceHeroProps) {
  const [primaryAction, ...secondaryActions] = actions;

  return (
    <section className="relative grid gap-8 overflow-hidden rounded-[2.4rem] border border-[color:rgba(139,115,70,0.16)] bg-[linear-gradient(140deg,rgba(255,252,246,0.95),rgba(244,233,216,0.94))] p-6 shadow-[0_26px_80px_rgba(47,32,14,0.1)] md:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
      <div className="pointer-events-none absolute left-8 top-8 h-20 w-20 rounded-full border border-[rgba(178,149,93,0.24)]" />
      <div className="pointer-events-none absolute bottom-6 right-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(178,149,93,0.18),transparent_70%)]" />
      <div className="space-y-6">
        <div className="section-label">{label}</div>
        <h1 className="text-4xl font-black leading-[0.96] text-[color:var(--ink)] md:text-6xl">{title}</h1>
        <div className="space-y-2">
          <div className="action-guide">{actionLabel}</div>
          <div className="action-strip flex flex-wrap gap-3 rounded-[1.5rem] bg-white/56">
            {primaryAction ? (
              <Link href={primaryAction.href} className="action-primary action-main">
                {primaryAction.label}
                {primaryAction.icon}
              </Link>
            ) : null}
            {secondaryActions.map((action) => (
              <Link key={action.href} href={action.href} className="action-secondary">
                {action.label}
                {action.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${highlightsColumns}`}>
        {highlights.map((item, index) => (
          <div key={`${item.title || ''}-${item.body}`} className="soft-card relative overflow-hidden rounded-[1.75rem] p-5">
            <div className="product-kicker">World Yi Signal {String(index + 1).padStart(2, '0')}</div>
            {item.title ? <div className="mt-3 text-lg font-bold text-[color:var(--ink)]">{item.title}</div> : null}
            <p className={item.title ? 'mt-3 text-sm font-semibold leading-6 text-[color:var(--ink)]' : 'mt-3 text-sm font-semibold leading-6 text-[color:var(--ink)]'}>{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
