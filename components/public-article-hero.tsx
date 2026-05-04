import type { ReactNode } from 'react';

type PublicArticleHeroProps = {
  breadcrumbs: ReactNode;
  backLink: ReactNode;
  label: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  excerpt: ReactNode;
  hint?: ReactNode;
  actionLabel?: ReactNode;
  actions?: ReactNode[];
};

export default function PublicArticleHero({
  breadcrumbs,
  backLink,
  label,
  title,
  meta,
  excerpt: _excerpt,
  hint: _hint,
  actionLabel = '快速操作',
  actions = [],
}: PublicArticleHeroProps) {
  return (
    <>
      {breadcrumbs}
      {backLink}

      <div className="mt-6 section-label">{label}</div>
      <h1 className="mt-5 text-4xl font-black text-[color:var(--ink)] md:text-5xl">{title}</h1>
      {meta ? <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">{meta}</div> : null}
      {actions.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="action-guide">{actionLabel}</div>
          <div className="action-strip flex flex-wrap gap-3">
            {actions.map((action, index) => (
              <div key={index}>{action}</div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
