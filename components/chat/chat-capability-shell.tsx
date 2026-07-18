'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';

/**
 * Collapsible chrome for teacher capability diagram inside the messenger card.
 * Default expanded on open; user can collapse to free chat height.
 */
export function ChatCapabilityShell({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="shrink-0 border-b border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-[color:var(--bg-sunken)]/70 active:opacity-90"
        aria-expanded={open}
      >
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-5)]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-[color:var(--ink-1)]">
            {title}
          </div>
          {subtitle ? (
            <div className="truncate text-[11px] leading-[1.3] text-[color:var(--ink-5)]">
              {subtitle}
            </div>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[color:var(--ink-3)]">
          {open ? '收起' : '展开图解'}
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>
      {open ? <div className="border-t border-[color:var(--hairline)]">{children}</div> : null}
    </div>
  );
}
