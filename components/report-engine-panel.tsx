'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { RefreshCcw, Sparkles } from 'lucide-react';
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

export default function ReportEnginePanel({
  reportId,
  canManage,
  reportVersion,
  llmUsed,
  agenticUsed,
  reasoningMode,
  consistencyScore,
  verifyVerdict,
  generatedFrom,
  upgradedFromVersion,
  engineBuilds,
  enhancementNotes,
}: {
  reportId: string;
  canManage: boolean;
  reportVersion: string;
  llmUsed: boolean;
  agenticUsed?: boolean;
  reasoningMode?: ReportReasoningMode;
  consistencyScore?: number;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  generatedFrom?: string;
  upgradedFromVersion?: string;
  engineBuilds: EngineBuilds;
  enhancementNotes?: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const resolvedReasoningMode = deriveReportReasoningMode({
    reasoningMode,
    agenticUsed,
    verifyVerdict,
    enhancementNotes,
  });

  const needsUpgrade = reportVersion !== engineBuilds.report || !llmUsed;

  const handleUpgrade = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/fortune/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade' }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '升级重算失败');
        return;
      }

      setSuccess(`已升级到 ${data.data?.reportVersion || engineBuilds.report}`);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError('网络异常，升级重算失败');
    }
  };

  return (
    <div className="soft-card rounded-[1.75rem] p-5">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[color:var(--accent-strong)]" />
        <div className="font-semibold text-[color:var(--ink)]">报告引擎版本</div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <VersionTile label="报告版本" value={reportVersion} />
        <VersionTile label="推理层" value={getReasoningModeLabel(resolvedReasoningMode)} />
        <VersionTile label="文本增强" value={llmUsed ? 'LLM 深度增强' : '结构化整合输出'} />
        <VersionTile label="一致性评分" value={typeof consistencyScore === 'number' ? `${consistencyScore}` : '待生成'} />
        <VersionTile label="命理引擎" value={engineBuilds.core} />
        <VersionTile label="人生 K 线" value={engineBuilds.kline} />
      </div>

      <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
        {generatedFrom === 'upgrade'
          ? `这份报告已经通过当前版本重算${upgradedFromVersion ? `，原始版本为 ${upgradedFromVersion}` : ''}。`
          : getReasoningModeDescription(resolvedReasoningMode)}
      </div>

      {verifyVerdict ? (
        <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-[color:var(--ink)]">
          当前一致性结论：{verifyVerdict}
          {typeof consistencyScore === 'number' ? `，评分 ${consistencyScore}/100。` : '。'}
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

      {canManage && needsUpgrade && (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => void handleUpgrade()}
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? '升级中...' : `升级到 ${engineBuilds.report}`}
          </button>
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
