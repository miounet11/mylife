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
  if (tone === 'push') return 'border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.06)] text-[color:var(--data-up)]';
  if (tone === 'caution') return 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]';
  return 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-2)]';
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
      <div className="rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-4 py-4 md:px-5 md:py-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            驾驶舱判断
          </div>
          {section.stageLabel ? (
            <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] px-2 text-[10px] font-bold text-[color:var(--brand-strong)]">
              {section.stageLabel}
            </span>
          ) : null}
          {section.confidenceLabel ? (
            <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2 font-mono text-[10px] font-bold text-[color:var(--ink-4)]">
              {section.confidenceLabel}
            </span>
          ) : null}
        </div>

        {section.judgment ? (
          <div className="mt-3 text-base font-bold leading-7 text-[color:var(--ink-1)] md:text-lg">
            {section.judgment}
          </div>
        ) : null}

        {section.identityLabel || section.focusChips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {section.identityLabel ? (
              <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand)] bg-[color:var(--paper)] px-1.5 text-[10px] font-bold text-[color:var(--brand-strong)]">
                {section.identityLabel}
              </span>
            ) : null}
            {section.focusChips.map((item) => (
              <span
                key={item}
                className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-1.5 text-[10px] font-semibold text-[color:var(--ink-3)]"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {section.periodCards.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {section.periodCards.map((card) => (
              <div
                key={`${card.label}-${card.value}`}
                className={`rounded-[var(--radius)] border px-3 py-2.5 ${toneClasses(card.tone)}`}
              >
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {card.label}
                </div>
                <div className="mt-1 font-mono text-sm font-black tabular-nums">{card.value}</div>
                {card.note ? <div className="mt-1 text-[10px] leading-4 opacity-90">{card.note}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-4 py-4 md:px-5 md:py-5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            现在先做什么
          </div>
          <div className="mt-3 grid gap-2">
            <div className="rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-3 py-2.5">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                先做
              </div>
              <div className="mt-1.5 space-y-1.5 text-xs leading-5 text-[color:var(--ink-2)]">
                {topActions.map((item) => (
                  <div key={item}>· {item}</div>
                ))}
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2.5">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--alert)]">
                先别做
              </div>
              <div className="mt-1.5 space-y-1.5 text-xs leading-5 text-[color:var(--alert)]">
                {avoidances.map((item) => (
                  <div key={item}>· {item}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {sourceGuidance ? (
              <div className="rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--brand-strong)]">
                {sourceGuidance}
              </div>
            ) : null}
            {followupQuestion ? (
              <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs leading-5 text-[color:var(--ink-3)]">
                <span className="font-mono font-bold text-[color:var(--ink-5)]">PREFILL</span>
                <div className="mt-0.5">{followupQuestion}</div>
              </div>
            ) : null}
            <ResultCtaLink
              href={chatHref}
              page={`/result/${reportId}`}
              target="result_cockpit_chat"
              className="inline-flex h-9 items-center justify-between gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
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
              className="inline-flex h-9 items-center justify-between gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
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
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[color:var(--brand-strong)]" />
              <div className="text-sm font-bold text-[color:var(--ink-1)]">阶段辅助线</div>
            </div>
            <div className="mt-3 space-y-1.5">
              {guidedPaths.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 transition hover:border-[color:var(--brand)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-[color:var(--ink-2)]">{item.title}</div>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--ink-5)] transition group-hover:text-[color:var(--brand-strong)]" />
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
