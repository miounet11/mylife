'use client';

import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
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
  const [primaryAction, ...secondaryActions] = actions;

  return (
    <section className="rounded-[var(--radius)] border border-[rgba(18,125,111,0.22)] bg-[color:var(--accent-strong)] p-4 text-white shadow-[0_18px_42px_rgba(11,95,85,0.16)] md:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-stretch">
        <div className="space-y-3">
          <div className="inline-flex rounded-md bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/82">
            {eyebrow}
          </div>
          <div>
            <h2 className="text-2xl font-black leading-tight">{title}</h2>
          </div>
          {primaryAction ? (
            <div className="flex flex-wrap gap-3">
              <ResultCtaLink
                href={primaryAction.href}
                page={page}
                target={primaryAction.target}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-[color:var(--ink)] shadow-[0_12px_30px_rgba(255,255,255,0.16)] transition hover:-translate-y-0.5"
                meta={{
                  source,
                  ctaStrategyKey,
                  sourceFamily,
                  surface: 'retention_resume_panel',
                  cta: primaryAction.target,
                  ...primaryAction.meta,
                }}
              >
                {primaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </ResultCtaLink>
              {secondaryActions.map((action) => (
                <ResultCtaLink
                  key={action.target}
                  href={action.href}
                  page={page}
                  target={action.target}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/16"
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
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map((item) => (
            <div key={item.label} className="rounded-lg border border-white/12 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-xs font-semibold tracking-[0.16em] text-white/82">{item.label}</div>
              <div className="mt-1 text-2xl font-black text-white">{item.value}</div>
              {item.helper ? <div className="mt-1 text-xs leading-5 text-white/68">{item.helper}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
