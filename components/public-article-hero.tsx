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

// 决策台风文章 hero — 用于 /knowledge/[slug] /cases/[slug] /insights/[type]/[slug] /knowledge/topics/[topicSlug] 等详情页
// QA 契约：组件名 PublicArticleHero 必须出现在文件中（用于 qa:public-surface-heroes 检查）
export default function PublicArticleHero({
  breadcrumbs,
  backLink,
  label,
  title,
  meta,
  excerpt,
  hint,
  actionLabel = '快速操作',
  actions = [],
}: PublicArticleHeroProps) {
  return (
    <header className="space-y-4">
      {breadcrumbs}
      {backLink}

      <div className="space-y-3 pt-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          {label}
        </div>
        <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-4xl">
          {title}
        </h1>

        {/* meta：发布时间 / 分类 / tags 等（等宽）*/}
        {meta ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono tabular-nums text-[color:var(--ink-5)]">
            {meta}
          </div>
        ) : null}

        {/* excerpt：文章引言（之前被吞）*/}
        {excerpt ? (
          <div className="border-l-2 border-[color:var(--brand-soft-2)] pl-4 text-sm leading-7 text-[color:var(--ink-3)] md:text-base md:leading-8">
            {excerpt}
          </div>
        ) : null}

        {/* hint：辅助说明（之前被吞）*/}
        {hint ? (
          <p className="text-xs leading-5 text-[color:var(--ink-5)]">{hint}</p>
        ) : null}

        {/* actions：相关入口 */}
        {actions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {actions.map((action, index) => (
              <span key={index}>{action}</span>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
