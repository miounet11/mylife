import { getContentLocalePresentation } from '@/lib/content-locale';

interface ContentLocaleBadgeProps {
  locale?: string;
  market?: string;
  compact?: boolean;
}

export default function ContentLocaleBadge({ locale, market, compact = false }: ContentLocaleBadgeProps) {
  const presentation = getContentLocalePresentation(locale, market);

  return (
    <span
      className={compact
        ? 'rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent-strong)]'
        : 'rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]'}
    >
      {presentation.groupLabel} · {presentation.localeLabel}
    </span>
  );
}
