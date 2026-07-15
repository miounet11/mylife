import type { SiteLocale } from '@/lib/i18n/site-locale';
import { timingMapCopy } from '@/lib/i18n/timing-map-copy';

interface Props {
  baziPillars: string;
  locale?: SiteLocale;
}

export default function DetailedFoldBlock({ baziPillars, locale = 'zh-CN' }: Props) {
  const copy = timingMapCopy(locale);
  const pillars = `${baziPillars || ''}`.trim();
  const parts = pillars ? pillars.split(/\s+/).filter(Boolean) : [];

  return (
    <section className="rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3.5 shadow-sm md:p-4">
      <h3 className="text-[14px] font-bold text-[color:var(--ink-1)]">{copy.detailTitle}</h3>
      <p className="mt-1.5 text-[13px] leading-[1.6] text-[color:var(--ink-3)]">{copy.detailBody}</p>

      {parts.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {parts.slice(0, 4).map((pillar, index) => {
            const labels =
              locale === 'en'
                ? ['Year', 'Month', 'Day', 'Hour']
                : ['年柱', '月柱', '日柱', '时柱'];
            return (
              <div
                key={`${pillar}-${index}`}
                className="rounded-[8px] border border-[color:var(--hairline)] bg-[#f7f9fc] px-2.5 py-2 text-center"
              >
                <div className="text-[10px] font-bold text-[color:var(--ink-4)]">
                  {labels[index] || `P${index + 1}`}
                </div>
                <div className="mt-1 font-mono text-[16px] font-bold tracking-wide text-[color:var(--ink-1)]">
                  {pillar}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 font-mono text-[12px] text-[color:var(--ink-4)]">
          {copy.yourBazi}：—
        </p>
      )}

      <p className="mt-3 text-[12px] text-[color:var(--ink-4)]">
        {locale === 'en'
          ? 'For structure, dayun, actions and evidence, open the full report.'
          : '若要看格局、大运、行动板与证据层，请进入完整报告。'}
      </p>
    </section>
  );
}
