'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AlertTriangle, RefreshCcw, ShieldCheck, Sparkles } from 'lucide-react';
import {
  deriveReportReasoningMode,
  getReasoningModeDescription,
  getReasoningModeLabel,
  type ReportReasoningMode,
} from '@/lib/report-reasoning-mode';

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
  reasoningMode,
  consistencyScore,
  verifyVerdict,
  qualityAudit,
  upgradeJob,
  generatedFrom,
  upgradedFromVersion,
  engineBuilds,
  enhancementNotes,
  orchestration,
  feedbackLoop,
  versionLineage,
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
  const resolvedReasoningMode = deriveReportReasoningMode({
    reasoningMode,
    agenticUsed,
    verifyVerdict,
    enhancementNotes,
  });
  const totalAgentCalls = orchestration?.totalLlmCalls || 0;
  const successfulAgents = orchestration?.succeeded?.length || 0;
  const failedAgents = orchestration?.failed?.length || 0;
  const upstreamUnavailable = totalAgentCalls > 0 && successfulAgents === 0 && !llmUsed;
  const targetAchieved = !!qualityAudit?.targetAchieved;
  const needsUpgrade = reportVersion !== engineBuilds.report || upstreamUnavailable || !targetAchieved;
  const actionLabel = reportVersion !== engineBuilds.report
    ? `升级到 ${engineBuilds.report}`
    : !targetAchieved
    ? (qualityAudit?.nextActionLabel || '继续增强到 S级')
    : upstreamUnavailable || !llmUsed
    ? '重新尝试深度增强'
    : `升级到 ${engineBuilds.report}`;

  const description = generatedFrom === 'upgrade'
    ? `这份报告已经通过当前版本重算${upgradedFromVersion ? `，原始版本为 ${upgradedFromVersion}` : ''}。`
    : upstreamUnavailable
    ? '本次已尝试 LLM 与并发 Agent 增强，但上游模型接口未在时限内返回，当前主报告为结构化引擎加 deterministic 专家层输出。待模型供应商恢复后，可再次重算增强。'
    : getReasoningModeDescription(resolvedReasoningMode);
  const auditStatus = qualityAudit?.status || 'watch';
  const auditSummary = qualityAudit?.summary || '当前版本已完成基础自检，但还缺少更细的质量说明。';
  const auditBadgeClass = auditStatus === 'ready'
    ? 'bg-emerald-50 text-emerald-700'
    : auditStatus === 'watch'
    ? 'bg-amber-50 text-amber-800'
    : 'bg-rose-50 text-rose-700';
  const auditLabel = auditStatus === 'ready'
    ? '可直接使用'
    : auditStatus === 'watch'
    ? '建议复核'
    : '建议重算';
  const deliveryTierLabel = qualityAudit?.deliveryTier === 'expert'
    ? 'S级专家版'
    : qualityAudit?.deliveryTier === 'enhanced'
    ? '增强版'
    : '基础版';
  const backgroundUpgradeLabel = upgradeJob?.status === 'running'
    ? '后台增强进行中'
    : upgradeJob?.status === 'retry' || upgradeJob?.status === 'pending'
    ? '后台排队增强中'
    : upgradeJob?.status === 'completed'
    ? '后台增强已完成'
    : upgradeJob?.status === 'failed'
    ? '后台增强已暂停'
    : '';
  const feedbackLevel = feedbackLoop?.correctionInsight?.level || 'healthy';
  const feedbackBadgeClass = feedbackLevel === 'action'
    ? 'bg-rose-50 text-rose-700'
    : feedbackLevel === 'watch'
      ? 'bg-amber-50 text-amber-800'
      : 'bg-emerald-50 text-emerald-700';
  const feedbackLabel = feedbackLevel === 'action'
    ? '需要纠偏'
    : feedbackLevel === 'watch'
      ? '持续观察'
      : '反馈稳定';
  const queuedStrategy = upgradeJob?.meta?.strategy || 'immediate';
  const queuedStrategyLabel = queuedStrategy === 'defer'
    ? '等待模型恢复后增强'
    : queuedStrategy === 'queue'
      ? '仅排队后台增强'
      : '立即重算后继续增强';
  const lineage = Array.isArray(versionLineage) ? versionLineage : [];
  const latestVersion = lineage[0];
  const previousVersion = lineage[1];
  const qualityDelta = typeof latestVersion?.qualityScore === 'number' && typeof previousVersion?.qualityScore === 'number'
    ? latestVersion.qualityScore - previousVersion.qualityScore
    : null;

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
        setError(data.error || '升级重算失败');
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
            ? '已执行当前版本重算，后台增强任务已经在队列中继续处理。'
            : `已重算到 ${data.data?.reportVersion || engineBuilds.report}`
        );
      } else if (strategy === 'queue') {
        setSuccess(
          alreadyQueued
            ? '这份报告已经在后台增强队列中，无需重复提交。'
            : '已加入后台增强队列，系统会继续提升这份报告。'
        );
      } else {
        setSuccess(
          alreadyQueued
            ? '当前已存在排队中的增强任务，已更新为等待模型恢复后再尝试。'
            : '已设置为等待模型恢复后增强，系统会稍后自动尝试。'
        );
      }

      window.setTimeout(() => {
        startTransition(() => {
          router.refresh();
        });
      }, 1200);
    } catch {
      setError('网络异常，升级重算失败');
      setSubmittingStrategy(null);
    }
  };

  return (
    <div className="soft-card rounded-[1.75rem] p-5">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[color:var(--accent-strong)]" />
        <div className="font-semibold text-[color:var(--ink)]">报告引擎版本</div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <VersionTile label="质量审计" value={qualityAudit?.overallScore ? `${qualityAudit.overallScore} / ${qualityAudit.grade || 'B'}` : '待生成'} />
        <VersionTile label="交付等级" value={deliveryTierLabel} />
        <VersionTile label="报告版本" value={reportVersion} />
        <VersionTile label="推理层" value={getReasoningModeLabel(resolvedReasoningMode)} />
        <VersionTile label="文本增强" value={llmUsed ? 'LLM 深度增强' : '结构化整合输出'} />
        <VersionTile label="Agent执行" value={totalAgentCalls > 0 ? `${successfulAgents}/${totalAgentCalls} 成功` : '未触发'} />
        <VersionTile label="一致性评分" value={typeof consistencyScore === 'number' ? `${consistencyScore}` : '待生成'} />
        <VersionTile label="人生 K 线" value={engineBuilds.kline} />
        <VersionTile label="命理引擎" value={engineBuilds.core} />
      </div>

      <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
        {description}
      </div>

      {upgradeJob?.status && ['pending', 'running', 'retry', 'failed', 'completed'].includes(upgradeJob.status) ? (
        <div className="mt-4 rounded-[1.4rem] border border-[color:var(--line)] bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[color:var(--ink)]">后台专家增强任务</div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
              upgradeJob.status === 'completed'
                ? 'bg-emerald-50 text-emerald-700'
                : upgradeJob.status === 'failed'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-800'
            }`}>
              {backgroundUpgradeLabel}
            </div>
          </div>
          <div className="mt-3 text-sm leading-7 text-[color:var(--ink)]">
            {upgradeJob.status === 'completed'
              ? `系统已经完成后台增强，历史最高分 ${upgradeJob.bestScore || qualityAudit?.overallScore || '--'}。`
              : upgradeJob.status === 'failed'
              ? `后台增强已达到当前重试上限，历史最高分 ${upgradeJob.bestScore || qualityAudit?.overallScore || '--'}。`
              : `系统会继续尝试把当前版本从 ${deliveryTierLabel} 提升到 S级专家版。`}
          </div>
          <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
            {`已尝试 ${upgradeJob.attempts || 0} / ${upgradeJob.maxAttempts || 0} 次`}
            {upgradeJob.nextRunAt ? `，下一次计划时间 ${upgradeJob.nextRunAt}` : ''}
          </div>
          <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
            当前策略：{queuedStrategyLabel}
          </div>
          {upgradeJob.lastError ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
              最近一次阻塞原因：{upgradeJob.lastError}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 rounded-[1.4rem] border border-[color:var(--line)] bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            {auditStatus === 'ready' ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className={`h-4 w-4 ${auditStatus === 'retry' ? 'text-rose-600' : 'text-amber-600'}`} />
            )}
            报告质量自检
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${auditBadgeClass}`}>
            {auditLabel}
          </div>
        </div>
        <div className="mt-3 text-sm leading-7 text-[color:var(--ink)]">{auditSummary}</div>
        <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
          {targetAchieved
            ? '当前版本已经越过 95 分的 S级专家门槛。'
            : `当前版本还未越过 ${qualityAudit?.targetScore || 95} 分的 S级目标，暂不应视为最终专家版。`}
        </div>
        {qualityAudit?.dimensions?.length ? (
          <div className="mt-4 grid gap-2">
            {qualityAudit.dimensions.map((item) => (
              <div key={item.key || item.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[color:var(--ink)]">
                  <span>{item.label || '维度'}</span>
                  <span>{typeof item.score === 'number' ? `${item.score}` : '--'}</span>
                </div>
                <div className="mt-1 text-xs leading-6 text-[color:var(--muted)]">{item.detail || '待补充'}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {verifyVerdict ? (
        <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-[color:var(--ink)]">
          当前一致性结论：{verifyVerdict}
          {typeof consistencyScore === 'number' ? `，评分 ${consistencyScore}/100。` : '。'}
        </div>
      ) : null}

      {feedbackLoop?.validationInsights ? (
        <div className="mt-4 rounded-[1.4rem] border border-[color:var(--line)] bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[color:var(--ink)]">反馈闭环</div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${feedbackBadgeClass}`}>
              {feedbackLabel}
            </div>
          </div>
          <div className="mt-3 text-sm leading-7 text-[color:var(--ink)]">
            {feedbackLoop.validationInsights.summary || '当前还没有足够的反馈样本。'}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {[
              { label: '关联事件', value: feedbackLoop.validationInsights.totalLinkedEvents || 0 },
              { label: '验证准确', value: feedbackLoop.validationInsights.accurateCount || 0 },
              { label: '已偏差', value: feedbackLoop.validationInsights.driftCount || 0 },
              { label: '待验证', value: feedbackLoop.validationInsights.pendingCount || 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
              </div>
            ))}
          </div>
          {feedbackLoop.correctionInsight?.summary ? (
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-[color:var(--ink)]">
              {feedbackLoop.correctionInsight.summary}
              {feedbackLoop.correctionInsight.likelyCause ? ` ${feedbackLoop.correctionInsight.likelyCause}` : ''}
            </div>
          ) : null}
        </div>
      ) : null}

      {lineage.length > 0 ? (
        <div className="mt-4 rounded-[1.4rem] border border-[color:var(--line)] bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[color:var(--ink)]">版本演进记录</div>
            <div className="text-xs text-[color:var(--muted)]">{`已记录 ${lineage.length} 次生成`}</div>
          </div>
          {latestVersion ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-[color:var(--ink)]">
              {latestVersion.generatedFrom === 'upgrade'
                ? `当前版本 ${latestVersion.version} 来自升级重算${latestVersion.upgradedFromVersion ? `，上一版为 ${latestVersion.upgradedFromVersion}` : ''}。`
                : `当前版本 ${latestVersion.version} 来自首次测算生成。`}
              {qualityDelta !== null
                ? qualityDelta >= 0
                  ? ` 相比上一版，质量分提升 ${qualityDelta} 分。`
                  : ` 相比上一版，质量分下降 ${Math.abs(qualityDelta)} 分。`
                : ''}
            </div>
          ) : null}
          <div className="mt-4 grid gap-3">
            {lineage.slice(0, 4).map((item, index) => (
              <div key={`${item.version}-${item.generatedAt || index}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">
                    {`${item.version} · ${item.deliveryTier === 'expert' ? 'S级专家版' : item.deliveryTier === 'enhanced' ? '增强版' : '基础版'}`}
                  </div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {item.generatedAt ? formatVersionTime(item.generatedAt) : '时间待补充'}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-[color:var(--ink)]">
                    {item.generatedFrom === 'upgrade' ? '升级生成' : '首次生成'}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-[color:var(--ink)]">
                    {`质量 ${item.qualityScore || '--'} / ${item.qualityGrade || 'B'}`}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-[color:var(--ink)]">
                    {item.reasoningMode === 'parallel-agents'
                      ? '并发专家协同'
                      : item.reasoningMode === 'deterministic-expert'
                        ? '确定性专家层'
                        : '结构引擎'}
                  </span>
                </div>
                {item.summary ? (
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.summary}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {upstreamUnavailable && orchestration?.errors && orchestration.errors.length > 0 ? (
        <div className="mt-4 rounded-[1.4rem] bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900">
          当前 Agent 失败摘要：{orchestration.errors.slice(0, 3).map((item) => `${item.key} ${item.error}`).join('；')}
          {failedAgents > 3 ? `；另有 ${failedAgents - 3} 个模块失败` : ''}
        </div>
      ) : null}

      {enhancementNotes && enhancementNotes.length > 0 && (
        <div className="mt-4 grid gap-3">
          {enhancementNotes.map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-[color:var(--ink)]">
              {item}
            </div>
          ))}
        </div>
      )}

      {qualityAudit?.concerns && qualityAudit.concerns.length > 0 ? (
        <div className="mt-4 rounded-[1.4rem] bg-amber-50 px-4 py-4">
          <div className="text-sm font-semibold text-amber-900">当前需要重点关注</div>
          <div className="mt-3 grid gap-2">
            {qualityAudit.concerns.slice(0, 3).map((item) => (
              <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-7 text-amber-900">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {qualityAudit?.blockingIssues && qualityAudit.blockingIssues.length > 0 ? (
        <div className="mt-4 rounded-[1.4rem] bg-rose-50 px-4 py-4">
          <div className="text-sm font-semibold text-rose-900">阻塞 S级交付的关键问题</div>
          <div className="mt-3 grid gap-2">
            {qualityAudit.blockingIssues.slice(0, 4).map((item) => (
              <div key={item} className="rounded-2xl bg-white/85 px-4 py-3 text-sm leading-7 text-rose-900">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {qualityAudit?.recommendedActions && qualityAudit.recommendedActions.length > 0 ? (
        <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4">
          <div className="text-sm font-semibold text-[color:var(--ink)]">建议动作</div>
          <div className="mt-3 grid gap-2">
            {qualityAudit.recommendedActions.slice(0, 3).map((item) => (
              <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {canManage && needsUpgrade && (
        <div className="mt-4 space-y-3">
          <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white px-4 py-4">
            <div className="text-sm font-semibold text-[color:var(--ink)]">选择升级方式</div>
            <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
              如果你现在就想刷新这份报告，用立即重算。若当前模型不稳定，可以先排队，或等待模型恢复后再增强。
            </div>
            <div className="mt-4 grid gap-3">
              {[
                {
                  key: 'immediate' as const,
                  title: actionLabel,
                  description: '立刻重算当前报告，并在结果不足时继续挂入后台增强队列。',
                  primary: true,
                },
                {
                  key: 'queue' as const,
                  title: '仅排队后台增强',
                  description: '保留当前可读版结果，让系统在后台继续提升质量，不打断你现在阅读。',
                },
                {
                  key: 'defer' as const,
                  title: '等待模型恢复后增强',
                  description: '如果当前供应商不稳定，先延后 30 分钟再尝试，避免连续触发低质量重算。',
                },
              ].map((item) => {
                const isActing = submittingStrategy === item.key || (isPending && submittingStrategy === null && item.primary);
                return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => void handleUpgrade(item.key)}
                  disabled={!!submittingStrategy || isPending}
                  className={`rounded-[1.25rem] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    item.primary
                      ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white'
                      : 'border-[color:var(--line)] bg-slate-50 text-[color:var(--ink)]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <RefreshCcw className={`h-4 w-4 ${isActing ? 'animate-spin' : ''}`} />
                    {isActing ? '处理中...' : item.title}
                  </div>
                  <div className={`mt-2 text-xs leading-6 ${item.primary ? 'text-white/85' : 'text-[color:var(--muted)]'}`}>
                    {item.description}
                  </div>
                </button>
                );
              })}
            </div>
          </div>
          {error ? <div className="text-sm text-rose-700">{error}</div> : null}
          {success ? <div className="text-sm text-emerald-700">{success}</div> : null}
        </div>
      )}
    </div>
  );
}

function VersionTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] bg-white px-4 py-4">
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-base font-bold text-[color:var(--ink)]">{value}</div>
    </div>
  );
}

function formatVersionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
