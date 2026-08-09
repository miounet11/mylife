import Link from 'next/link';

type Props = {
  reportId: string;
  chatHref: string;
  sevenDayActions?: string[] | null;
  usableDeep?: boolean;
  qualityScore?: number | null;
  canManage?: boolean;
};

/**
 * Immersive read-layer chrome (X-Tavern-inspired): weak, always-available action rail.
 * Keeps 7-day actions + consultant entry visible without heavy panels.
 */
export default function ReportActionRail({
  reportId,
  chatHref,
  sevenDayActions,
  usableDeep,
  qualityScore,
  canManage,
}: Props) {
  const actions = (sevenDayActions || [])
    .map((a) => `${a || ''}`.trim())
    .filter((a) => a.length >= 4)
    .slice(0, 3);

  return (
    <div
      id="action-rail"
      className="sticky bottom-0 z-20 border-t border-[color:var(--hairline)] bg-[color:var(--paper)]/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--paper)]/80 md:px-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[color:var(--ink-4)]">
            {usableDeep ? (
              <span className="rounded-full bg-[rgba(47,125,82,0.10)] px-2 py-0.5 font-semibold text-[color:var(--data-up)]">
                可用深度
                {typeof qualityScore === 'number' ? ` · ${qualityScore}` : ''}
              </span>
            ) : typeof qualityScore === 'number' ? (
              <span className="rounded-full bg-[color:var(--bg-elevated)] px-2 py-0.5">
                可信度 {qualityScore}
              </span>
            ) : null}
            <span className="font-semibold text-[color:var(--ink-3)]">近 7 天 · 先做一件</span>
          </div>
          {actions.length > 0 ? (
            <p className="mt-0.5 truncate text-[12px] leading-[1.45] text-[color:var(--ink-2)]">
              {actions[0]}
            </p>
          ) : (
            <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
              行动清单生成后会出现在这里
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a
            href="#seven-day-actions"
            className="rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[color:var(--ink-2)] hover:bg-[#f6f7f9]"
          >
            全部行动
          </a>
          <Link
            href={chatHref}
            className="rounded-[3px] border border-[#3b5998]/30 bg-[#3b5998] px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-95"
          >
            问顾问
          </Link>
          {canManage ? (
            <a
              href="#section-rerun"
              className="rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[color:var(--ink-3)] hover:bg-[#f6f7f9]"
            >
              专章补强
            </a>
          ) : (
            <a
              href={`/events?reportId=${encodeURIComponent(reportId)}`}
              className="rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[color:var(--ink-3)] hover:bg-[#f6f7f9]"
            >
              记事件
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
