import Link from 'next/link';
import JsonLd from '@/components/seo/json-ld';
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageMetadata,
  buildServiceJsonLd,
  SITE_NAME,
} from '@/lib/seo';
import {
  getPageSeoGeoPack,
  isPagePackGeoReady,
  type PageSeoGeoPack,
} from '@/lib/page-seo-geo-packs';
import type { Metadata } from 'next';

/** Metadata helper: prefer pack title/description/keywords + GEO other fields. */
export function metadataFromPagePack(
  pathOrSlug: string,
  overrides?: Partial<{ title: string; description: string; path: string; locale: string }>,
): Metadata {
  const pack = getPageSeoGeoPack(pathOrSlug);
  if (!pack) {
    return buildPageMetadata({
      title: overrides?.title || SITE_NAME,
      description: overrides?.description || '',
      path: overrides?.path || pathOrSlug,
      locale: overrides?.locale,
    });
  }
  const base = buildPageMetadata({
    title: overrides?.title || pack.title,
    description: (overrides?.description || pack.description).slice(0, 160),
    path: overrides?.path || pack.path,
    locale: overrides?.locale,
    keywords: pack.keywords,
  });
  const other: Record<string, string> = {
    ...((base.other as Record<string, string> | undefined) || {}),
    'ai-answer-summary': pack.answerSummary.slice(0, 400),
    'search-intent': pack.searchIntents.join(' | '),
    'entity-keywords': pack.entityKeywords.join(', '),
    'geo-ready': isPagePackGeoReady(pack) ? '1' : '0',
  };
  if (pack.geoRegion) other['geo.region'] = pack.geoRegion;
  if (pack.geoPlaceName) other['geo.placename'] = pack.geoPlaceName;
  return { ...base, other };
}

export function buildPagePackJsonLdGraph(pack: PageSeoGeoPack): Array<Record<string, unknown>> {
  const graph: Array<Record<string, unknown>> = [];
  const crumbs = pack.breadcrumbs?.length
    ? pack.breadcrumbs
    : [
        { name: '首页', path: '/' },
        { name: pack.name, path: pack.path },
      ];
  graph.push(buildBreadcrumbJsonLd(crumbs));
  graph.push(
    buildServiceJsonLd({
      name: pack.name,
      description: pack.answerSummary || pack.description,
      path: pack.path,
      areaServed: pack.geoPlaceName
        ? [pack.geoPlaceName, '中国', '海外华人社区']
        : ['中国', '海外华人社区'],
    }),
  );
  if (pack.faqs.length) {
    graph.push(buildFaqJsonLd(pack.faqs));
  }
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pack.title,
    description: pack.description,
    url: absoluteUrl(pack.path),
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl('/') },
    about: pack.entityKeywords.slice(0, 12).map((name) => ({ '@type': 'Thing', name })),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-page-seo-answer]', 'h1'],
    },
  });
  return graph;
}

export function PageJsonLd({ pack }: { pack: PageSeoGeoPack }) {
  const graph = buildPagePackJsonLdGraph(pack);
  return (
    <>
      {graph.map((node, i) => (
        <JsonLd key={i} data={node} />
      ))}
    </>
  );
}

/**
 * Visible SEO/GEO body block for hub pages.
 * Place near bottom of public pages so crawlers and users get substance.
 */
export function PageSeoGeoSection({
  pathOrSlug,
  pack: packProp,
  compact = false,
}: {
  pathOrSlug?: string;
  pack?: PageSeoGeoPack | null;
  compact?: boolean;
}) {
  const pack = packProp || (pathOrSlug ? getPageSeoGeoPack(pathOrSlug) : null);
  if (!pack) return null;
  const geoOk = isPagePackGeoReady(pack);

  return (
    <section
      className="space-y-5 border-t border-[color:var(--hairline)] pt-8"
      aria-label={`${pack.name} 说明与常见问题`}
      data-page-seo={pack.slug}
      data-geo-ready={geoOk ? '1' : '0'}
    >
      <div
        className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
        data-page-seo-answer
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          直接回答 · SEO / GEO
        </p>
        <h2 className="mt-1 text-[17px] font-bold tracking-tight text-[color:var(--ink-1)] md:text-[19px]">
          {pack.name}是什么？
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)] md:text-[14px]">
          {pack.answerSummary}
        </p>
        {pack.searchIntents.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {pack.searchIntents.slice(0, 8).map((intent) => (
              <li
                key={intent}
                className="rounded-full border border-[color:var(--hairline)] px-2.5 py-0.5 text-[11px] text-[color:var(--ink-4)]"
              >
                {intent}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {!compact && pack.howTo.length > 0 ? (
        <div>
          <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">如何使用</h2>
          <ol className="mt-2 space-y-2">
            {pack.howTo.map((step, i) => (
              <li
                key={step.step}
                className="flex gap-3 rounded-lg border border-[color:var(--hairline)]/80 bg-[color:var(--bg-sunken)]/30 px-3 py-2"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--ink-1)] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-[color:var(--ink-1)]">{step.step}</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {pack.faqs.length > 0 ? (
        <div>
          <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">常见问题</h2>
          <div className="mt-2 divide-y divide-[color:var(--hairline)] rounded-xl border border-[color:var(--hairline)]">
            {pack.faqs.map((faq) => (
              <details key={faq.question} className="group px-3 py-2.5">
                <summary className="cursor-pointer list-none text-[13px] font-semibold text-[color:var(--ink-1)] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-2">
                    {faq.question}
                    <span className="text-[color:var(--ink-5)] group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      {pack.related.length > 0 ? (
        <div>
          <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">相关页面</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {pack.related.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg border border-[color:var(--hairline)] px-3 py-2.5 transition hover:bg-[color:var(--bg-sunken)]"
                >
                  <span className="text-[13px] font-semibold text-[color:var(--ink-1)]">{link.label}</span>
                  {link.description ? (
                    <span className="mt-0.5 block text-[11px] text-[color:var(--ink-5)]">
                      {link.description}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pack.disclaimer ? (
        <p className="text-[11px] leading-relaxed text-[color:var(--ink-5)]">{pack.disclaimer}</p>
      ) : (
        <p className="text-[11px] leading-relaxed text-[color:var(--ink-5)]">
          内容为结构与节奏参考，不构成投资、医疗、法律或婚姻保证。公开案例均经脱敏处理。
        </p>
      )}

      {!compact && pack.entityKeywords.length > 0 ? (
        <p className="text-[10px] leading-relaxed text-[color:var(--ink-5)]">
          相关概念：{pack.entityKeywords.join(' · ')}
        </p>
      ) : null}
    </section>
  );
}
