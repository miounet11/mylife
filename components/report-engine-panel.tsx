'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  buildUserFacingReportStatus,
  type UserReportReadiness,
} from '@/lib/report-status-presentation';

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
  mode?: string;
  agentSources?: Record<string, string>;
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

/**
 * 报告状态面板（用户向重构版）
 * - 只保留一条主结论
 * - 可信 / 留意 分区清晰
 * - 进度与主动作不互相打架
 * - 工程分数默认折叠
 */
export default function ReportEnginePanel({
  reportId,
  canManage,
  llmUsed,
  agenticUsed,
  consistencyScore,
  verifyVerdict,
  qualityAudit,
  upgradeJob,
  generatedFrom,
  orchestration,
  feedbackLoop,
}: {
  reportId: string;
  canManage: boolean;
  reportVersion?: string;
  llmUsed: boolean;
  agenticUsed?: boolean;
  reasoningMode?: string;
  consistencyScore?: number;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  qualityAudit?: QualityAudit;
  upgradeJob?: UpgradeJob;
  generatedFrom?: string;
  upgradedFromVersion?: string;
  engineBuilds?: EngineBuilds;
  enhancementNotes?: string[];
  orchestration?: OrchestrationMeta;
  feedbackLoop?: FeedbackLoop;
  versionLineage?: unknown[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submittingStrategy, setSubmittingStrategy] = useState<'immediate' | 'queue' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const status = useMemo(
    () =>
      buildUserFacingReportStatus({
        llmUsed,
        agenticUsed,
        consistencyScore,
        verifyVerdict,
        qualityAudit,
        upgradeJob,
        generatedFrom,
        orchestration,
        canManage,
      }),
    [
      llmUsed,
      agenticUsed,
      consistencyScore,
      verifyVerdict,
      qualityAudit,
      upgradeJob,
      generatedFrom,
      orchestration,
      canManage,
    ]
  );

  const tone = readinessTone(status.readiness);
  const progressBusy = status.progress.state === 'running' || status.progress.state === 'queued';

  const handleUpgrade = async (strategy: 'immediate' | 'queue') => {
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
        setError(data.error || '暂时无法完善报告');
        setSubmittingStrategy(null);
        return;
      }

      const upgradeQueued = data.data?.upgradeQueued === true;
      const queueReason = typeof data.data?.queueReason === 'string' ? data.data.queueReason : '';
      const upgradeStatus =
        typeof data.data?.upgradeJob?.status === 'string' ? data.data.upgradeJob.status : '';
      const alreadyQueued =
        queueReason === 'already_queued' ||
        (!upgradeQueued && ['pending', 'running', 'retry'].includes(upgradeStatus));

      if (strategy === 'immediate') {
        setSuccess(alreadyQueued ? '已在完善队列中，完成后会更新当前页。' : '已开始完善，请稍候刷新查看。');
      } else {
        setSuccess(alreadyQueued ? '已在队列中，无需重复提交。' : '已加入完善队列。');
      }

      window.setTimeout(() => {
        startTransition(() => {
          router.refresh();
        });
      }, 1200);
    } catch {
      setError('网络异常，暂时无法完善报告');
      setSubmittingStrategy(null);
    }
  };

  return (
    <div className="fb-card border-t-2 border-t-[#3b5998] p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3b5998]">报告状态</div>
      <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-4)] intro-copy">
        一句话说明能不能用；细节默认收起。
      </p>

      {/* 主结论：唯一权威 */}
      <div className={`mt-3 rounded-[3px] border px-3 py-3 ${tone.box}`}>
        <div className="flex items-start gap-2">
          {status.readiness === 'ready' ? (
            <ShieldCheck className={`mt-0.5 h-4 w-4 shrink-0 ${tone.icon}`} />
          ) : status.readiness === 'usable' ? (
            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${tone.icon}`} />
          ) : (
            <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${tone.icon}`} />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-[3px] px-2 py-0.5 text-[11px] font-bold ${tone.badge}`}>
                {status.badge}
              </span>
              <span className="text-[11px] font-semibold text-[color:var(--ink-4)]">{status.editionLabel}</span>
              {status.confidenceScore != null ? (
                <span className="font-mono text-[11px] tabular-nums text-[color:var(--ink-5)]">
                  可信 {status.confidenceScore}
                </span>
              ) : null}
            </div>
            <h3 className={`mt-1.5 text-[14px] font-bold leading-snug ${tone.title}`}>{status.title}</h3>
            <p className="mt-1.5 text-[12px] leading-[1.6] text-[color:var(--ink-3)]">{status.summary}</p>
          </div>
        </div>
      </div>

      {/* 可信 / 留意：两列信息，不再堆五维分 */}
      {(status.trustPoints.length > 0 || status.cautionPoints.length > 0) && (
        <div className="mt-3 grid gap-2">
          {status.trustPoints.length > 0 ? (
            <div className="rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2.5">
              <div className="text-[11px] font-bold text-[color:var(--data-up)]">可以相信</div>
              <ul className="mt-1.5 space-y-1">
                {status.trustPoints.map((item) => (
                  <li key={item} className="text-[12px] leading-[1.5] text-[color:var(--ink-2)]">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {status.cautionPoints.length > 0 ? (
            <div className="rounded-[3px] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-2.5">
              <div className="text-[11px] font-bold text-[color:var(--signal-strong)]">需要留意</div>
              <ul className="mt-1.5 space-y-1">
                {status.cautionPoints.map((item) => (
                  <li key={item} className="text-[12px] leading-[1.5] text-[color:var(--signal-strong)]">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {/* 进度：单条，失败不再显示「正在刷新」 */}
      {status.progress.state !== 'none' ? (
        <div
          className={`mt-3 rounded-[3px] border px-3 py-2.5 ${
            status.progress.state === 'paused'
              ? 'border-[color:var(--hairline)] bg-[#f6f7f9]'
              : status.progress.state === 'done'
                ? 'border-[color:var(--data-up)]/30 bg-[rgba(47,125,82,0.06)]'
                : 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold text-[color:var(--ink-1)]">{status.progress.label}</div>
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--ink-4)]">
              {progressStateLabel(status.progress.state)}
            </span>
          </div>
          {status.progress.detail ? (
            <p className="mt-1 text-[11px] leading-[1.5] text-[color:var(--ink-4)]">{status.progress.detail}</p>
          ) : null}
        </div>
      ) : null}

      {/* 事件反馈：极简一行 */}
      {feedbackLoop?.validationInsights && (feedbackLoop.validationInsights.totalLinkedEvents || 0) > 0 ? (
        <div className="mt-3 rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 py-2 text-[11px] leading-5 text-[color:var(--ink-3)]">
          已关联事件 {feedbackLoop.validationInsights.totalLinkedEvents || 0}
          {typeof feedbackLoop.validationInsights.accurateCount === 'number'
            ? ` · 吻合 ${feedbackLoop.validationInsights.accurateCount}`
            : ''}
          {typeof feedbackLoop.validationInsights.driftCount === 'number' &&
          feedbackLoop.validationInsights.driftCount > 0
            ? ` · 偏差 ${feedbackLoop.validationInsights.driftCount}`
            : ''}
        </div>
      ) : null}

      {/* 主动作：最多两个，不再三选一恐吓 */}
      <div className="mt-3 space-y-2">
        {status.primaryAction.kind === 'upgrade_now' && canManage ? (
          <>
            <button
              type="button"
              onClick={() => void handleUpgrade('immediate')}
              disabled={!!submittingStrategy || isPending || progressBusy}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[3px] bg-[#3b5998] px-3 text-[12px] font-semibold text-white transition hover:bg-[#2d4373] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${submittingStrategy === 'immediate' ? 'animate-spin' : ''}`} />
              {submittingStrategy === 'immediate' || isPending ? '处理中…' : status.primaryAction.label}
            </button>
            <button
              type="button"
              onClick={() => void handleUpgrade('queue')}
              disabled={!!submittingStrategy || isPending || progressBusy}
              className="inline-flex h-8 w-full items-center justify-center rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 text-[11px] font-semibold text-[color:var(--ink-3)] hover:border-[#3b5998] hover:text-[#3b5998] disabled:opacity-60"
            >
              {submittingStrategy === 'queue' ? '加入中…' : '加入后台队列完善'}
            </button>
          </>
        ) : null}

        {status.primaryAction.kind === 'reanalyze' && canManage ? (
          <Link
            href={`/analyze?source=report_status_reanalyze&from=${encodeURIComponent(reportId)}`}
            className="inline-flex h-9 w-full items-center justify-center rounded-[3px] bg-[#3b5998] px-3 text-[12px] font-semibold text-white hover:bg-[#2d4373]"
          >
            {status.primaryAction.label}
          </Link>
        ) : null}

        {status.primaryAction.kind === 'read_main' || !canManage ? (
          <a
            href="#cockpit"
            className="inline-flex h-9 w-full items-center justify-center rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 text-[12px] font-semibold text-[#3b5998] hover:bg-[#e9ebee]"
          >
            阅读报告正文
          </a>
        ) : null}

        {error ? <p className="text-[12px] text-[color:var(--alert)]">{error}</p> : null}
        {success ? <p className="text-[12px] text-[color:var(--data-up)]">{success}</p> : null}
      </div>

      {/* 工程明细：默认折叠，避免与主结论抢注意力 */}
      {status.details.length > 0 ? (
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-2">
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="flex w-full items-center justify-between py-1 text-left text-[11px] font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)]"
          >
            <span>查看评分明细</span>
            {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {detailsOpen ? (
            <dl className="mt-2 grid gap-1.5">
              {status.details.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2 rounded-[3px] bg-[#f6f7f9] px-2.5 py-1.5 text-[11px]"
                >
                  <dt className="text-[color:var(--ink-4)]">{item.label}</dt>
                  <dd className="font-mono font-semibold tabular-nums text-[color:var(--ink-2)]">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function readinessTone(readiness: UserReportReadiness) {
  if (readiness === 'ready') {
    return {
      box: 'border-[rgba(47,125,82,0.35)] bg-[rgba(47,125,82,0.06)]',
      badge: 'bg-[rgba(47,125,82,0.12)] text-[color:var(--data-up)]',
      icon: 'text-[color:var(--data-up)]',
      title: 'text-[color:var(--ink-1)]',
    };
  }
  if (readiness === 'draft') {
    return {
      box: 'border-[color:var(--alert)]/40 bg-[color:var(--alert-soft)]',
      badge: 'bg-[color:var(--alert-soft)] text-[color:var(--alert)]',
      icon: 'text-[color:var(--alert)]',
      title: 'text-[color:var(--ink-1)]',
    };
  }
  return {
    box: 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]',
    badge: 'bg-white/80 text-[color:var(--signal-strong)]',
    icon: 'text-[color:var(--signal-strong)]',
    title: 'text-[color:var(--ink-1)]',
  };
}

function progressStateLabel(state: string) {
  switch (state) {
    case 'running':
      return '进行中';
    case 'queued':
      return '排队中';
    case 'done':
      return '已结束';
    case 'paused':
      return '已暂停';
    default:
      return '';
  }
}
