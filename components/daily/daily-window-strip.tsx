import Link from 'next/link';
import { Eyebrow } from '@/components/ui/eyebrow';
import { getDailyWindowCopy } from '@/lib/daily/window-copy';
import { cn } from '@/lib/utils';

/**
 * Lightweight public habit strip: generic rhythm tip + CTAs.
 * No personal bazi / 日主 / 用神 without a real report context.
 */
export default function DailyWindowStrip({
  className,
  compact = false,
  source = 'daily_window_strip',
}: {
  className?: string;
  compact?: boolean;
  /** Analytics / funnel source query on outbound links */
  source?: string;
}) {
  const { text } = getDailyWindowCopy();
  const toolHref = `/tools/timing-yearly-window?source=${encodeURIComponent(source)}`;
  const updatesHref = `/updates?source=${encodeURIComponent(source)}`;

  return (
    <section
      aria-label="今日窗口"
      className={cn(
        'rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)]',
        compact ? 'px-3.5 py-3' : 'px-4 py-3.5',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <Eyebrow tone="brand">今日窗口</Eyebrow>
          <p
            className={cn(
              'mt-1.5 max-w-2xl leading-[1.55] text-[color:var(--ink-2)]',
              compact ? 'text-[13px]' : 'text-[14px]',
            )}
          >
            {text}
          </p>
          <p className="mt-1 text-[12px] leading-[1.45] text-[color:var(--ink-4)]">
            通用节奏提示 · 非个人命盘 · 可验证、不恐吓
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5 text-[13px]">
          <Link
            href={toolHref}
            className="font-semibold text-[color:var(--brand)] hover:no-underline"
          >
            填生日测年度窗口
          </Link>
          <Link
            href={updatesHref}
            className="font-medium text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
          >
            订阅提醒
          </Link>
        </div>
      </div>
    </section>
  );
}
