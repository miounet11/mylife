'use client';

import type { ReactNode } from 'react';
import ResultCtaLink from '@/components/result-cta-link';

type RetentionResumeAction = {
  href: string;
  label: string;
  target: string;
  helper?: string;
  meta?: Record<string, unknown>;
  variant?: 'primary' | 'secondary';
};

type RetentionResumeStat = {
  label: string;
  value: ReactNode;
  helper?: string;
};

/** Quiet resume strip — text links, no brand gradient chrome. */
export default function RetentionResumePanel({
  page,
  source,
  ctaStrategyKey,
  sourceFamily,
  eyebrow = '继续上次任务',
  title,
  description: _description,
  stats,
  actions,
}: {
  page: string;
  source: string;
  ctaStrategyKey: string;
  sourceFamily: string;
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  stats: RetentionResumeStat[];
  actions: RetentionResumeAction[];
}) {
  return (
    <section className="border-y border-[color:var(--hairline)] py-4">
      <div className="text-[12px] font-medium text-[color:var(--ink-5)]">{eyebrow}</div>
      <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]">{title}</h2>

      {actions.length ? (
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {actions.map((action, i) => (
            <ResultCtaLink
              key={action.target}
              href={action.href}
              page={page}
              target={action.target}
              className={
                i === 0
                  ? 'text-[color:var(--ink-1)] underline-offset-2 hover:underline'
                  : 'text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline'
              }
              meta={{
                source,
                ctaStrategyKey,
                sourceFamily,
                surface: 'retention_resume_panel',
                cta: action.target,
                ...action.meta,
              }}
            >
              {action.label}
            </ResultCtaLink>
          ))}
        </div>
      ) : null}

      {stats.length ? (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-[color:var(--ink-5)]">
          {stats.map((item) => (
            <div key={item.label} className="flex items-baseline gap-1.5">
              <dt>{item.label}</dt>
              <dd className="font-medium text-[color:var(--ink-2)]">{item.value}</dd>
              {item.helper ? <span className="text-[11px]">· {item.helper}</span> : null}
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
