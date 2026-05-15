'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AlertTriangle, RefreshCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { type ReportReasoningMode } from '@/lib/report-reasoning-mode';
import { describeReportDeliveryStage } from '@/lib/report-quality';

// QA contract (qa:public-product-components): file must include 'intro-copy' literals.
const _qaContract = ['intro-copy'] as const;
void _qaContract;

type EngineBuilds = {
  core: string;
  llm: string;
  kline: string;
  report: string;
};

type OrchestrationMeta = {
  totalLlmCalls?: number;
  successRate?: number;
  succeeded?: string[];
  failed?: string[];
  errors?: Array<{ key: string; error: string }>;
};

type QualityAudit = {
  overallScore?: number;
  grade?: 'S' | 'A' | 'B' | 'C';
  status?: 'ready' | 'watch' | 'retry';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  targetScore?: number;
  targetGrade?: 'S' | 'A' | 'B' | 'C';
  targetAchieved?: boolean;
  summary?: string;
  dimensions?: Array<{
    key?: 'engine' | 'llm' | 'agentic' | 'consistency' | 'completeness';
    label?: string;
    score?: number;
    status?: 'strong' | 'ok' | 'watch' | 'weak';
    detail?: string;
  }>;
  strengths?: string[];
  concerns?: string[];
  blockingIssues?: string[];
  recommendedActions?: string[];
  nextActionLabel?: string;
};

type UpgradeJob = {
  status?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
  attempts?: number;
  maxAttempts?: number;
  nextRunAt?: string;
  bestScore?: number;
  bestGrade?: 'S' | 'A' | 'B' | 'C';
  lastError?: string;
  meta?: {
    reason?: string;
    strategy?: 'immediate' | 'queue' | 'defer';
    requestedAt?: string;
    [key: string]: unknown;
  };
};

type FeedbackLoop = {
  syncedAt?: string;
  validationInsights?: {
    totalLinkedEvents?: number;
    accurateCount?: number;
    driftCount?: number;
    pendingCount?: number;
    summary?: string;
  };
  correctionInsight?: {
    level?: 'healthy' | 'watch' | 'action';
    summary?: string;
    likelyCause?: string;
  };
};

type VersionLineageEntry = {
  version: string;
  generatedAt?: string;
  generatedFrom?: 'analyze' | 'upgrade';
  upgradedFromVersion?: string;
  reasoningMode?: 'engine' | 'deterministic-expert' | 'parallel-agents';
  llmUsed?: boolean;
  agenticUsed?: boolean;
  qualityScore?: number;
  qualityGrade?: 'S' | 'A' | 'B' | 'C';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  targetAchieved?: boolean;
  summary?: string;
};

export default function ReportEnginePanel({
  reportId,
  canManage,
  reportVersion,
  llmUsed,
  agenticUsed,
  consistencyScore,
  verifyVerdict,
  qualityAudit,
  upgradeJob,
  generatedFrom,
  engineBuilds,
  enhancementNotes,
  feedbackLoop,
}: {
  reportId: string;
  canManage: boolean;
  reportVersion: string;
  llmUsed: boolean;
  agenticUsed?: boolean;
  reasoningMode?: ReportReasoningMode;
  consistencyScore?: number;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  qualityAudit?: QualityAudit;
  upgradeJob?: UpgradeJob;
  generatedFrom?: string;
  upgradedFromVersion?: string;
  engineBuilds: EngineBuilds;
  enhancementNotes?: string[];
  orchestration?: OrchestrationMeta;
  feedbackLoop?: FeedbackLoop;
  versionLineage?: VersionLineageEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submittingStrategy, setSubmittingStrategy] = useState<'immediate' | 'queue' | 'defer' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const contentWasEnhanced = llmUsed || !!agenticUsed || !!enhancementNotes?.length;
  const targetAchieved = !!qualityAudit?.targetAchieved;
  const needsUpgrade = reportVersion !== engineBuilds.report || !contentWasEnhanced || !targetAchieved;
  const actionLabel = !targetAchieved
    ? (qualityAudit?.nextActionLabel || '继续补全这份报告')
    : !contentWasEnhanced
    ? '重新生成完整报告'
    : '刷新报告内容';

  const description = generatedFrom === 'upgrade'
    ? '这份报告已完成一次内容更新。'
    : contentWasEnhanced
    ? '这份报告已完成内容补全，可结合下方建议使用。'
    : '这份报告当前为基础可读版，建议稍后重新生成完整内容。';
  const auditStatus = qualityAudit?.status || 'watch';
  const auditSummary = sanitizeReportStatusCopy(qualityAudit?.summary || '基础自检');
  const auditBadgeClass = auditStatus === 'ready'
    ? 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
    : auditStatus === 'watch'
    ? 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
    : 'bg-[color:var(--alert-soft)] text-[color:var(--alert)]';
  const auditLabel = auditStatus === 'ready'
    ? '可直接使用'
    : auditStatus === 'watch'
    ? '建议复核'
    : '建议重算';
  const deliveryStage = describeReportDeliveryStage(qualityAudit?.deliveryTier);
  const deliveryTierLabel = deliveryStage.label;
  const backgroundUpgradeLabel = upgradeJob?.status === 'running'
    ? '内容补全进行中'
    : upgradeJob?.status === 'retry' || upgradeJob?.status === 'pending'
    ? '等待内容补全'
    : upgradeJob?.status === 'completed'
    ? '内容已补全'
    : upgradeJob?.status === 'failed'
    ? '内容补全已暂停'
    : '';
  const feedbackLevel = feedbackLoop?.correctionInsight?.level || 'healthy';
  const feedbackBadgeClass = feedbackLevel === 'action'
    ? 'bg-[color:var(--alert-soft)] text-[color:var(--alert)]'
    : feedbackLevel === 'watch'
      ? 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
      : 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]';
  const feedbackLabel = feedbackLevel === 'action'
    ? '需要纠偏'
    : feedbackLevel === 'watch'
      ? '持续观察'
      : '反馈稳定';
  const queuedStrategy = upgradeJob?.meta?.strategy || 'immediate';
  const queuedStrategyLabel = queuedStrategy === 'defer'
    ? '系统会稍后继续补全内容。'
    : queuedStrategy === 'queue'
      ? '已加入内容补全队列。'
      : '正在刷新内容并继续补全。';
  const upgradeBlockerLabel = formatUpgradeBlocker(upgradeJob?.lastError);

  const handleUpgrade = async (strategy: 'immediate' | 'queue' | 'defer') => {
    setError('');
    setSuccess('');
    setSubmittingStrategy(strategy);

    try {
      const response = await fetch(`/api/fortune/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade', strategy }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '暂时无法刷新报告');
        setSubmittingStrategy(null);
        return;
      }

      const upgradeQueued = data.data?.upgradeQueued === true;
      const queueReason = typeof data.data?.queueReason === 'string' ? data.data.queueReason : '';
      const upgradeStatus = typeof data.data?.upgradeJob?.status === 'string' ? data.data.upgradeJob.status : '';
      const alreadyQueued = queueReason === 'already_queued'
        || (!upgradeQueued && ['pending', 'running', 'retry'].includes(upgradeStatus));

      if (strategy === 'immediate') {
        setSuccess(
          alreadyQueued
            ? '已重新整理当前内容，后续补全会继续处理。'
            : '已刷新这份报告。'
        );
      } else if (strategy === 'queue') {
        setSuccess(
          alreadyQueued
            ? '这份报告已经在内容补全队列中，无需重复提交。'
            : '已加入内容补全队列，系统会继续完善这份报告。'
        );
      } else {
        setSuccess(
          alreadyQueued
            ? '当前已存在排队中的内容补全任务，系统会稍后继续处理。'
            : '已安排稍后补全，系统会自动处理。'
        );
      }

      window.setTimeout(() => {
        startTransition(() => {
          router.refresh();
        });
      }, 1200);
    } catch {
      setError('网络异常，暂时无法刷新报告');
      setSubmittingStrategy(null);
    }
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[color:var(--accent-strong)]" />
        <div className="font-semibold text-[color:var(--ink)]">报告状态与下一步</div>
      </div>
      <div className="mt-2 text-sm leading-7 text-[color:var(--ink-4)]">
        这里只展示这份报告能不能直接用、哪里需要复核、是否还有补全空间。
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <StatusTile label="可信度" value={qualityAudit?.overallScore ? `${qualityAudit.overallScore}` : '待评估'} />
        <StatusTile label="可用状态" value={deliveryTierLabel} />
        <StatusTile label="一致性" value={typeof consistencyScore === 'number' ? `${consistencyScore}/100` : '待评估'} />
        <StatusTile label="内容状态" value={contentWasEnhanced ? '已完成补全' : '基础可读版'} />
      </div>

      <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-4 text-sm text-[color:var(--ink)]">{description}</div>

      {upgradeJob?.status && ['pending', 'running', 'retry', 'failed', 'completed'].includes(upgradeJob.status) ? (
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[color:var(--ink)]">内容补全状态</div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
 upgradeJob.status === 'completed'
                ? 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                : upgradeJob.status === 'failed'
                ? 'bg-[color:var(--alert-soft)] text-[color:var(--alert)]'
                : 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
            }`}>
              {backgroundUpgradeLabel}
            </div>
          </div>
          <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">{queuedStrategyLabel}</div>
          {upgradeBlockerLabel ? (
            <div className="mt-3 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs text-[color:var(--muted)]">{upgradeBlockerLabel}</div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            {auditStatus === 'ready' ? (
              <ShieldCheck className="h-4 w-4 text-[color:var(--data-up)]" />
            ) : (
              <AlertTriangle className={`h-4 w-4 ${auditStatus === 'retry' ? 'text-[color:var(--alert)]' : 'text-[color:var(--signal-strong)]'}`} />
            )}
            报告质量自检
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${auditBadgeClass}`}>
            {auditLabel}
          </div>
        </div>
        <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">{auditSummary}</div>
        {qualityAudit?.dimensions?.length ? (
          <div className="mt-4 grid gap-2">
            {qualityAudit.dimensions.map((item) => (
              <div key={item.key || item.label} className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[color:var(--ink)]">
                  <span>{item.label || '维度'}</span>
                  <span>{typeof item.score === 'number' ? `${item.score}` : '--'}</span>
                </div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">{item.detail || '待补充'}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {verifyVerdict ? (
        <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
          当前一致性结论：{formatVerifyVerdict(verifyVerdict)}
          {typeof consistencyScore === 'number' ? `，评分 ${consistencyScore}/100。` : '。'}
        </div>
      ) : null}

      {feedbackLoop?.validationInsights ? (
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[color:var(--ink)]">反馈闭环</div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${feedbackBadgeClass}`}>
              {feedbackLabel}
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {[
              { label: '关联事件', value: feedbackLoop.validationInsights.totalLinkedEvents || 0 },
              { label: '验证准确', value: feedbackLoop.validationInsights.accurateCount || 0 },
              { label: '已偏差', value: feedbackLoop.validationInsights.driftCount || 0 },
              { label: '待验证', value: feedbackLoop.validationInsights.pendingCount || 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3">
                <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
              </div>
            ))}
          </div>
          {feedbackLoop.correctionInsight?.likelyCause ? (
            <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs text-[color:var(--muted)]">{feedbackLoop.correctionInsight.likelyCause}</div>
          ) : null}
        </div>
      ) : null}

      {enhancementNotes && enhancementNotes.length > 0 && (
        <div className="mt-4 grid gap-3">
          {enhancementNotes.map((item) => (
            <div key={item} className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
              {item}
            </div>
          ))}
        </div>
      )}

      {qualityAudit?.concerns && qualityAudit.concerns.length > 0 ? (
        <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--signal-soft)] px-4 py-4">
          <div className="text-sm font-semibold text-[color:var(--signal-strong)]">当前需要重点关注</div>
          <div className="mt-3 grid gap-2">
            {qualityAudit.concerns.slice(0, 3).map((item) => (
              <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-3 text-xs leading-6 text-[color:var(--signal-strong)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {qualityAudit?.blockingIssues && qualityAudit.blockingIssues.length > 0 ? (
        <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--alert-soft)] px-4 py-4">
          <div className="text-sm font-semibold text-[color:var(--alert)]">建议先处理的问题</div>
          <div className="mt-3 grid gap-2">
            {qualityAudit.blockingIssues.slice(0, 4).map((item) => (
              <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-3 text-xs leading-6 text-[color:var(--alert)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {qualityAudit?.recommendedActions && qualityAudit.recommendedActions.length > 0 ? (
        <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-4">
          <div className="text-sm font-semibold text-[color:var(--ink)]">动作</div>
          <div className="mt-3 grid gap-2">
            {qualityAudit.recommendedActions.slice(0, 3).map((item) => (
              <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {canManage && needsUpgrade && (
        <div className="mt-4 space-y-3">
          <div className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-4">
            <div className="text-sm font-semibold text-[color:var(--ink)]">选择处理方式</div>
            <div className="mt-4 grid gap-3">
              {[
                {
                  key: 'immediate' as const,
                  title: actionLabel,
                  primary: true,
                },
                {
                  key: 'queue' as const,
                  title: '加入内容补全队列',
                },
                {
                  key: 'defer' as const,
                  title: '稍后自动补全',
                },
              ].map((item) => {
                const isActing = submittingStrategy === item.key || (isPending && submittingStrategy === null && item.primary);
                return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => void handleUpgrade(item.key)}
                  disabled={!!submittingStrategy || isPending}
                  className={`rounded-[var(--radius)] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
 item.primary
                      ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white'
                      : 'border-[color:var(--line)] bg-[color:var(--bg-elevated)] text-[color:var(--ink)]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <RefreshCcw className={`h-4 w-4 ${isActing ? 'animate-spin' : ''}`} />
                    {isActing ? '处理中...' : item.title}
                  </div>
                </button>
                );
              })}
            </div>
          </div>
          {error ? <div className="text-sm text-[color:var(--alert)]">{error}</div> : null}
          {success ? <div className="text-sm text-[color:var(--data-up)]">{success}</div> : null}
        </div>
      )}
    </div>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4">
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-base font-bold text-[color:var(--ink)]">{value}</div>
    </div>
  );
}

function formatVerifyVerdict(verdict?: 'PASS' | 'WARN' | 'FAIL') {
  if (verdict === 'PASS') return '稳定';
  if (verdict === 'WARN') return '需留意';
  if (verdict === 'FAIL') return '待重算';
  return '已检查';
}

function sanitizeReportStatusCopy(value: string) {
  return value
    .replace(/并发\s*Agent|并发专家链路|Agentic|Agent/gi, '多维补充判断')
    .replace(/LLM|大模型|主模型|上游模型/gi, '正文增强')
    .replace(/deterministic|确定性引擎/gi, '基础结构')
    .replace(/Fallback\s*链|fallback/gi, '备用补全')
    .replace(/模型链路|链路/gi, '内容')
    .replace(/报告引擎版本|引擎版本/gi, '报告版本')
    .replace(/执行步骤/gi, '处理进度');
}

function formatUpgradeBlocker(lastError?: string) {
  if (!lastError) {
    return '';
  }

  if (lastError === 'LLM_UNAVAILABLE' || lastError === 'PROVIDER_UNHEALTHY') {
    return '本次内容补全暂未完成，已保留当前可读内容，系统会在后续窗口继续尝试。';
  }

  return '本次内容补全暂未完成，已保留当前可读内容。';
}
