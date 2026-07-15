import Link from 'next/link';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { resultChrome } from '@/lib/i18n/result-chrome';
import type { PublicReportSeoLike } from '@/lib/i18n/public-report-seo';
import { localizePublicReportSeo } from '@/lib/i18n/public-report-seo';

/**
 * SSR locale summary strip for result pages.
 * English/Traditional users get a decision-path summary before engine detail.
 */
export default function ResultLocaleSummary({
  locale,
  reportId,
  publicSeo,
  className = '',
}: {
  locale: SiteLocale;
  reportId: string;
  publicSeo?: PublicReportSeoLike | null;
  className?: string;
}) {
  const chrome = resultChrome(locale);
  const seo = publicSeo
    ? localizePublicReportSeo(publicSeo, locale, reportId)
    : null;

  return (
    <section
      className={`fb-card overflow-hidden ${className}`}
      data-locale-summary={locale}
      id="locale-summary"
    >
      <div className="border-b border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/60 px-4 py-2.5 md:px-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--ink-3)]">
          {chrome.eyebrow}
          {seo?.patternType ? (
            <span className="ml-2 font-medium normal-case tracking-normal text-[color:var(--ink-4)]">
              · {seo.patternType}
              {seo.dayMaster ? ` · ${seo.dayMaster}` : ''}
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 px-4 py-5 md:px-5">
        <div>
          <h2 className="text-[18px] font-semibold leading-snug tracking-[-0.015em] text-[color:var(--ink-1)] md:text-[20px]">
            {seo?.title || chrome.heroTitle}
          </h2>
          <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--ink-3)]">
            {seo?.description || chrome.heroDescription}
          </p>
        </div>

        <ol className="grid gap-2 sm:grid-cols-2">
          {chrome.summaryPoints.map((point, index) => (
            <li
              key={point}
              className="flex gap-2 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-3 py-2.5 text-[13px] leading-[1.45] text-[color:var(--ink-2)]"
            >
              <span className="font-semibold text-[color:var(--brand)]">{index + 1}.</span>
              <span>{point}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2">
          <a href="#cockpit" className="fb-btn fb-btn-primary h-8 px-3 text-[12px] hover:no-underline">
            {chrome.ctaCore}
          </a>
          <a href="#action-validation" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
            {chrome.ctaActions}
          </a>
          <Link href="/predictions" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
            {chrome.ctaPredictions}
          </Link>
          <Link href="/dimensions" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
            {chrome.ctaDimensions}
          </Link>
          <Link href="/analyze" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
            {chrome.ctaReanalyze}
          </Link>
        </div>

        {locale === 'en' && chrome.enBodyNote ? (
          <p className="text-[12px] leading-snug text-[color:var(--ink-4)]">{chrome.enBodyNote}</p>
        ) : null}
      </div>
    </section>
  );
}
