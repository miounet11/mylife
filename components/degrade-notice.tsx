import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

// 内容补全提示：基础内容可读，后续内容会继续补齐。

type DegradeNoticeProps = {
  pending: boolean;
  lastError?: string | null;
  // 报告 ID 用于刷新链接
  reportId: string;
};

export default function DegradeNotice({
  pending,
  lastError,
  reportId,
}: DegradeNoticeProps) {
  if (!pending) return null;

  void lastError;

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
            <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-1.5 text-[10px] font-semibold text-[color:var(--ink-4)]">
              内容补全中
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">
            当前先展示可阅读的核心判断、阶段节奏和行动建议。更完整的章节内容会自动补齐到这份报告里，无需重新测算。
          </p>

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
