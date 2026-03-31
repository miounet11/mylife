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
  description,
  hint,
  actionLabel = '快速操作',
  actions,
  highlights,
  highlightsColumns = 'md:grid-cols-2',
}: WorldYiSurfaceHeroProps) {
  const [primaryAction, ...secondaryActions] = actions;

  return (
    <section className="grid gap-8 lg:grid-cols-[0.96fr_1.04fr]">
      <div className="space-y-6">
        <div className="section-label">{label}</div>
        <h1 className="text-4xl font-black leading-tight text-[color:var(--ink)] md:text-6xl">{title}</h1>
        <p className="intro-copy">{description}</p>
        <div className="intro-panel">{hint}</div>
        <div className="space-y-2">
          <div className="action-guide">{actionLabel}</div>
          <div className="action-strip flex flex-wrap gap-3">
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
        {highlights.map((item) => (
          <div key={`${item.title || ''}-${item.body}`} className="soft-card rounded-[1.75rem] p-5">
            {item.title ? <div className="text-lg font-bold text-[color:var(--ink)]">{item.title}</div> : null}
            <p className={item.title ? 'intro-copy mt-3' : 'text-xs leading-6 text-[color:var(--ink)]'}>{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
