import Link from 'next/link';
import { ArrowRight, CheckCircle2, Route } from 'lucide-react';
import { getSurfaceRole, type ExperienceSurfaceKey } from '@/lib/product-experience';

type ProductSurfaceRolePanelProps = {
  surface: ExperienceSurfaceKey;
  className?: string;
  title?: string;
  description?: string;
  compact?: boolean;
};

export default function ProductSurfaceRolePanel({
  surface,
  className = '',
  title,
  description,
  compact = false,
}: ProductSurfaceRolePanelProps) {
  const role = getSurfaceRole(surface);

  if (!role) {
    return null;
  }

  return (
    <section className={`glass-panel rounded-[1.75rem] p-5 md:p-6 ${className}`}>
      <div className={compact ? 'grid gap-5 lg:grid-cols-[0.9fr_1.1fr]' : 'grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start'}>
        <div>
          <div className="section-label">{role.label}</div>
          <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)] md:text-3xl">
            {title || role.primaryAction}
          </h2>
          <p className="intro-copy mt-3">{description || role.job}</p>
          <div className="intro-panel mt-4">
            {role.layoutRule}
          </div>
          {!compact ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.1rem] bg-white/78 px-4 py-3">
                <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--muted)]">交互规则</div>
                <div className="mt-2 text-sm leading-6 text-[color:var(--ink)]">{role.interactionRule}</div>
              </div>
              <div className="rounded-[1.1rem] bg-white/78 px-4 py-3">
                <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--muted)]">看板指标</div>
                <div className="mt-2 text-sm leading-6 text-[color:var(--ink)]">{role.successMetric}</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.35rem] border border-[color:var(--line)] bg-white/72 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--ink)]">
              <Route className="h-4 w-4 text-[color:var(--accent-strong)]" />
              推荐阅读顺序
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {role.readingOrder.map((item, index) => (
                <span key={item} className="product-chip">
                  {String(index + 1).padStart(2, '0')}
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {role.nextSteps.map((step) => {
              const isPrimary = step.emphasis === 'primary';

              return (
                <Link
                  key={step.key}
                  href={step.href}
                  className={`rounded-[1.25rem] border p-4 transition hover:border-[color:var(--accent)] ${
                    isPrimary
                      ? 'border-[rgba(178,149,93,0.34)] bg-[color:var(--accent-soft)]'
                      : 'border-[color:var(--line)] bg-white/76'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--ink)]">
                        {isPrimary ? <CheckCircle2 className="h-4 w-4 text-[color:var(--accent-strong)]" /> : null}
                        {step.title}
                      </div>
                      <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{step.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[color:var(--accent-strong)]" />
                  </div>
                  <div className="action-guide mt-3">{step.action}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
