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
  description: _description,
  className = '',
  defaultOpen = false,
}: PriorityDisclosureProps) {
  return (
    <details className={`priority-disclosure ${className}`} open={defaultOpen}>
      <summary className="priority-disclosure-summary">
        <span className="min-w-0">
          {label ? <span className="section-label">{label}</span> : null}
          <span className="mt-1 block text-lg font-black text-[color:var(--ink)] md:text-xl">{title}</span>
        </span>
        <span className="priority-disclosure-icon">
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <div className="priority-disclosure-body">
        {children}
      </div>
    </details>
  );
}
