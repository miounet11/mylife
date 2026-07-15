'use client';

import type { MergedAgentResults } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';

const DOMAIN_LABELS: Record<string, string> = {
  core_constitution: '核心体质',
  career_wealth: '事业财富',
  relationship_family: '关系家庭',
  health_lifestyle: '健康生活',
  strategy_advisor: '策略建议',
  temporal_spatial_advisor: '时空环境',
};

function collectDomainActions(merged: MergedAgentResults) {
  return Object.entries(merged.merged)
    .map(([key, value]) => {
      const actions = value && typeof value === 'object' && Array.isArray((value as { actions?: string[] }).actions)
        ? (value as { actions: string[] }).actions
        : [];
      return { key, label: DOMAIN_LABELS[key] || key, actions };
    })
    .filter((item) => item.actions.length > 0);
}

export default function ReportActionBoard({ merged }: { merged: MergedAgentResults }) {
  const domains = collectDomainActions(merged);
  if (!domains.length) return null;

  return (
    <section id="action-board" className="fb-card scroll-mt-header p-4 md:p-6">
      <SectionHeader title="分域动作板" description="各 Agent 模块提炼的可执行建议。" />
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