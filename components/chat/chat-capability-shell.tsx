'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';
import { isEnglishUiLocale } from '@/lib/i18n/teacher-copy';

/**
 * Slim collapsible chrome for teacher capability diagram.
 * Keeps dialogue as the primary surface; diagram is optional and foldable.
 */
export function ChatCapabilityShell({
  title,
  subtitle,
  children,
  defaultOpen = true,
  locale,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  locale?: string | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const en = isEnglishUiLocale(locale);

  return (
    <div className="shrink-0 border-b border-[color:var(--hairline)] bg-[color:var(--paper)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition hover:bg-[color:var(--bg-sunken)]/50 active:opacity-90"
        aria-expanded={open}
      >
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-5)]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-[color:var(--ink-1)]">
            {title}
          </div>
          {!open && subtitle ? (
            <div className="truncate text-[11px] leading-[1.3] text-[color:var(--ink-5)]">
              {subtitle}
            </div>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[color:var(--ink-3)]">
          {open
            ? en
              ? 'Hide diagram'
              : '收起图解'
            : en
              ? 'Show diagram'
              : '展开图解'}
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>
      {open ? children : null}
    </div>
  );
}
