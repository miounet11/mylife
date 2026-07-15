'use client';

import type { MergedAgentResults } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';

type ScenarioPanel = {
  title: string;
  summary?: string;
  focus?: string;
  actions?: string[];
};

function extractPanels(merged: MergedAgentResults): ScenarioPanel[] {
  const panels: ScenarioPanel[] = [];

  const career = merged.merged.career_wealth as {
    strategy?: {
      primaryTrack?: string;
      capitalDiscipline?: string;
      macroFit?: string;
    };
    careerFocus?: string;
    wealthFocus?: string;
    summary?: string;
    actions?: string[];
  } | undefined;
  if (career) {
    const focusParts = [
      career.careerFocus || career.strategy?.primaryTrack,
      career.wealthFocus || career.strategy?.capitalDiscipline,
      career.strategy?.macroFit,
    ].filter(Boolean);
    panels.push({
      title: '事业与财富',
      summary: career.summary || career.strategy?.macroFit,
      focus: focusParts.join(' · ') || undefined,
      actions: career.actions,
    });
  }

  const relationship = merged.merged.relationship_family as {
    relationshipFocus?: string;
    collaborationAdvice?: string;
    familyFocus?: string;
    summary?: string;
    actions?: string[];
  } | undefined;
  if (relationship) {
    panels.push({
      title: '关系与家庭',
      summary: relationship.summary || relationship.collaborationAdvice,
      focus: [relationship.relationshipFocus, relationship.familyFocus].filter(Boolean).join(' · ') || undefined,
      actions: relationship.actions,
    });
  }

  const health = merged.merged.health_lifestyle as {
    bodyFocus?: string;
    recoveryAdvice?: string;
    healthFocus?: string;
    summary?: string;
    actions?: string[];
  } | undefined;
  if (health) {
    panels.push({
      title: '健康与生活方式',
      summary: health.summary || health.recoveryAdvice,
      focus: health.healthFocus || health.bodyFocus,
      actions: health.actions,
    });
  }

  return panels;
}

export default function ReportScenarioPanels({ merged }: { merged: MergedAgentResults }) {
  const panels = extractPanels(merged);
  if (!panels.length) return null;

  return (
    <section id="scenarios" className="fb-card scroll-mt-header p-4 md:p-6">
      <SectionHeader title="分域判断" description="按事业、关系、健康等主题展开结构判断。" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {panels.map((panel) => (
          <div
            key={panel.title}
            className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3"
          >
            <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">{panel.title}</h3>
            {panel.focus ? (
              <p className="mt-1 text-[12px] font-semibold text-[color:var(--brand)]">{panel.focus}</p>
            ) : null}
            {panel.summary ? (
              <p className="mt-2 text-[12px] leading-[1.5] text-[color:var(--ink-3)]">{panel.summary}</p>
            ) : null}
            {panel.actions?.length ? (
              <ul className="mt-2 space-y-1 text-[11px] text-[color:var(--ink-3)]">
                {panel.actions.slice(0, 2).map((action) => (
                  <li key={action}>· {action}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}