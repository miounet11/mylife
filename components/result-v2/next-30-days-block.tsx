import type { TimingPoint } from '@/lib/life-timing/types';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { timingMapCopy } from '@/lib/i18n/timing-map-copy';
import TimingPointCard from './timing-point-card';

interface Props {
  points: TimingPoint[];
  locale?: SiteLocale;
}

export default function Next30DaysBlock({ points, locale = 'zh-CN' }: Props) {
  const copy = timingMapCopy(locale);
  const list = Array.isArray(points) ? points : [];

  return (
    <section className="rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3.5 shadow-sm md:p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--data-up)]">
        {copy.next30Eyebrow}
      </div>
      <h3 className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)] md:text-[16px]">
        {copy.next30Title(list.length)}
      </h3>
      {list.length > 0 ? (
        <div className="mt-3 space-y-2.5">
          {list.map((p) => (
            <TimingPointCard key={p.id} point={p} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyHint locale={locale} />
      )}
    </section>
  );
}

function EmptyHint({ locale }: { locale: SiteLocale }) {
  return (
    <p className="mt-3 rounded-[8px] border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3 text-[13px] text-[color:var(--ink-4)]">
      {locale === 'en'
        ? 'No near-term windows extracted yet. Open the full report for structure detail.'
        : '近 30 天暂无独立时点。可打开完整报告查看结构与行动建议。'}
    </p>
  );
}
