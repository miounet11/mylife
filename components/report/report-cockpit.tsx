import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';

import type { ReportCockpitSection } from '@/lib/report-types';
import ResultCtaLink from '@/components/result-cta-link';

type GuidedPath = {
  href: string;
  title: string;
};

interface ReportCockpitProps {
  section: ReportCockpitSection;
  reportId: string;
  chatHref: string;
  eventsHref: string;
  guidedPaths?: GuidedPath[];
  followupQuestion?: string;
  sourceGuidance?: string;
  chatLabel?: string;
  eventsLabel?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}

function toneClasses(tone?: 'push' | 'steady' | 'caution') {
  if (tone === 'push') return 'border-emerald-200 bg-emerald-50/80 text-emerald-800';
  if (tone === 'caution') return 'border-amber-200 bg-amber-50/80 text-amber-900';
  return 'border-[color:var(--line)] bg-white/82 text-[color:var(--ink)]';
}

export default function ReportCockpit({
  section,
  reportId,
  chatHref,
  eventsHref,
  guidedPaths = [],
  followupQuestion,
  sourceGuidance,
  chatLabel,
  eventsLabel,
  ctaStrategyKey,
  sourceFamily,
}: ReportCockpitProps) {
  const topActions = section.topActions.slice(0, 3);
  const avoidances = section.avoidances.slice(0, 3);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--accent-soft)] px-4 py-4 md:px-5 md:py-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">驾驶舱判断</div>
          {section.stageLabel ? (
            <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              {section.stageLabel}
            </span>
          ) : null}
          {section.confidenceLabel ? (
            <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
              {section.confidenceLabel}
            </span>
          ) : null}
        </div>

        {section.judgment ? (
          <div className="mt-3 text-lg font-bold leading-8 text-[color:var(--ink)] md:text-xl">{section.judgment}</div>
        ) : null}

        {section.identityLabel || section.focusChips.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {section.identityLabel ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                {section.identityLabel}
              </span>
            ) : null}
            {section.focusChips.map((item) => (
              <span key={item} className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {section.periodCards.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {section.periodCards.map((card) => (
              <div key={`${card.label}-${card.value}`} className={`rounded-[1rem] border px-4 py-3 ${toneClasses(card.tone)}`}>
                <div className="text-[11px] uppercase tracking-[0.18em] opacity-70">{card.label}</div>
                <div className="mt-2 text-base font-bold">{card.value}</div>
                {card.note ? <div className="mt-2 text-xs leading-6">{card.note}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/74 px-4 py-4 md:px-5 md:py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">现在先做什么</div>
          <div className="mt-3 grid gap-3">
            <div className="rounded-[1rem] bg-[color:var(--accent-soft)] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">先做</div>
              <div className="mt-2 space-y-2 text-xs leading-6 text-[color:var(--ink)]">
                {topActions.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </div>
            <div className="rounded-[1rem] bg-rose-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-rose-500">先别做</div>
              <div className="mt-2 space-y-2 text-xs leading-6 text-rose-800">
                {avoidances.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {sourceGuidance ? (
              <div className="rounded-[1rem] border border-[color:var(--accent)] bg-[color:var(--accent-soft)]/60 px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                {sourceGuidance}
              </div>
            ) : null}
            {followupQuestion ? (
              <div className="rounded-[1rem] border border-[color:var(--line)] bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                预设追问：{followupQuestion}
              </div>
            ) : null}
            <ResultCtaLink
              href={chatHref}
              page={`/result/${reportId}`}
              target="result_cockpit_chat"
              className="action-primary action-main justify-between"
              meta={{
                reportId,
                source: 'report_cockpit',
                ctaStrategyKey: ctaStrategyKey || null,
                sourceFamily: sourceFamily || null,
              }}
            >
              {chatLabel || '进入结构追问'}
              <ArrowRight className="h-4 w-4" />
            </ResultCtaLink>
            <ResultCtaLink
              href={eventsHref}
              page={`/result/${reportId}`}
              target="result_cockpit_events"
              className="action-secondary justify-between"
              meta={{
                reportId,
                source: 'report_cockpit',
                ctaStrategyKey: ctaStrategyKey || null,
                sourceFamily: sourceFamily || null,
              }}
            >
              {eventsLabel || '记录关键事件'}
              <ArrowRight className="h-4 w-4" />
            </ResultCtaLink>
          </div>
        </div>

        {guidedPaths.length > 0 ? (
          <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/74 p-4">
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-[color:var(--accent-strong)]" />
              <div className="font-semibold text-[color:var(--ink)]">阶段辅助线</div>
            </div>
            <div className="mt-4 grid gap-3">
              {guidedPaths.map((item) => (
                <Link key={item.href} href={item.href} className="interactive-card rounded-[1rem] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <ArrowRight className="h-4 w-4 text-[color:var(--accent-strong)]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
