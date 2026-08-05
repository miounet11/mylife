/**
 * Shared result-page metadata builder for local shell + production page.
 * Production `app/result/[id]/page.tsx` is protected — import this helper when patching.
 */

import type { Metadata } from 'next';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { resultCopy } from '@/lib/i18n/funnel-copy';
import {
  localizePublicReportSeo,
  type PublicReportSeoLike,
} from '@/lib/i18n/public-report-seo';
import {
  absoluteUrl,
  buildPageMetadata,
  buildProductLanguageAlternates,
  withLocalePrefix,
} from '@/lib/seo';

export function buildResultPageMetadata(input: {
  id: string;
  locale: SiteLocale;
  /** Public SEO title from buildPublicReportSeo when available */
  publicTitle?: string | null;
  publicDescription?: string | null;
  patternType?: string | null;
  dayMaster?: string | null;
  isPublic?: boolean;
  /**
   * Quality-gate for search indexing. Shareable public shells may still be noindex
   * when thin (guest spam / incomplete analysis). Prefer /r canonical for indexable cases.
   */
  indexable?: boolean;
  /** Default `/result/:id`; summary entry uses `/r/:id` */
  pathBase?: '/result' | '/r';
}): Metadata {
  const copy = resultCopy(input.locale);
  const shortId = input.id.slice(0, 8);
  // Indexable public cases use /r as the share+search surface; full /result stays product.
  const preferredBase =
    input.pathBase
    || (input.isPublic !== false && input.indexable ? '/r' : '/result');
  const basePath = `${preferredBase}/${input.id}`;

  const localized = localizePublicReportSeo(
    {
      title: input.publicTitle || copy.metaTitle,
      description: input.publicDescription || copy.metaDescription,
      patternType: input.patternType || undefined,
      dayMaster: input.dayMaster || undefined,
    } satisfies PublicReportSeoLike,
    input.locale,
    input.id
  );

  const title = input.publicTitle
    ? `${localized.title} | ${copy.brandSuffix}`
    : `${copy.metaTitle} ${shortId}…`;
  const description = localized.description.slice(0, 200);

  // Private → always noindex. Public but thin → noindex. Only quality public cases index.
  const isPublic = input.isPublic !== false && input.isPublic !== undefined;
  const noIndex = !isPublic || input.indexable === false || input.indexable === undefined;

  return buildPageMetadata({
    title,
    description,
    path: withLocalePrefix(basePath, input.locale),
    locale: input.locale,
    noIndex,
    multiLanguage: !noIndex,
    languages: noIndex ? undefined : buildProductLanguageAlternates(basePath),
    keywords: [
      '结构判断报告',
      '人生K线',
      'structure report',
      'Life K-Line',
      'bazi report',
      'anonymous case',
      'timing map',
      '八字匿名案例',
      localized.patternType,
      localized.dayMaster,
      copy.brandSuffix,
    ].filter(Boolean),
  });
}

/** Absolute canonical for engines that still expect bare string. */
export function resultCanonicalUrl(id: string, locale: SiteLocale = 'zh-CN') {
  return absoluteUrl(withLocalePrefix(`/result/${id}`, locale));
}
