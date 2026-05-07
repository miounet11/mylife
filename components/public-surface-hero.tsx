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
  description: _description,
  hint: _hint,
  actionLabel = '快速操作',
  actions,
  highlights: _highlights,
  highlightsColumns: _highlightsColumns = 'md:grid-cols-2',
}: PublicSurfaceHeroProps) {
  const [primaryAction, ...secondaryActions] = actions;

  return (
    <section className="surface-hero">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)] lg:items-start">
        <div className="space-y-4 lg:max-w-2xl">
          <div className="section-label">{label}</div>
          <h1 className="max-w-3xl text-3xl font-black leading-tight text-[color:var(--ink)] md:text-4xl">{title}</h1>
          {primaryAction ? (
            <div className="space-y-3">
              <div className="action-guide">{actionLabel}</div>
              <div className="flex flex-wrap items-center gap-3">{primaryAction}</div>
              {secondaryActions.length ? (
                <div className="flex flex-wrap gap-3">
                  {secondaryActions.map((action, index) => (
                    <div key={index}>{action}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
