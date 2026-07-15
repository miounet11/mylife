'use client';

export default function ProductSurfaceRolePanel({
  title,
  description,
  surface,
  compact,
}: {
  title?: string;
  description?: string;
  surface?: string;
  compact?: boolean;
}) {
  return (
    <section className={`fb-card ${compact ? 'p-3' : 'p-4'}`}>
      {surface ? <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-4)]">{surface}</div> : null}
      {title ? <h2 className="mt-1 text-sm font-bold text-[color:var(--ink-1)]">{title}</h2> : null}
      {description ? <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">{description}</p> : null}
    </section>
  );
}