import type { ReactNode } from 'react';

type PublicSurfaceHeroProps = {
  label: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  actionLabel?: string;
  actions: ReactNode[];
  highlights: Array<{
    title?: ReactNode;
    body: ReactNode;
  }>;
  highlightsColumns?: string;
};

export default function PublicSurfaceHero({
  label,
  title,
  description,
  hint,
  actionLabel = '快速操作',
  actions,
  highlights,
  highlightsColumns = 'md:grid-cols-2',
}: PublicSurfaceHeroProps) {
  const [primaryAction, ...secondaryActions] = actions;
  const hasSupportCopy = Boolean(description) || Boolean(hint);

  return (
    <section className="glass-panel grid gap-7 rounded-[1.75rem] p-5 md:p-7 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:items-start">
      <div className="space-y-5 lg:max-w-2xl">
        <div className="section-label">{label}</div>
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">{title}</h1>
        {hasSupportCopy ? (
          <div className="space-y-3">
            {description ? <div className="hero-description">{description}</div> : null}
            {hint ? <div className="hero-hint">{hint}</div> : null}
          </div>
        ) : null}
        {primaryAction ? (
          <div className="space-y-3">
            <div className="action-guide">{actionLabel}</div>
            <div className="flex flex-wrap items-center gap-3">{primaryAction}</div>
            {secondaryActions.length ? (
              <div className="action-strip flex flex-wrap gap-3">
                {secondaryActions.map((action, index) => (
                  <div key={index}>{action}</div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={`grid gap-4 ${highlightsColumns}`}>
        {highlights.map((item, index) => (
          <div key={index} className="soft-card rounded-[1.35rem] p-4 md:p-5">
            <div className="product-kicker">重点信号 {String(index + 1).padStart(2, '0')}</div>
            {item.title ? <div className="mt-3 text-xl font-black text-[color:var(--ink)] md:text-2xl">{item.title}</div> : null}
            <div className={item.title ? 'mt-3 text-sm font-semibold leading-6 text-[color:var(--ink)]' : 'mt-3 text-sm font-semibold leading-6 text-[color:var(--ink)]'}>{item.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
