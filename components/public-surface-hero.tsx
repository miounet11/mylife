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
    <section className="relative grid gap-8 overflow-hidden rounded-[2.25rem] border border-[color:rgba(139,115,70,0.14)] bg-[linear-gradient(135deg,rgba(255,253,248,0.95),rgba(247,240,228,0.88))] p-6 shadow-[0_24px_70px_rgba(47,32,14,0.08)] md:p-8 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:items-start lg:p-10">
      <div className="pointer-events-none absolute inset-y-8 right-8 hidden w-px bg-[linear-gradient(180deg,transparent,rgba(139,115,70,0.2),transparent)] lg:block" />
      <div className="space-y-5 lg:max-w-2xl">
        <div className="section-label">{label}</div>
        <h1 className="max-w-3xl text-4xl font-black leading-[0.98] text-[color:var(--ink)] md:text-5xl lg:text-6xl">{title}</h1>
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
              <div className="action-strip flex flex-wrap gap-3 rounded-[1.4rem] bg-white/58">
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
          <div key={index} className="soft-card relative overflow-hidden rounded-[1.6rem] p-5 md:p-6">
            <div className="absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(178,149,93,0.5),transparent)]" />
            <div className="product-kicker">重点信号 {String(index + 1).padStart(2, '0')}</div>
            {item.title ? <div className="mt-3 text-xl font-black text-[color:var(--ink)] md:text-2xl">{item.title}</div> : null}
            <div className={item.title ? 'mt-3 text-sm font-semibold leading-6 text-[color:var(--ink)]' : 'mt-3 text-sm font-semibold leading-6 text-[color:var(--ink)]'}>{item.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
