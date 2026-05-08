import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

// v5-A3 (2026-05-08) 决策台风降级通知
// 当报告还是 basic（LLM 增强未跑通），用一条决策台风条幅明确告诉用户：
//   1) 这是基础版（不是隐瞒）
//   2) 后台正在重试增强（不是已经停摆）
//   3) 给出明确的"几分钟后回来"或"刷新一次试试" 操作

type DegradeNoticeProps = {
  // 是否仍在尝试拉到 LLM 增强（pending / retry / running）
  pending: boolean;
  // 最近一次失败原因（如 LLM_UNAVAILABLE / PROVIDER_UNHEALTHY），用来生成更精确的文案
  lastError?: string | null;
  // 已尝试次数 / 上限
  attempts?: number;
  maxAttempts?: number;
  // 下次重试时间（ISO string）
  nextRunAt?: string | null;
  // 报告 ID 用于刷新链接
  reportId: string;
};

function formatRelativeMinutes(nextRunAt?: string | null): string | null {
  if (!nextRunAt) return null;
  const t = new Date(nextRunAt).getTime();
  if (!Number.isFinite(t)) return null;
  const delta = Math.max(0, Math.round((t - Date.now()) / 60000));
  if (delta <= 0) return '即将重试';
  if (delta < 60) return `约 ${delta} 分钟后再试`;
  const hours = Math.round(delta / 60);
  return `约 ${hours} 小时后再试`;
}

export default function DegradeNotice({
  pending,
  lastError,
  attempts,
  maxAttempts,
  nextRunAt,
  reportId,
}: DegradeNoticeProps) {
  if (!pending) return null;

  const isProviderIssue = lastError === 'PROVIDER_UNHEALTHY' || lastError === 'LLM_UNAVAILABLE';
  const relative = formatRelativeMinutes(nextRunAt);
  const triedSummary = typeof attempts === 'number' && typeof maxAttempts === 'number' && maxAttempts > 0
    ? `已尝试 ${attempts}/${maxAttempts}`
    : null;

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] p-4 md:p-5"
      data-degrade-notice
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--paper)] text-[color:var(--signal-strong)]">
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--signal-strong)]">
              基础版报告
            </span>
            <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-1.5 font-mono text-[10px] font-semibold text-[color:var(--ink-4)]">
              AI 增强重试中
            </span>
            {triedSummary ? (
              <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-1.5 font-mono text-[10px] font-semibold text-[color:var(--ink-4)]">
                {triedSummary}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">
            {isProviderIssue
              ? '上游模型当前不稳定，已经先把基础版（结构、阶段、五行、十神）给你看。AI 增强（深度叙事、章节展开）会在恢复后自动补齐到这份报告里，无需重新测算。'
              : '后台正在跑 AI 增强（深度叙事、章节展开），完成后会自动补齐到这份报告里。基础版的结构、阶段、五行、十神已经稳定可读。'}
          </p>

          {(relative || nextRunAt) && (
            <div className="mt-2 text-xs leading-5 text-[color:var(--ink-4)]">
              {relative ? `下一次自动重试：${relative}。` : null}
              {' '}你也可以稍后回到这份报告查看完整版。
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/result/${reportId}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-2)] hover:border-[color:var(--brand)]"
              prefetch={false}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              立刻刷新一次
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              先去我的中心
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
