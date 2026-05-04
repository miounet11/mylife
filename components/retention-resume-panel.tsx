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
  description,
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
    <section className="relative overflow-hidden rounded-[2rem] border border-[color:rgba(139,115,70,0.16)] bg-[linear-gradient(135deg,rgba(49,35,18,0.94),rgba(117,88,43,0.9))] p-5 text-white shadow-[0_24px_70px_rgba(47,32,14,0.14)] md:p-6">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/14 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-amber-200/16 blur-3xl" />

      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-stretch">
        <div className="space-y-4">
          <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-amber-100">
            {eyebrow}
          </div>
          <div>
            <h2 className="text-2xl font-black leading-tight md:text-3xl">{title}</h2>
            <div className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/78">{description}</div>
          </div>
          {primaryAction ? (
            <div className="flex flex-wrap gap-3">
              <ResultCtaLink
                href={primaryAction.href}
                page={page}
                target={primaryAction.target}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[color:var(--ink)] shadow-[0_12px_30px_rgba(255,255,255,0.16)] transition hover:-translate-y-0.5"
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
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/16"
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
            <div key={item.label} className="rounded-[1.35rem] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
              <div className="text-xs font-semibold tracking-[0.16em] text-amber-100/86">{item.label}</div>
              <div className="mt-2 text-2xl font-black text-white">{item.value}</div>
              {item.helper ? <div className="mt-1 text-xs leading-5 text-white/68">{item.helper}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
