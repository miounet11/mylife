import type { ReactNode } from 'react';

// v5-D65 (2026-05-22) 拍平：去掉 details/summary 折叠 + chevron 旋转动画。
// SEO 抓取更稳（不再依赖 open 属性可见性 + 不影响 LCP），用户少一次点击直达内容。
// API 兼容：保留 defaultOpen prop 但不再起作用，所有内容默认全展开。

type PriorityDisclosureProps = {
  title: string;
  children: ReactNode;
  label?: ReactNode;
  description?: string;
  className?: string;
  /** v5-D65 起忽略：组件统一全展开 */
  defaultOpen?: boolean;
};

export default function PriorityDisclosure({
  title,
  children,
  label,
  description,
  className = '',
}: PriorityDisclosureProps) {
  return (
    <section className={`priority-disclosure priority-disclosure--open ${className}`}>
      <header className="priority-disclosure-summary priority-disclosure-summary--static">
        <span className="min-w-0">
          {label ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              {label}
            </span>
          ) : null}
          <span className="mt-1 block text-base font-black leading-snug text-[color:var(--ink-1)] md:text-lg">
            {title}
          </span>
          {description ? (
            <span className="mt-1 block text-xs leading-5 text-[color:var(--ink-4)]">
              {description}
            </span>
          ) : null}
        </span>
      </header>
      <div className="priority-disclosure-body">{children}</div>
    </section>
  );
}
