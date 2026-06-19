import type { FortuneAnalysisResult } from '@/lib/user-types';
import type { UserFacingReportStageLadderItem } from '@/lib/report-quality';

type QualityAudit = NonNullable<FortuneAnalysisResult['analysis']>['qualityAudit'];

// v5-D5 (2026-05-16) 报告阅读进度阶梯卡：从 result/[id]/page.tsx 抽离
// Why: 主 page 1369 行仍偏厚，这段 100 行 inline JSX 数据耦合明确（只依赖
//      stageLadder + qualityAudit + upgradeJob + llmUsed），抽出后主页面减少 100 行
// How: 接 4 个 props，纯展示；不引入新行为

interface ReportStageProgressProps {
  ladder: UserFacingReportStageLadderItem[];
  current: UserFacingReportStageLadderItem;
  next: UserFacingReportStageLadderItem | null;
  qualityAudit?: QualityAudit | null;
  llmUsed?: boolean;
  isEnhancementPending: boolean;
  enhancementStatusMessage: string;
  upgradeStatus?: string | null;
  upgradeStatusLabel?: string | null;
}

export default function ReportStageProgress({
  ladder,
  current,
  next,
  qualityAudit,
  llmUsed = false,
  isEnhancementPending,
  enhancementStatusMessage,
  upgradeStatus,
  upgradeStatusLabel,
}: ReportStageProgressProps) {
  return (
    <div
      className={`mt-5 rounded-[var(--radius)] border px-4 py-4 ${
        isEnhancementPending
          ? 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]/80'
          : llmUsed
            ? 'border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.08)]/70'
            : 'border-[color:var(--line)] bg-[color:var(--paper)]'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isEnhancementPending
              ? 'bg-[color:var(--paper)] text-[color:var(--signal-strong)]'
              : llmUsed
                ? 'bg-[color:var(--paper)] text-[color:var(--data-up)]'
                : 'bg-[color:var(--bg-sunken)] text-[color:var(--muted)]'
          }`}
        >
          {qualityAudit
            ? `可信度 ${qualityAudit.overallScore || '--'}`
            : isEnhancementPending
              ? '基础内容已可阅读'
              : llmUsed
                ? '完整内容已送达'
                : '当前为基础可读版'}
        </span>
        <span className="rounded-full bg-[color:var(--paper)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
          {`当前阶段 ${current.shortLabel}`}
        </span>
        {qualityAudit?.targetAchieved ? (
          <span className="rounded-full bg-[rgba(47,125,82,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--data-up)]">
            内容已达到完整标准
          </span>
        ) : null}
        {upgradeStatusLabel ? (
          <span className="rounded-full bg-[color:var(--paper)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
            {upgradeStatusLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
        {qualityAudit?.summary || enhancementStatusMessage}
      </div>
      <div className="mt-4 rounded-[var(--radius)] border border-white/70 bg-[color:var(--paper)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">报告阅读进度</div>
            <div className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
              {`你现在拿到的是${current.label}。`}
            </div>
          </div>
          {next ? (
            <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              {`下一阶段 ${next.shortLabel}`}
            </div>
          ) : (
            <div className="rounded-full bg-[rgba(47,125,82,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--data-up)]">
              已到当前最高阶段
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {ladder.map((item) => (
            <div
              key={item.key}
              data-stage-key={item.key}
              className={`rounded-[var(--radius)] border px-4 py-4 ${
                item.status === 'current'
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                  : item.status === 'completed'
                    ? 'border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.08)]/80'
                    : 'border-[color:var(--line)] bg-[color:var(--bg-elevated)]/90'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.status === 'current'
                      ? 'bg-[color:var(--paper)] text-[color:var(--accent-strong)]'
                      : item.status === 'completed'
                        ? 'bg-[color:var(--paper)] text-[color:var(--data-up)]'
                        : 'bg-[color:var(--paper)] text-[color:var(--muted)]'
                  }`}
                >
                  {item.status === 'current' ? '当前' : item.status === 'completed' ? '已完成' : '未到'}
                </span>
              </div>
              <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">{item.description}</div>
            </div>
          ))}
        </div>
        {next ? (
          <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
            <span className="font-semibold text-[color:var(--accent-strong)]">下一阶段：</span>
            {`${next.label}会补足${next.description.replace(/^会补足/, '')}`}
          </div>
        ) : null}
      </div>
      {upgradeStatus && upgradeStatusLabel ? (
        <div className="mt-3 text-xs text-[color:var(--muted)]">
          {upgradeStatusLabel}，系统会在内容可用后自动更新到这份报告。
        </div>
      ) : null}
    </div>
  );
}
