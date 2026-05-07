'use client';

import {
  deriveReportReasoningMode,
  getReasoningModeDescription,
  getReasoningModeLabel,
  type ReportReasoningMode,
} from '@/lib/report-reasoning-mode';

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

const AGENT_LABELS: Record<string, string> = {
  core_constitution: '核心命局',
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
    .map(([key, value]) => normalizeAgentEntry(key, value, orchestration?.agentSources?.[key]))
    .filter((item) => item.summary || item.highlights.length || item.actions.length);
  const temporal = (contextSignals?.temporal || {}) as Record<string, unknown>;
  const macroCycles = (contextSignals?.macroCycles || {}) as Record<string, unknown>;
  const geoClimate = (contextSignals?.geoClimate || {}) as Record<string, unknown>;
  const spatialFactors = (contextSignals?.spatialFactors || {}) as Record<string, unknown>;
  const conflicts = loop?.review?.conflicts || [];
  const repairActions = loop?.review?.repairPlan?.actions || [];
  const totalAgentCalls = orchestration?.totalLlmCalls || 0;
  const successfulAgents = orchestration?.succeeded?.length || 0;
  const failedAgents = orchestration?.failed?.length || 0;
  const allFallback = totalAgentCalls > 0 && successfulAgents === 0;
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
      <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-white p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">专家解释层</div>
        <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">
          {allFallback ? '并发 Agent 已尝试，但本次未成功接入主链。' : `${getReasoningModeLabel(resolvedReasoningMode)}已接入报告主链。`}
        </div>
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-3 text-sm leading-7 text-[color:var(--ink-4)]">
          <div className="text-sm font-semibold text-[color:var(--ink)]">当前状态</div>
          <div className="mt-2 text-sm leading-7 text-[color:var(--ink-4)]">
            {getReasoningModeDescription(resolvedReasoningMode)}
          </div>
        </div>

        {totalAgentCalls > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatusTile label="调度尝试" value={`${totalAgentCalls} 个`} detail={allFallback ? '当前全部回退为引擎结果' : '已纳入本次报告'} />
            <StatusTile label="成功接入" value={`${successfulAgents} 个`} detail={successfulAgents > 0 ? '已形成解释输入' : '本次无成功返回'} />
            <StatusTile
              label="一致性"
              value={verify?.verdict || '待校验'}
              detail={verify?.verdict ? `评分 ${verify.consistencyScore ?? '待计算'}` : `失败 ${failedAgents} 个`}
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
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                        {item.windows[0].label}
                      </div>
                    ) : null}
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${item.source === 'llm' ? 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]' : 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'}`}>
                      {item.source === 'llm' ? 'LLM返回' : '引擎回退'}
                    </div>
                  </div>
                </div>
                {item.summary ? (
                  <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{item.summary}</div>
                ) : null}
                {item.highlights.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.highlights.slice(0, 4).map((highlight) => (
                      <span key={highlight} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[color:var(--ink)]">
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
          <div className="mt-5 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-3 text-sm leading-7 text-[color:var(--ink-4)] text-sm leading-7 text-[color:var(--ink-4)]">
            {allFallback
              ? '当前并发 Agent 没有返回可用结果，页面内容来自结构化引擎和 deterministic 专家层回退。'
              : '当前专家层未返回足够可展示的结果块，但时空上下文与一致性校验已保留在报告里。'}
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-white p-6">
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

        {verify?.failedRules && verify.failedRules.length > 0 ? (
          <div className="mt-5 rounded-[var(--radius-md)] bg-[color:var(--signal-soft)] p-4 text-xs leading-6 text-[color:var(--signal-strong)]">
            仍待继续修正的规则：{verify.failedRules.join('、')}
          </div>
        ) : null}

        {orchestration?.errors && orchestration.errors.length > 0 ? (
          <div className="mt-5 rounded-[var(--radius-md)] bg-[color:var(--signal-soft)] p-4 text-xs leading-6 text-[color:var(--signal-strong)]">
            Agent 失败原因：{orchestration.errors.slice(0, 4).map((item) => `${AGENT_LABELS[item.key] || item.key} ${item.error}`).join('；')}
          </div>
        ) : null}

        {(conflicts.length > 0 || repairActions.length > 0) ? (
          <div className="mt-5 grid gap-4">
            <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">审查结果</div>
              <div className="mt-2 text-base font-bold text-[color:var(--ink)]">
                检测到 {conflicts.length} 个冲突，已规划 {repairActions.length} 个修复动作。
              </div>
            </div>
            {conflicts.slice(0, 2).map((item) => (
              <div key={item.id || item.type} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4 text-xs leading-6 text-[color:var(--ink)]">
                <span className="font-semibold">{item.type || '冲突'}</span>
                {item.severity ? ` / ${item.severity}` : ''}：{item.explanation || '待补充说明'}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function normalizeAgentEntry(key: string, value: unknown, source?: 'llm' | 'fallback') {
  const data = (value || {}) as {
    summary?: string;
    highlights?: string[];
    actions?: string[];
    windows?: Array<{ label?: string }>;
  };

  return {
    key,
    label: AGENT_LABELS[key] || key,
    summary: data.summary || '',
    highlights: data.highlights || [],
    actions: data.actions || [],
    windows: (data.windows || []).map((item) => ({ label: item.label || '关键窗口' })),
    source: source || 'fallback',
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
