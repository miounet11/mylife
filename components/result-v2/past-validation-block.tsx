import type { PastValidation } from '@/lib/life-timing/types';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { timingMapCopy } from '@/lib/i18n/timing-map-copy';
import { localizePastTemplate } from '@/lib/life-timing/user-copy-i18n';
import { presentReportText } from '@/lib/report-presentation';

interface Props {
  validations: PastValidation[];
  locale?: SiteLocale;
}

export default function PastValidationBlock({ validations, locale = 'zh-CN' }: Props) {
  const copy = timingMapCopy(locale);
  const list = Array.isArray(validations) ? validations : [];

  if (list.length === 0) {
    return (
      <section className="rounded-[10px] border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-4 py-4 text-[13px] leading-[1.6] text-[color:var(--ink-4)]">
        {locale === 'en'
          ? 'No past checks yet. As real events accumulate, this section becomes the verification spine.'
          : '暂无过去印证样本。随着真实事件回填，这里会成为验证主轴。'}
      </section>
    );
  }

  return (
    <section className="rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3.5 shadow-sm md:p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)]">
        {copy.pastEyebrow}
      </div>
      <ul className="mt-2.5 space-y-2">
        {list.map((v) => {
          const text = presentReportText(localizePastTemplate(v, locale), 160);
          return (
            <li
              key={v.id}
              className="flex gap-2 rounded-[8px] border border-[color:var(--hairline)] bg-[#fafbfc] px-3 py-2 text-[13px] leading-[1.6] text-[color:var(--ink-1)]"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3b5998]" />
              <span className="min-w-0 break-words">{text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
