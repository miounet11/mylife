import type { ReactNode } from 'react';

type PublicSurfaceHeroProps = {
  label: ReactNode;
  title: ReactNode;
  description: ReactNode;
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
  return (
    <section className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="space-y-5">
        <div className="section-label">{label}</div>
        <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">{title}</h1>
        <div className="intro-copy">{description}</div>
        {hint ? <div className="intro-panel">{hint}</div> : null}
        <div className="space-y-2">
          <div className="action-guide">{actionLabel}</div>
          <div className="action-strip flex flex-wrap gap-3">
            {actions.map((action, index) => (
              <div key={index}>{action}</div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${highlightsColumns}`}>
        {highlights.map((item, index) => (
          <div key={index} className="soft-card rounded-[1.5rem] p-5">
            {item.title ? <div className="text-2xl font-black text-[color:var(--ink)]">{item.title}</div> : null}
            <div className={item.title ? 'intro-copy mt-3' : 'text-xs leading-6 text-[color:var(--ink)]'}>{item.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
