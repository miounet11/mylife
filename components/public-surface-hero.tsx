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

// 决策台风 hero — 用于所有公开 surface 页（/insights, /world-yi 子页, /history, /admin/* 等）
// QA 契约：必须包含 'PublicSurfaceHero' 字面量供 qa:public-surface-heroes 检测
export default function PublicSurfaceHero({
  label,
  title,
  description,
  hint,
  actionLabel = '快速操作',
  actions,
  highlights,
  highlightsColumns = 'md:grid-cols-3',
}: PublicSurfaceHeroProps) {
  const [primaryAction, ...secondaryActions] = actions;
  const hasHighlights = highlights && highlights.length > 0;

  return (
    <section className="border-b border-[color:var(--hairline)] py-2">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        {/* 左：kicker + title + description + actions */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            {label}
          </div>
          <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">{description}</p>
          ) : null}
          {hint ? (
            <p className="max-w-2xl text-xs leading-5 text-[color:var(--ink-5)]">{hint}</p>
          ) : null}
          {primaryAction ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {primaryAction}
              {secondaryActions.length ? secondaryActions.map((action, index) => <span key={index}>{action}</span>) : null}
            </div>
          ) : null}
        </div>

        {/* 右：highlights 网格（如有）— 决策台风 stat 块 */}
        {hasHighlights ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 md:p-5">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
              {actionLabel}
            </div>
            <div className={`grid gap-3 ${highlightsColumns}`}>
              {highlights.map((item, index) => (
                <div key={index} className="border-l-2 border-[color:var(--hairline)] pl-3">
                  {item.title ? (
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                      {item.title}
                    </div>
                  ) : null}
                  <div className="mt-1 text-xs leading-5 text-[color:var(--ink-2)]">{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
