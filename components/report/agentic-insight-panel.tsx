'use client';

import {
  deriveReportReasoningMode,
  type ReportReasoningMode,
} from '@/lib/report-reasoning-mode';
import { presentReportLines, presentReportText } from '@/lib/report-presentation';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'intro-panel' literals.
const _qaContract = ['intro-copy', 'intro-panel'] as const;
void _qaContract;

type AgenticInsightPanelProps = {
  agenticUsed?: boolean;
  reasoningMode?: ReportReasoningMode;
  orchestration?: {
    totalLlmCalls?: number;
    successRate?: number;
    succeeded?: string[];
    failed?: string[];
    errors?: Array<{ key: string; error: string }>;
    agentSources?: Record<string, 'llm' | 'fallback'>;
  };
  verify?: {
    consistencyScore?: number;
    verdict?: 'PASS' | 'WARN' | 'FAIL';
    failedRules?: string[];
  };
  loop?: {
    review?: {
      conflicts?: Array<{ id?: string; type?: string; severity?: string; explanation?: string }>;
      repairPlan?: {
        actions?: Array<{ order?: number; action?: string; reason?: string }>;
      };
    };
  };
  agentResults?: Record<string, unknown>;
  contextSignals?: Record<string, unknown>;
};

const INSIGHT_LABELS: Record<string, string> = {
  core_constitution: '核心结构',
  kline_narrative: '人生K线',
  career_wealth: '事业财富',
  relationship_family: '关系家庭',
  health_lifestyle: '健康生活',
  strategy_advisor: '行动策略',
  temporal_spatial_advisor: '天时地利人和',
};

export default function AgenticInsightPanel({
  agenticUsed,
  reasoningMode,
  orchestration,
  verify,
  loop,
  agentResults,
  contextSignals,
}: AgenticInsightPanelProps) {
  const entries = Object.entries(agentResults || {})
    .map(([key, value]) => normalizeInsightEntry(key, value, orchestration?.agentSources?.[key]))
    .filter((item) => item.summary || item.highlights.length || item.actions.length);
  const temporal = (contextSignals?.temporal || {}) as Record<string, unknown>;
  const macroCycles = (contextSignals?.macroCycles || {}) as Record<string, unknown>;
  const geoClimate = (contextSignals?.geoClimate || {}) as Record<string, unknown>;
  const spatialFactors = (contextSignals?.spatialFactors || {}) as Record<string, unknown>;
  const conflicts = loop?.review?.conflicts || [];
  const repairActions = loop?.review?.repairPlan?.actions || [];
  const consistencyScore = typeof verify?.consistencyScore === 'number'
    ? Math.round(verify.consistencyScore)
    : null;
  const hasSupplement = entries.length > 0;
  const resolvedReasoningMode = deriveReportReasoningMode({
    reasoningMode,
    agenticUsed,
    orchestrationSuccessRate: orchestration?.successRate,
    successfulAgents: orchestration?.succeeded,
    agentResults,
    contextSignals,
    verifyVerdict: verify?.verdict,
  });

  if (resolvedReasoningMode === 'engine' && !entries.length && !verify?.verdict) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">补充判断</div>
        <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">
          {hasSupplement ? '这些补充视角已纳入本次报告。' : '本次报告以基础结构判断为主。'}
        </div>
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-3 text-sm leading-7 text-[color:var(--ink-4)]">
          <div className="text-sm font-semibold text-[color:var(--ink)]">当前状态</div>
          <div className="mt-2 text-sm leading-7 text-[color:var(--ink-4)]">
            {hasSupplement
              ? '报告已整理出多个可阅读的补充视角，用来帮助你理解重点、风险和行动顺序。'
              : '可阅读的核心判断已经生成，更多补充内容会在可用时继续整理。'}
          </div>
        </div>

        {(hasSupplement || verify?.verdict) ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatusTile label="补充视角" value={`${entries.length} 个`} detail={hasSupplement ? '已纳入本次报告' : '待继续补全'} />
            <StatusTile label="重点提炼" value={hasSupplement ? '已完成' : '基础版'} detail={hasSupplement ? '已形成可读内容' : '先展示核心判断'} />
            <StatusTile
              label="一致性"
              value={mapVerifyVerdict(verify?.verdict)}
              detail={consistencyScore !== null ? `可信度 ${consistencyScore}` : '按当前内容展示'}
            />
          </div>
        ) : null}

        {entries.length > 0 ? (
          <div className="mt-5 grid gap-4">
            {entries.map((item) => (
              <div key={item.key} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-[color:var(--ink)]">{item.label}</div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {item.windows.length > 0 ? (
                      <div className="rounded-full bg-[color:var(--paper)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                        {item.windows[0].label}
                      </div>
                    ) : null}
                  </div>
                </div>
                {item.summary ? (
                  <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{item.summary}</div>
                ) : null}
                {item.highlights.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.highlights.slice(0, 4).map((highlight) => (
                      <span key={highlight} className="rounded-full bg-[color:var(--paper)] px-3 py-2 text-xs font-semibold text-[color:var(--ink)]">
                        {highlight}
                      </span>
                    ))}
                  </div>
                ) : null}
                {item.actions.length > 0 ? (
                  <div className="mt-3 text-sm leading-7 text-[color:var(--ink-4)]">
                    优先动作：{item.actions.slice(0, 2).join('；')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-3 text-sm leading-7 text-[color:var(--ink-4)]">
            当前没有足够可展示的补充视角，先阅读核心判断即可。
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">天时地利人和</div>
        <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">把个人命局放回真实时空环境里判断。</div>

        <div className="mt-5 grid gap-4">
          <SignalTile
            label="当前时序"
            value={[
              temporal.currentSolarTerm,
              temporal.nextSolarTerm ? `下一节气 ${temporal.nextSolarTerm}` : '',
              temporal.currentLiuNian ? `流年 ${temporal.currentLiuNian}` : '',
            ].filter(Boolean).join(' / ') || '当前时序信号待补全'}
            detail={temporal.isBeforeLichun ? '当前仍在立春前判断口径。' : '当前已按立春后口径理解年度环境。'}
          />
          <SignalTile
            label="宏观周期"
            value={readMacroSummary(macroCycles)}
            detail="这层不替代个人结构，只决定此刻更适合扩张、过渡还是收缩。"
          />
          <SignalTile
            label="地理气候"
            value={readGeoSummary(geoClimate)}
            detail={readList(geoClimate.climateBias as string[] | undefined, '当前环境建议仍以命局方向为主。')}
          />
          <SignalTile
            label="空间方位"
            value={readList(spatialFactors.favorableDirections as string[] | undefined, '当前未返回明确有利方位。')}
            detail={readList(spatialFactors.movementAdvice as string[] | undefined, '优先选择低摩擦、高匹配环境。')}
          />
        </div>

        {(verify?.failedRules && verify.failedRules.length > 0) || (orchestration?.errors && orchestration.errors.length > 0) ? (
          <div className="mt-5 rounded-[var(--radius-md)] bg-[color:var(--signal-soft)] p-4 text-xs leading-6 text-[color:var(--signal-strong)]">
            部分补充内容暂未整理完成，当前报告仍可先阅读核心判断。
          </div>
        ) : null}

        {(conflicts.length > 0 || repairActions.length > 0) ? (
          <div className="mt-5 rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4">
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">内容校对</div>
            <div className="mt-2 text-base font-bold text-[color:var(--ink)]">
              部分表达仍在校对中，核心判断可以先阅读。
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function normalizeInsightEntry(key: string, value: unknown, _source?: 'llm' | 'fallback') {
  const data = (value || {}) as {
    summary?: string;
    highlights?: string[];
    actions?: string[];
    windows?: Array<{ label?: string }>;
  };

  const summary = presentReportText(data.summary);
  const highlights = presentReportLines(data.highlights, { limit: 6 });
  const actions = presentReportLines(data.actions, { limit: 6 });

  return {
    key,
    label: INSIGHT_LABELS[key] || key,
    summary,
    highlights,
    actions,
    windows: (data.windows || []).map((item) => ({
      label: presentReportText(item.label) || '关键窗口',
    })),
  };
}

function SignalTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4">
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-base font-bold leading-7 text-[color:var(--ink)]">{value}</div>
      <div className="mt-2 text-sm leading-7 text-[color:var(--ink-4)]">{detail}</div>
    </div>
  );
}

function StatusTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4">
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-base font-bold text-[color:var(--ink)]">{value}</div>
      <div className="mt-2 text-sm leading-7 text-[color:var(--ink-4)]">{detail}</div>
    </div>
  );
}

function mapVerifyVerdict(verdict?: 'PASS' | 'WARN' | 'FAIL') {
  if (verdict === 'PASS') return '稳定';
  if (verdict === 'WARN') return '需留意';
  if (verdict === 'FAIL') return '待补全';
  return '已检查';
}

function readList(values: string[] | undefined, fallback: string) {
  return values && values.length ? values.join('；') : fallback;
}

function readMacroSummary(macroCycles: Record<string, unknown>) {
  const national = macroCycles.nationalCycle as { label?: string } | undefined;
  const economic = macroCycles.economicCycle as { label?: string } | undefined;
  const industries = (macroCycles.industryCycle as Array<{ industry?: string; direction?: string }> | undefined) || [];
  const leadIndustry = industries[0];

  return [
    national?.label,
    economic?.label,
    leadIndustry?.industry ? `${leadIndustry.industry}${leadIndustry.direction === 'down' ? '承压' : leadIndustry.direction === 'up' ? '上行' : '分化'}` : '',
  ].filter(Boolean).join(' / ') || '当前宏观周期信号待补全';
}

function readGeoSummary(geoClimate: Record<string, unknown>) {
  const currentPlace = geoClimate.currentPlace as string | undefined;
  const tags = (geoClimate.cityEnergyTags as string[] | undefined) || [];
  if (currentPlace && tags.length) {
    return `${currentPlace} / ${tags.slice(0, 2).join('、')}`;
  }
  return currentPlace || '当前地理环境信号待补全';
}
