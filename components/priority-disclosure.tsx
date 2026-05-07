import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type PriorityDisclosureProps = {
  title: string;
  children: ReactNode;
  label?: ReactNode;
  description?: string;
  className?: string;
  defaultOpen?: boolean;
};

export default function PriorityDisclosure({
  title,
  children,
  label,
  description,
  className = '',
  defaultOpen = false,
}: PriorityDisclosureProps) {
  return (
    <details className={`priority-disclosure ${className}`} open={defaultOpen}>
      <summary className="priority-disclosure-summary">
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
        <span className="priority-disclosure-icon">
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <div className="priority-disclosure-body">{children}</div>
    </details>
  );
}
