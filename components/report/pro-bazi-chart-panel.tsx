'use client';

import { cn } from '@/lib/utils';
import { proBaziChartCopy } from '@/lib/i18n/hub-copy';
import { normalizeSiteLocale, type SiteLocale } from '@/lib/i18n/site-locale';

export type ProBaziPillar = {
  label: string;
  ganZhi: string;
  stemGod?: string;
  branchGods?: string[];
};

export type ProBaziChartPanelProps = {
  /** 年柱月柱日柱时柱 */
  pillars?: ProBaziPillar[];
  dayMaster?: string;
  yongShen?: string[];
  patternType?: string;
  currentDaYun?: string;
  nextWindow?: string;
  className?: string;
  /** UI locale — English chrome when en; pillar ganZhi / gods stay as provided */
  locale?: string | null;
};

/**
 * Dense 「四柱一屏」panel — four pillars, stems/branches, 十神, 用神, current 大运.
 * Scannable in ~3 seconds; Linear-clean muted ink. Does not invent chart data.
 */
export function ProBaziChartPanel({
  pillars,
  dayMaster,
  yongShen,
  patternType,
  currentDaYun,
  nextWindow,
  className,
  locale,
}: ProBaziChartPanelProps) {
  const siteLocale: SiteLocale = normalizeSiteLocale(locale) || 'zh-CN';
  const copy = proBaziChartCopy(siteLocale);
  const cols = normalizePillars(pillars, copy.pillarLabels);
  const hasChart = cols.some((p) => p.ganZhi && p.ganZhi !== '—');
  const yong = (yongShen || []).map((s) => String(s).trim()).filter(Boolean);
  const metaBits = [
    dayMaster ? copy.dayMaster(dayMaster) : null,
    patternType || null,
  ].filter(Boolean) as string[];

  return (
    <section
      className={cn(
        'rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5',
        className,
      )}
      data-pro-bazi-chart
      aria-label={copy.ariaLabel}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-[11px] font-medium tracking-wide text-[color:var(--ink-4)]">
            {copy.structureLabel}
          </div>
          <h3 className="mt-0.5 text-[15px] font-semibold leading-tight text-[color:var(--ink-1)]">
            {copy.title}
          </h3>
        </div>
        {metaBits.length ? (
          <div className="text-[12px] font-medium text-[color:var(--ink-3)]">
            {metaBits.join(' · ')}
          </div>
        ) : null}
      </div>

      {!hasChart ? (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-3 py-6 text-center">
          <p className="text-[13px] font-medium text-[color:var(--ink-3)]">{copy.emptyTitle}</p>
          <p className="mt-1 text-[12px] leading-[1.5] text-[color:var(--ink-4)]">
            {copy.emptyDesc}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2">
          {cols.map((pillar) => {
            const stem = pillar.ganZhi?.charAt(0) || '—';
            const branch = pillar.ganZhi?.charAt(1) || '—';
            const branchGods = (pillar.branchGods || []).filter(Boolean).slice(0, 3);
            // Day pillar: Chinese 日 / English "Day"
            const isDay =
              pillar.label.includes('日') ||
              pillar.label === 'Day' ||
              pillar.label.toLowerCase() === 'day';

            return (
              <div
                key={pillar.label}
                className={cn(
                  'flex flex-col items-center rounded-[var(--radius-sm)] border px-1 py-2.5 sm:px-2 sm:py-3',
                  isDay
                    ? 'border-[color:var(--brand-strong)]/35 bg-[color:var(--brand-soft)]'
                    : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40',
                )}
              >
                <div className="text-[10px] font-semibold tracking-wide text-[color:var(--ink-4)]">
                  {pillar.label}
                </div>
                <div
                  className={cn(
                    'mt-1.5 font-serif text-[22px] font-black leading-none tracking-tight sm:text-[26px]',
                    isDay ? 'text-[color:var(--brand-strong)]' : 'text-[color:var(--ink-1)]',
                  )}
                >
                  {stem}
                </div>
                <div className="mt-0.5 font-serif text-[18px] font-bold leading-none text-[color:var(--ink-2)] sm:text-[20px]">
                  {branch}
                </div>
                <div className="mt-2 min-h-[1rem] text-[10px] font-semibold text-[color:var(--ink-3)]">
                  {pillar.stemGod || '—'}
                </div>
                <div className="mt-1 flex min-h-[2.25rem] flex-col items-center gap-0.5">
                  {branchGods.length ? (
                    branchGods.map((g) => (
                      <span
                        key={`${pillar.label}-${g}`}
                        className="text-[9px] leading-tight text-[color:var(--ink-4)]"
                      >
                        {g}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] text-[color:var(--ink-5)]">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 用神 chips + 大运 row */}
      <div className="mt-4 space-y-2.5 border-t border-[color:var(--hairline)] pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-[11px] font-medium text-[color:var(--ink-4)]">
            {copy.yongShen}
          </span>
          {yong.length ? (
            yong.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-[color:var(--brand-strong)]/25 bg-[color:var(--brand-soft)] px-2.5 py-0.5 text-[12px] font-semibold text-[color:var(--brand-strong)]"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-[12px] text-[color:var(--ink-4)]">{copy.pending}</span>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <MetaRow label={copy.currentDaYun} value={currentDaYun || '—'} emphasize />
          <MetaRow label={copy.nextWindow} value={nextWindow || '—'} />
        </div>
      </div>
    </section>
  );
}

function MetaRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border px-3 py-2',
        emphasize
          ? 'border-[color:var(--brand-strong)]/20 bg-[color:var(--brand-soft)]/60'
          : 'border-[color:var(--hairline)]',
      )}
    >
      <span className="text-[11px] font-medium text-[color:var(--ink-4)]">{label}</span>
      <span
        className={cn(
          'truncate text-[12px] font-semibold',
          emphasize ? 'text-[color:var(--brand-strong)]' : 'text-[color:var(--ink-2)]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

const DEFAULT_LABELS_ZH = ['年柱', '月柱', '日柱', '时柱'] as const;

function normalizePillars(
  pillars: ProBaziPillar[] | undefined,
  defaultLabels: readonly [string, string, string, string],
): ProBaziPillar[] {
  const src = Array.isArray(pillars) ? pillars.slice(0, 4) : [];
  return defaultLabels.map((label, i) => {
    const p = src[i];
    if (!p) return { label, ganZhi: '—' };
    // Prefer locale-aware default labels when source still uses zh 年柱… labels
    const rawLabel = (p.label || '').trim();
    const isDefaultZh = (DEFAULT_LABELS_ZH as readonly string[]).includes(rawLabel);
    return {
      label: rawLabel && !isDefaultZh ? rawLabel : label,
      ganZhi: (p.ganZhi || '').trim() || '—',
      stemGod: p.stemGod,
      branchGods: p.branchGods,
    };
  });
}

export default ProBaziChartPanel;
