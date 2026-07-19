'use client';

import type { MergedAgentResults } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  reportActionBoardCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';

function collectDomainActions(
  merged: MergedAgentResults,
  labels: Record<string, string>,
) {
  return Object.entries(merged.merged)
    .map(([key, value]) => {
      const actions = value && typeof value === 'object' && Array.isArray((value as { actions?: string[] }).actions)
        ? (value as { actions: string[] }).actions
        : [];
      return { key, label: labels[key] || key, actions };
    })
    .filter((item) => item.actions.length > 0);
}

export default function ReportActionBoard({
  merged,
  locale: localeProp,
}: {
  merged: MergedAgentResults;
  locale?: string | null;
}) {
  const { locale: ctxLocale } = useLocale();
  const copy = reportActionBoardCopy(resolveReportChromeLocale(localeProp ?? ctxLocale));
  const domainLabels: Record<string, string> = {
    core_constitution: copy.domainCore,
    career_wealth: copy.domainCareerWealth,
    relationship_family: copy.domainRelationship,
    health_lifestyle: copy.domainHealth,
    strategy_advisor: copy.domainStrategy,
    temporal_spatial_advisor: copy.domainTemporal,
  };
  const domains = collectDomainActions(merged, domainLabels);
  if (!domains.length) return null;

  return (
    <section id="action-board" className="fb-card scroll-mt-header p-4 md:p-6">
      <SectionHeader title={copy.agentTitle} description={copy.agentDescription} />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {domains.map((domain) => (
          <div
            key={domain.key}
            className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] p-3"
          >
            <h3 className="text-[12px] font-bold text-[color:var(--ink-4)]">{domain.label}</h3>
            <ul className="mt-2 space-y-1.5 text-[12px] text-[color:var(--ink-3)]">
              {domain.actions.slice(0, 3).map((action) => (
                <li key={action} className="rounded-[var(--radius-sm)] bg-[color:var(--bg-sunken)] px-2 py-1.5">
                  {action}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
