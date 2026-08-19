import Link from 'next/link';
import { ArrowRight, Compass, Wrench } from 'lucide-react';
import { PrestigeIconRow } from '@/components/brand/prestige-banner';
import { homeExploreCopy } from '@/lib/i18n/home-explore-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';

export function HomeExplore({ locale = 'zh-CN' }: { locale?: SiteLocale }) {
  const copy = homeExploreCopy(locale);

  return (
    <section className="py-12 md:py-16" aria-label={copy.aria}>
      <div className="page-content-wide">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--hairline)] pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--brand)]/20 bg-[color:var(--brand-soft)] px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[color:var(--brand-strong)]">
              <Compass className="h-3.5 w-3.5" />
              {copy.kicker}
            </span>
            <h2 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-[color:var(--ink-1)] md:text-[26px]">
              {copy.title}
            </h2>
            <p className="mt-1 text-[13px] text-[color:var(--ink-4)]">{copy.desc}</p>
          </div>
          <Link
            href="#analyze-workspace"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[color:var(--brand)] hover:text-[color:var(--brand-strong)] hover:underline"
          >
            <span>{copy.generate}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <PrestigeIconRow keys={['app', 'timing', 'seal']} locale={locale} className="mt-6 max-w-lg" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.paths.map((p, index) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex flex-col justify-between rounded-2xl border border-[color:var(--hairline)] bg-white p-5 no-underline shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#182638]/30 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:no-underline"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${p.badgeClass}`}>
                    {p.tag}
                  </span>
                  <span className="font-mono text-[12px] font-semibold text-[color:var(--ink-5)]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-[17px] font-bold tracking-tight text-[color:var(--ink-1)] group-hover:text-[#182638]">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-[color:var(--ink-4)]">{p.desc}</p>
              </div>

              <div className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-[color:var(--brand)] transition group-hover:translate-x-0.5">
                <span>{copy.enter}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-b from-white to-[#f8f9fa] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--hairline)] pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[color:var(--ink-3)]" />
              <span className="text-[14px] font-bold text-[color:var(--ink-1)]">{copy.toolsTitle}</span>
            </div>
            <Link
              href="/tools"
              className="text-[12px] font-medium text-[color:var(--brand)] hover:underline"
            >
              {copy.allTools}
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {copy.tools.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col items-center justify-center rounded-xl border border-[color:var(--hairline)]/80 bg-white p-3 text-center transition hover:border-[#182638]/20 hover:bg-[#f8f9fa] hover:shadow-2xs"
              >
                <span className="text-[13px] font-bold text-[color:var(--ink-1)] group-hover:text-[color:var(--brand)]">
                  {t.title}
                </span>
                <span className="mt-0.5 text-[10px] text-[color:var(--ink-5)]">{t.subtitle}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
